-- Migration 0009 (SQLite/D1): Allow customers to toggle specific MCP Skills on/off for their connected AI

ALTER TABLE licenses ADD COLUMN mcp_enabled INTEGER NOT NULL DEFAULT 1;
