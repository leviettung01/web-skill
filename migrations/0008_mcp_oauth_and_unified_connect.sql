-- Migration 0008 (SQLite/D1): Unified Account MCP Token & OAuth 2.1 Connections for Claude / ChatGPT / Claude Code / Codex / Antigravity

ALTER TABLE users ADD COLUMN mcp_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_mcp_token ON users(mcp_token) WHERE mcp_token IS NOT NULL;

CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  redirect_uris TEXT NOT NULL,
  client_domain TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mcp_oauth_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_domain TEXT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  redirect_uri TEXT NOT NULL,
  code_challenge TEXT,
  code_challenge_method TEXT,
  scope TEXT DEFAULT 'mcp',
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mcp_oauth_codes_user ON mcp_oauth_codes(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mcp_connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  client_id TEXT,
  client_name TEXT NOT NULL,
  client_domain TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  revoked_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_mcp_connections_user_active ON mcp_connections(user_id, revoked_at, id DESC);
