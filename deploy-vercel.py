#!/usr/bin/env python3
"""
Deploy WebSkill AI to Vercel via REST API (Windows & Cross-platform compatible).
Uses Vercel API token and sets Postgres env vars.
"""
import base64
import hashlib
import json
import mimetypes
import os
import sys
import time
import urllib.request
import urllib.error

API = "https://api.vercel.com"
SITE = os.path.dirname(os.path.abspath(__file__))
PROJECT = "webskill-ai"
TOKEN = os.environ.get("VERCEL_TOKEN", "").strip()
POSTGRES_URL = os.environ.get("POSTGRES_URL", "").strip()

if not TOKEN:
    sys.exit("VERCEL_TOKEN env var required")


def req(method, path, body=None, headers=None, raw=False, timeout=120):
    h = dict(headers or {})
    h["Authorization"] = f"Bearer {TOKEN}"
    data = None
    if body is not None:
        if raw:
            data = body
        else:
            data = json.dumps(body).encode()
            h.setdefault("Content-Type", "application/json")
    r = urllib.request.Request(API + path, data=data, headers=h, method=method)
    try:
        with urllib.request.build_opener().open(r, timeout=timeout) as resp:
            out = resp.read()
            return resp.status, json.loads(out.decode()) if out else {}
    except urllib.error.HTTPError as e:
        eb = e.read().decode()
        raise RuntimeError(f"{method} {path} -> HTTP {e.code}: {eb[:600]}")


def step(msg):
    print(f"\n=== {msg} ===", flush=True)


# ---------- 1. project ----------
step("Vercel project check / create")
try:
    _, proj = req("GET", f"/v9/projects/{PROJECT}")
    print("Project exists:", proj.get("id"), proj.get("name"))
except RuntimeError as e:
    if "404" not in str(e):
        raise
    _, proj = req("POST", "/v9/projects", {"name": PROJECT})
    print("Project created:", proj.get("id"))
PID = proj["id"]

# ---------- 2. build the function bundle ----------
step("Build api/index.js bundle with esbuild")
fn_path = os.path.join(SITE, "api", "index.js")
cmd = (
    f'npx esbuild api/index.ts --bundle --platform=node --format=esm '
    f'--jsx=automatic --jsx-import-source=hono/jsx --outfile="{fn_path}" --log-level=error'
)
code = os.system(f'cd "{SITE}" && {cmd}')
if code != 0 or not os.path.exists(fn_path):
    # Try direct without cd
    os.system(cmd)
assert os.path.exists(fn_path), f"Bundle failed at {fn_path}"
print("Bundle created:", round(os.path.getsize(fn_path) / 1024, 1), "KB")

# ---------- 3. collect files ----------
step("Collect files to deploy")
files = []  # (deploy_path, local_path)
files.append(("api/index.js", fn_path))
files.append(("vercel.json", os.path.join(SITE, "vercel.json")))
pub = os.path.join(SITE, "public")
for root, _dirs, names in os.walk(pub):
    for n in names:
        lp = os.path.join(root, n)
        rel = os.path.relpath(lp, SITE).replace("\\", "/")  # public/...
        files.append((rel, lp))
print(f"{len(files)} files, {round(sum(os.path.getsize(l) for _, l in files) / 1024 / 1024, 2)} MB")

# ---------- 4. upload via /v2/files ----------
step("Upload files to Vercel")
entries = []
for i, (dpath, lpath) in enumerate(files):
    with open(lpath, "rb") as f:
        data = f.read()
    sha = hashlib.sha1(data).hexdigest()
    try:
        req("POST", "/v2/files", data, headers={
            "Content-Type": "application/octet-stream",
            "x-vercel-digest": sha,
            "x-vercel-size": str(len(data)),
        }, raw=True, timeout=300)
    except RuntimeError as e:
        if "400" not in str(e) and "409" not in str(e):
            raise
    entries.append({"file": dpath.replace("\\", "/"), "sha": sha})
    if (i + 1) % 5 == 0 or i + 1 == len(files):
        print(f"  Uploaded {i + 1}/{len(files)}", flush=True)

# ---------- 5. project env vars ----------
if POSTGRES_URL:
    step("Configure project environment variables")
    _, existing = req("GET", f"/v9/projects/{PID}/env")
    have = {e["key"] for e in existing.get("envs", [])}
    for k, v in [("POSTGRES_URL", POSTGRES_URL), ("DATABASE_URL", POSTGRES_URL)]:
        if k in have:
            print(f"  {k}: already set")
            continue
        req("POST", f"/v10/projects/{PID}/env",
            {"key": k, "value": v, "type": "encrypted",
             "target": ["production", "preview", "development"]})
        print(f"  {k}: configured")

# ---------- 6. create deployment ----------
step("Create production deployment")
payload = {
    "name": PROJECT,
    "project": PID,
    "target": "production",
    "files": entries,
    "projectSettings": {"framework": None},
}
if POSTGRES_URL:
    payload["env"] = {
        "POSTGRES_URL": POSTGRES_URL,
        "DATABASE_URL": POSTGRES_URL
    }
_, dep = req("POST", "/v13/deployments", payload, timeout=300)
dep_id = dep["id"]
print(f"Deployment initiated: {dep_id} (status: {dep.get('status')})")

# ---------- 7. poll ----------
step("Waiting for deployment to be READY...")
for i in range(60):
    time.sleep(6)
    _, d = req("GET", f"/v13/deployments/{dep_id}")
    st = d.get("status")
    print(f"  Status ({i * 6}s): {st}", flush=True)
    if st == "READY":
        break
    if st == "ERROR":
        raise RuntimeError(f"Deployment failed: {json.dumps(d)[:1000]}")
else:
    raise RuntimeError("Deployment timed out")

url = d.get("url")
print(f"\n🎉 DEPLOYMENT SUCCESSFUL!")
print(f"Production URL: https://{url}")
print(f"Main Alias: https://webskill-ai.vercel.app/")
