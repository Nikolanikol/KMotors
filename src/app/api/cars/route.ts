import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { getAllCars, createCar } from '@/lib/db'
import { Car } from '@/lib/supabase'

// GET - получить все авто (для SSG генерации!)
export async function GET() {
  try {
    const cars = await getAllCars()
    return NextResponse.json(cars)
  } catch (error) {
    console.error('Get cars error:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении авто' },
      { status: 500 }
    )
  }
}

// POST - создать новое авто (только админ)
export async function POST(req: NextRequest) {
  try {
    const admin = await getAuthAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const body = await req.json()

    const newCar: Omit<Car, 'id' | 'created_at' | 'updated_at'> = {
      brand: body.brand,
      model: body.model,
      badge: body.badge,
      year: body.year,
      price: body.price,
      mileage: body.mileage,
      vin: body.vin,
      fuel: body.fuel,
      transmission: body.transmission,
      description: body.description,
      image_urls: body.image_urls || [],
      status: body.status || 'available',
    }

    const car = await createCar(newCar)
    
    // Триггер для пересборки SSG!
    // Используй этот эндпоинт для on-demand revalidation
    return NextResponse.json(car, { status: 201 })
  } catch (error) {
    console.error('Create car error:', error)
    return NextResponse.json(
      { error: 'Ошибка при создании авто' },
      { status: 500 }
    )
  }
}