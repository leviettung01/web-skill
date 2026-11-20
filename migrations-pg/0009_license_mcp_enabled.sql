-- Migration 0009 (PostgreSQL): Allow customers to toggle specific MCP Skills on/off for their connected AI

ALTER TABLE licenses ADD COLUMN IF NOT EXISTS mcp_enabled INTEGER NOT NULL DEFAULT 1;
