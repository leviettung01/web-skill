#!/usr/bin/env python3
"""Deploy WebSkill AI to Cloudflare Pages + D1 using the REST API only.

Mirrors what `wrangler pages deploy dist` does:
  1. Verify API token, pick account
  2. Create D1 database (or reuse), run migrations + seed
  3. Create Pages project (or reuse)
  4. Direct-upload: hash files (sha256), check-missing, upload missing, upsert-hashes
  5. Create deployment (manifest + _worker.bundle + _routes.json)
  6. Attach D1 binding DB to the project
"""
import base64
import hashlib
import json
import mimetypes
import os
import re
import sys
import time
import urllib.request
import urllib.error

sys.path.insert(0, "/opt/muse/skills/custom-connector-setup/bin")
from dynamic_credentials import add_surrogate_to_request, read_response_body

API = "https://api.cloudflare.com/client/v4"
CONN = "custom.cloudflare"
HOSTS = ["api.cloudflare.com"]
ENV_TOKEN = os.environ.get("CF_TOKEN", "").strip()  # direct token (transient), else vault surrogate
ENV_ACCOUNT = os.environ.get("CF_ACCOUNT_ID", "").strip()  # skip /accounts listing
ENV_GKEY = os.environ.get("CF_GLOBAL_KEY", "").strip()  # Global API Key (transient)
ENV_EMAIL = os.environ.get("CF_EMAIL", "").strip()  # account email for Global API Key
SITE = os.path.expanduser("~/workspace/web-skill-site")
DIST = os.path.join(SITE, "dist")
PROJECT = "webskill-ai"
DB_NAME = "webapp-production"
MAX_ASSET = 25 * 1024 * 1024
IGNORE = {"_worker.js", "_redirects", "_headers", "_routes.json", "functions",
          ".wrangler", ".git", "node_modules", ".DS_Store"}


class ApiError(Exception):
    pass


def _raw(method, url, body=None, headers=None, timeout=180):
    h = dict(headers or {})
    data = None
    if body is not None:
        if isinstance(body, (dict, list)):
            data = json.dumps(body).encode()
            h.setdefault("Content-Type", "application/json")
        elif isinstance(body, str):
            data = body.encode()
            h.setdefault("Content-Type", "application/json")
        else:
            data = body
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    if ENV_GKEY and ENV_EMAIL:
        req.add_header("X-Auth-Email", ENV_EMAIL)
        req.add_header("X-Auth-Key", ENV_GKEY)
    elif ENV_TOKEN:
        req.add_header("Authorization", "Bearer " + ENV_TOKEN)
    else:
        add_surrogate_to_request(req, CONN, allowed_hosts=HOSTS)
    try:
        with urllib.request.build_opener().open(req, timeout=timeout) as resp:
            return resp.status, read_response_body(resp)
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def _raw_jwt(method, url, jwt, body=None, timeout=180):
    h = {"Authorization": f"Bearer {jwt}"}
    data = None
    if body is not None:
        data = json.dumps(body).encode() if isinstance(body, (dict, list)) else body
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=h, method=method)
    try:
        with urllib.request.build_opener().open(req, timeout=timeout) as resp:
            return resp.status, read_response_body(resp)
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def cf(method, path, body=None):
    status, raw = _raw(method, API + path, body)
    try:
        res = json.loads(raw.decode())
    except Exception:
        raise ApiError(f"{method} {path} -> HTTP {status}: {raw[:400]!r}")
    if not res.get("success"):
        raise ApiError(f"{method} {path} -> HTTP {status}: {json.dumps(res.get('errors'))[:600]}")
    return res["result"]


def cf_jwt(method, path, jwt, body=None):
    status, raw = _raw_jwt(method, API + path, jwt, body)
    try:
        res = json.loads(raw.decode())
    except Exception:
        raise ApiError(f"JWT {method} {path} -> HTTP {status}: {raw[:400]!r}")
    if isinstance(res, dict) and res.get("success") is False:
        raise ApiError(f"JWT {method} {path} -> HTTP {status}: {json.dumps(res.get('errors'))[:600]}")
    return res["result"] if isinstance(res, dict) and "result" in res else res


def step(msg):
    print(f"\n=== {msg} ===", flush=True)


