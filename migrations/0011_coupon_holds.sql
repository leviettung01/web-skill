-- Migration 0011 (SQLite/D1): Flash-sale coupon management, 10-minute temporary holds, disable default seeded coupons

ALTER TABLE coupons ADD COLUMN batch_name TEXT;

UPDATE coupons SET status = 'inactive' WHERE status = 'active';

CREATE TABLE IF NOT EXISTS coupon_holds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'held', -- held | consumed | released | expired
  expires_at TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coupon_holds_coupon_status ON coupon_holds(coupon_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_coupon_holds_order ON coupon_holds(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_holds_user ON coupon_holds(user_id, coupon_id, status);
