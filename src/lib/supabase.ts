import { createClient } from '@supabase/supabase-js'

// Клиент для фронтенда (безопасно публиковать ANON_KEY)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Серверный клиент (приватный SERVICE_ROLE_KEY)
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Типы для TypeScript
export interface Car {
  id: string
  brand: string
  model: string
  badge?: string
  year: number
  price: number
  mileage: number
  vin?: string
  fuel: string
  transmission: string
  description?: string
  image_urls: string[]
  status: 'available' | 'sold'
  created_at: string
  updated_at: string
}

export interface CarView {
  id: string
  car_id: string
  view_count: number
  last_viewed: string
}

export interface Admin {
  id: string
  email: string
  password_hash: string
  created_at: string
}