# ---------- 1. auth + account ----------
step("Verify token & pick account")
cf("GET", "/user/tokens/verify")
if ENV_ACCOUNT:
    AID = ENV_ACCOUNT
    print("account (from env):", AID)
else:
    accounts = cf("GET", "/accounts")
    if not accounts:
        raise ApiError("No Cloudflare accounts found")
    account = accounts[0]
    AID = account["id"]
    print("account:", account.get("name"), AID)

# ---------- 2. D1 ----------
step("D1 database")
dbs = cf("GET", f"/accounts/{AID}/d1/database")
db = next((d for d in dbs if d.get("name") == DB_NAME), None)
if db:
    print("reuse D1:", db["uuid"])
else:
    db = cf("POST", f"/accounts/{AID}/d1/database", {"name": DB_NAME})
    print("created D1:", db["uuid"])
DBID = db["uuid"]


def strip_comments(sql):
    out = []
    for line in sql.splitlines():
        s = line.strip()
        if s.startswith("--"):
            continue
        out.append(line)
    return "\n".join(out)


def run_sql_file(path, label):
    sql = open(path, encoding="utf-8").read()
    sql = strip_comments(sql).strip()
    if not sql.endswith(";"):
        sql += ";"
    print(f"executing {label} ({len(sql)} bytes)...", flush=True)
    res = cf("POST", f"/accounts/{AID}/d1/database/{DBID}/query", {"sql": sql})
    n = len(res) if isinstance(res, list) else 1
    print(f"  ok, {n} statement result(s)")


step("Migrations + seed")
run_sql_file(os.path.join(SITE, "migrations", "0001_initial_schema.sql"), "0001")
run_sql_file(os.path.join(SITE, "migrations", "0002_bank_webhook.sql"), "0002")
run_sql_file(os.path.join(SITE, "seed.sql"), "seed")
cnt = cf("POST", f"/accounts/{AID}/d1/database/{DBID}/query",
         {"sql": "SELECT COUNT(*) AS n FROM products;"})
print("products in remote DB:", cnt[0]["results"][0]["n"])

# ---------- 3. Pages project ----------
step("Pages project")
projs = cf("GET", f"/accounts/{AID}/pages/projects")
proj = next((p for p in projs if p.get("name") == PROJECT), None)
if proj:
    print("reuse project:", proj["name"])
else:
    proj = cf("POST", f"/accounts/{AID}/pages/projects",
              {"name": PROJECT, "production_branch": "main"})
    print("created project:", proj["name"])

# ---------- 4. direct upload ----------
step("Upload token")
jwt = cf("GET", f"/accounts/{AID}/pages/projects/{PROJECT}/upload-token")["jwt"]
print("jwt ok")


def walk(dist):
    files = {}  # relpath -> {path, size, hash, contentType}
    for root, dirs, names in os.walk(dist):
        dirs[:] = [d for d in dirs if d not in IGNORE and not d.startswith(".")]
        for name in names:
            if name in IGNORE or name.startswith("."):
                continue
            fp = os.path.join(root, name)
            if os.path.islink(fp):
                continue
            rel = os.path.relpath(fp, dist).replace(os.sep, "/")
            size = os.path.getsize(fp)
            if size > MAX_ASSET:
                raise ApiError(f"file too large: {rel} ({size})")
            h = hashlib.sha256()
            with open(fp, "rb") as f:
                for chunk in iter(lambda: f.read(1 << 20), b""):
                    h.update(chunk)
            ctype = mimetypes.guess_type(name)[0] or "application/octet-stream"
            files[rel] = {"path": fp, "size": size, "hash": h.hexdigest(),
                          "contentType": ctype}
    return files


step("Hash files")
files = walk(DIST)
print(f"{len(files)} files, {sum(f['size'] for f in files.values()) / 1e6:.1f} MB")

step("Check missing")
missing = set(cf_jwt("POST", "/pages/assets/check-missing", jwt,
                     {"hashes": [f["hash"] for f in files.values()]}))
print(f"{len(missing)} new blobs to upload")
todo = [f for f in files.values() if f["hash"] in missing]
todo.sort(key=lambda f: -f["size"])

step("Upload blobs")
BATCH_FILES, BATCH_BYTES = 20, 30 * 1024 * 1024
batch, bsize = [], 0
done_n, done_b = 0, 0
t0 = time.time()


