'use server'

import { supabaseServer } from './supabase'
import { Car, CarView, Admin } from './supabase'
import { hashPassword, verifyPassword } from './auth'

// ==================== CARS ====================

export async function getAllCars(): Promise<Car[]> {
  const { data, error } = await supabaseServer
    .from('cars')
    .select('*')
    .order('created_at', { ascending: false })
    console.log(data, 'data from db cars route getAllCars')
  if (error) throw new Error(`Ошибка при получении авто: ${error.message}`)
  return data || []
}

export async function getAvailableCars(): Promise<Car[]> {
  const { data, error } = await supabaseServer
    .from('cars')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Ошибка: ${error.message}`)
  return data || []
}

export async function getCarById(id: string): Promise<Car | null> {
  const { data, error } = await supabaseServer
    .from('cars')
    .select('*')
    .eq('id', id)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function createCar(car: Omit<Car, 'id' | 'created_at' | 'updated_at'>): Promise<Car> {
  const { data, error } = await supabaseServer
    .from('cars')
    .insert([car])
    .select()
    .single()

  if (error) throw new Error(`Ошибка при создании авто: ${error.message}`)
  
  // Создаём запись просмотров
  await supabaseServer
    .from('car_views')
    .insert([{ car_id: data.id, view_count: 0 }])

  return data
}

export async function updateCar(id: string, updates: Partial<Car>): Promise<Car> {
  const { data, error } = await supabaseServer
    .from('cars')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Ошибка при обновлении авто: ${error.message}`)
  return data
}

export async function deleteCar(id: string): Promise<void> {
  const { error } = await supabaseServer
    .from('cars')
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Ошибка при удалении авто: ${error.message}`)
}

// ==================== VIEWS ====================

export async function getCarViews(carId: string): Promise<CarView | null> {
  const { data, error } = await supabaseServer
    .from('car_views')
    .select('*')
    .eq('car_id', carId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function incrementCarViews(carId: string): Promise<void> {
  const existing = await getCarViews(carId)

  if (existing) {
    await supabaseServer
      .from('car_views')
      .update({
        view_count: existing.view_count + 1,
        last_viewed: new Date().toISOString(),
      })
      .eq('car_id', carId)
  } else {
    await supabaseServer
      .from('car_views')
      .insert([{
        car_id: carId,
        view_count: 1,
        last_viewed: new Date().toISOString(),
      }])
  }
}

export async function getAllViewsStats(): Promise<(CarView & { car: Car })[]> {
  const { data, error } = await supabaseServer
    .from('car_views')
    .select(`
      *,
      car:cars(id, brand, model, year, price)
    `)
    .order('view_count', { ascending: false })

  if (error) throw new Error(`Ошибка при получении статистики: ${error.message}`)
  return data || []
}

// ==================== ADMINS ====================

export async function getAdminByEmail(email: string): Promise<Admin | null> {
  const { data, error } = await supabaseServer
    .from('admins')
    .select('*')
    .eq('email', email)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

export async function createAdmin(
  email: string,
  password: string
): Promise<Admin> {
  const existingAdmin = await getAdminByEmail(email)
  if (existingAdmin) throw new Error('Админ с таким email уже существует')

  const passwordHash = await hashPassword(password)

  const { data, error } = await supabaseServer
    .from('admins')
    .insert([{ email, password_hash: passwordHash }])
    .select()
    .single()

  if (error) throw new Error(`Ошибка при создании админа: ${error.message}`)
  return data
}

export async function verifyAdmin(
  email: string,
  password: string
): Promise<Admin | null> {
  const admin = await getAdminByEmail(email)
  if (!admin) return null

  const isValid = await verifyPassword(password, admin.password_hash)
  return isValid ? admin : null
}