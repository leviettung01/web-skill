-- ============================================================
-- Migration 0002: Tích hợp webhook biến động số dư ngân hàng
-- Hỗ trợ: SePay (sepay.vn) và Casso (casso.vn)
-- ============================================================

-- Bảng lưu toàn bộ giao dịch ngân hàng nhận từ webhook (nguồn sự thật để đối soát)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL DEFAULT 'sepay',      -- sepay | casso | manual
  provider_tx_id TEXT,                          -- id giao dịch phía provider (chống trùng)
  gateway TEXT,                                 -- tên ngân hàng: MB, VCB, ACB...
  account_number TEXT,                          -- số tài khoản nhận
  transaction_date DATETIME,                    -- thời điểm giao dịch tại bank
  amount_in INTEGER NOT NULL DEFAULT 0,         -- tiền vào (VND)
  amount_out INTEGER NOT NULL DEFAULT 0,        -- tiền ra (VND)
  accumulated INTEGER DEFAULT 0,                -- số dư sau giao dịch
  content TEXT,                                 -- nội dung chuyển khoản (chứa mã đơn)
  reference_code TEXT,                          -- mã tham chiếu / SMS ref
  matched_order_id INTEGER,                     -- đơn hàng khớp được
  matched_order_code TEXT,                      -- mã đơn tách từ nội dung CK
  match_status TEXT NOT NULL DEFAULT 'unmatched',
    -- unmatched: chưa tìm được đơn
    -- matched:   khớp đơn & đã cấp hàng
    -- amount_mismatch: đúng đơn nhưng sai số tiền
    -- duplicate: đơn đã thanh toán trước đó
    -- ignored: giao dịch tiền ra / không liên quan
  note TEXT,
  raw_payload TEXT,                             -- JSON gốc để debug/đối soát
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_banktx_provider_tx
  ON bank_transactions(provider, provider_tx_id);
CREATE INDEX IF NOT EXISTS idx_banktx_order ON bank_transactions(matched_order_code);
CREATE INDEX IF NOT EXISTS idx_banktx_status ON bank_transactions(match_status);
CREATE INDEX IF NOT EXISTS idx_banktx_date ON bank_transactions(transaction_date);

-- Bổ sung thông tin thanh toán cho đơn hàng
ALTER TABLE orders ADD COLUMN paid_amount INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN paid_via TEXT;          -- webhook | balance | admin | manual
ALTER TABLE orders ADD COLUMN bank_tx_id INTEGER;     -- liên kết bank_transactions.id
ALTER TABLE orders ADD COLUMN expires_at DATETIME;    -- hạn thanh toán (huỷ đơn quá hạn)

-- Cấu hình webhook (bổ sung vào settings)
INSERT OR IGNORE INTO settings (key, value) VALUES
  ('payment_provider', 'sepay'),          -- sepay | casso | manual
  ('webhook_api_key', 'CHANGE_ME_SECRET'),-- token xác thực webhook (Bearer / Secure-Token)
  ('auto_confirm_manual', '0'),           -- 0 = TẮT nút tự xác nhận (bắt buộc chờ webhook)
  ('payment_timeout_minutes', '60'),      -- thời gian giữ đơn
  ('amount_tolerance', '0');              -- sai số cho phép (VND), 0 = khớp tuyệt đối
