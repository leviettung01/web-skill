export type Bindings = {
  DB: D1Database
  JWT_SECRET?: string
  RESEND_API_KEY?: string
  EMAIL_FROM?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
  SITE_URL?: string
}

export type Variables = {
  user: SessionUser | null
  settings: Record<string, string>
  cartCount: number
  unreadNotifs: number
}

export interface SessionUser {
  id: number
  email: string
  full_name: string
  role: string
  avatar_url?: string | null
  email_verified?: number
}

export interface Product {
  id: number
  slug: string
  name: string
  category_id: number
  category_name?: string
  category_slug?: string
  short_desc: string
  description: string
  features: string
  tech_stack: string
  version: string
  price: number
  original_price: number | null
  thumbnail: string | null
  gallery: string | null
  demo_video_url: string | null
  demo_url: string | null
  download_url: string | null
  doc_url: string | null
  file_size: string | null
  product_type: string
  mcp_endpoint?: string | null
  mcp_server_name?: string | null
  mcp_clients?: string | null
  mcp_tools?: string | null
  mcp_skill_prompt?: string | null
  mcp_render_webhook?: string | null
  is_featured: number
  is_hot: number
  is_new: number
  status: string
  sold_count: number
  view_count: number
  rating: number
  rating_count: number
  created_at: string
}

export interface Category {
  id: number
  slug: string
  name: string
  description: string
  icon: string
  color: string
  product_count?: number
}

export interface Order {
  id: number
  order_code: string
  user_id: number
  subtotal: number
  discount: number
  total: number
  coupon_code: string | null
  payment_method: string
  status: string
  note: string | null
  paid_at: string | null
  created_at: string
}