def flush():
    global done_n, done_b
    if not batch:
        return
    payload = []
    for f in batch:
        with open(f["path"], "rb") as fh:
            payload.append({"key": f["hash"],
                            "value": base64.b64encode(fh.read()).decode(),
                            "metadata": {"contentType": f["contentType"]},
                            "base64": True})
    for attempt in range(4):
        try:
            cf_jwt("POST", "/pages/assets/upload", jwt, payload, )
            break
        except ApiError as e:
            if attempt == 3:
                raise
            time.sleep(2 ** attempt)
    done_n += len(batch)
    done_b += sum(f["size"] for f in batch)
    print(f"  uploaded {done_n} files ({done_b / 1e6:.1f} MB)", flush=True)


for f in todo:
    if len(batch) >= BATCH_FILES or bsize + f["size"] > BATCH_BYTES:
        flush()
        batch, bsize = [], 0
    batch.append(f)
    bsize += f["size"]
flush()
print(f"upload done in {time.time() - t0:.0f}s")

step("Upsert hashes")
try:
    cf_jwt("POST", "/pages/assets/upsert-hashes", jwt,
           {"hashes": [f["hash"] for f in files.values()]})
except ApiError as e:
    print("  warning (non-fatal):", e)


# ---------- 5. deployment ----------
def multipart(fields, files_):
    """fields: [(name, str)], files_: [(name, filename, bytes, ctype)] -> (body, ctype)"""
    b = "----muse" + hashlib.sha256(os.urandom(16)).hexdigest()[:16]
    out = bytearray()
    for name, val in fields:
        out += f"--{b}\r\nContent-Disposition: form-data; name=\"{name}\"\r\n\r\n".encode()
        out += val.encode() + b"\r\n"
    for name, filename, data, ctype in files_:
        out += (f"--{b}\r\nContent-Disposition: form-data; name=\"{name}\"; "
                f"filename=\"{filename}\"\r\nContent-Type: {ctype}\r\n\r\n").encode()
        out += data + b"\r\n"
    out += f"--{b}--\r\n".encode()
    return bytes(out), f"multipart/form-data; boundary={b}"


step("Build _worker.bundle")
worker_path = os.path.join(DIST, "_worker.js")
worker_src = open(worker_path, "rb").read()
inner_body, inner_ct = multipart(
    [("metadata", json.dumps({"main_module": "_worker.js"}))],
    [("_worker.js", "_worker.js", worker_src, "application/javascript+module")])
print(f"worker bundle: {len(inner_body) / 1e3:.0f} KB")

step("Create deployment")
manifest = {"/" + rel: f["hash"] for rel, f in files.items()}
fields = [("manifest", json.dumps(manifest))]
upfiles = [("_worker.bundle", "_worker.bundle", inner_body, inner_ct)]
routes_path = os.path.join(DIST, "_routes.json")
if os.path.exists(routes_path):
    upfiles.append(("_routes.json", "_routes.json",
                    open(routes_path, "rb").read(), "application/json"))
body, ctype = multipart(fields, upfiles)
status, raw = _raw("POST", f"{API}/accounts/{AID}/pages/projects/{PROJECT}/deployments",
                   body, headers={"Content-Type": ctype}, )
try:
    res = json.loads(raw.decode())
except Exception:
    raise ApiError(f"deploy -> HTTP {status}: {raw[:400]!r}")
if not res.get("success"):
    raise ApiError(f"deploy -> HTTP {status}: {json.dumps(res.get('errors'))[:800]}")
dep = res["result"]
print("deployed:", dep.get("url"))
print("id:", dep.get("id"))

# ---------- 6. D1 binding ----------
step("Attach D1 binding")
bound = False
for shape in [
    {"deployment_configs": {
        "production": {"d1_databases": {"DB": {"id": DBID}}},
        "preview": {"d1_databases": {"DB": {"id": DBID}}}}},
]:
    try:
        cf("PATCH", f"/accounts/{AID}/pages/projects/{PROJECT}", shape)
        bound = True
        print("D1 binding attached via API")
        break
    except ApiError as e:
        print("  binding shape rejected:", str(e)[:200])

print("\n===== DONE =====")
print("URL:", dep.get("url"))
if not bound:
    print("TODO (1 click): dash.cloudflare.com -> Workers & Pages -> webskill-ai -> "
          "Settings -> Bindings -> Add D1 binding, variable name DB")
