-- ============================================
-- SRCTOOL AI - Database Schema
-- ============================================

-- Người dùng
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user',          -- user | admin
  balance INTEGER NOT NULL DEFAULT 0,          -- số dư ví (VND)
  affiliate_code TEXT UNIQUE,
  referred_by INTEGER,
  affiliate_earned INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',       -- active | banned
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_aff ON users(affiliate_code);

-- Danh mục
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'fa-cube',
  color TEXT DEFAULT 'indigo',
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sản phẩm (source code / tool / chatbot / prompt)
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id INTEGER,
  short_desc TEXT,
  description TEXT,                -- HTML/markdown mô tả dài
  features TEXT,                   -- JSON array
  tech_stack TEXT,                 -- JSON array
  version TEXT DEFAULT 'v1.0',
  price INTEGER NOT NULL DEFAULT 0,
  original_price INTEGER,
  thumbnail TEXT,
  gallery TEXT,                    -- JSON array ảnh
  demo_video_url TEXT,             -- youtube embed
  demo_url TEXT,                   -- link demo live
  download_url TEXT,               -- LINK SOURCE CODE (chỉ trả sau khi mua)
  doc_url TEXT,                    -- link tài liệu hướng dẫn
  file_size TEXT,
  product_type TEXT DEFAULT 'source', -- source | chatbot | prompt | combo | tool
  is_featured INTEGER DEFAULT 0,
  is_hot INTEGER DEFAULT 0,
  is_new INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published', -- published | draft
  sold_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  rating REAL DEFAULT 5.0,
  rating_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Combo bundle: sản phẩm con trong combo
CREATE TABLE IF NOT EXISTS combo_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  combo_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  FOREIGN KEY (combo_id) REFERENCES products(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Đơn hàng
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_code TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  subtotal INTEGER NOT NULL,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  coupon_code TEXT,
  payment_method TEXT DEFAULT 'bank',   -- bank | momo | balance
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | cancelled | refunded
  note TEXT,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IF NOT EXISTS idx_oitems_order ON order_items(order_id);

-- Quyền sở hữu / license (giao source code)
CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  order_id INTEGER,
  license_key TEXT UNIQUE NOT NULL,
  download_count INTEGER DEFAULT 0,
  last_download_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IF NOT EXISTS idx_lic_user ON licenses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lic_uniq ON licenses(user_id, product_id);

-- Đánh giá
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  status TEXT DEFAULT 'approved',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_rev_prod ON reviews(product_id);

-- Mã giảm giá
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'percent',  -- percent | fixed
  value INTEGER NOT NULL,
  min_order INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 0,            -- 0 = unlimited
  used_count INTEGER DEFAULT 0,
  expires_at DATETIME,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Blog
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  thumbnail TEXT,
  tags TEXT,
  view_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Giỏ hàng (server-side, đồng bộ đa thiết bị)
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cart_uniq ON cart_items(user_id, product_id);

-- Yêu thích
CREATE TABLE IF NOT EXISTS wishlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wish_uniq ON wishlists(user_id, product_id);

-- Cấu hình site
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Ticket hỗ trợ
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT,
  email TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  reply TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
