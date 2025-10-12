import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { getCarById, updateCar, deleteCar } from '@/lib/db'

// =====================================================
// GET /api/cars/[id] - получить одно авто
// =====================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`📖 [GET /api/cars/${id}] Получаем авто...`)

    const car = await getCarById(id)

    if (!car) {
      console.log(`❌ [GET] Авто не найдено: ${id}`)
      return NextResponse.json(
        { error: 'Авто не найдено' },
        { status: 404 }
      )
    }

    console.log(`✅ [GET] Авто найдено: ${car.brand} ${car.model}`)
    return NextResponse.json(car)
  } catch (error) {
    console.error('❌ [GET] Ошибка:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении авто' },
      { status: 500 }
    )
  }
}

// =====================================================
// PUT /api/cars/[id] - редактировать авто (только админ)
// =====================================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔐 [PUT] Проверяем авторизацию...')
    
    // Проверяем авторизацию
    const admin = await getAuthAdmin()
    if (!admin) {
      console.log('❌ [PUT] Админ не авторизован')
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    console.log(`✅ [PUT] Админ авторизован: ${admin.email}`)

    const { id } = await params
    console.log(`✏️ [PUT /api/cars/${id}] Редактируем авто...`)

    // Получаем данные для обновления
    const body = await req.json()
    console.log(`📦 [PUT] Получены данные:`, Object.keys(body))

    // Формируем объект с обновлениями (только переданные поля)
    const updates: any = {}

    if (body.brand !== undefined) updates.brand = body.brand
    if (body.model !== undefined) updates.model = body.model
    if (body.badge !== undefined) updates.badge = body.badge
    if (body.year !== undefined) updates.year = body.year
    if (body.price !== undefined) updates.price = body.price
    if (body.mileage !== undefined) updates.mileage = body.mileage
    if (body.vin !== undefined) updates.vin = body.vin
    if (body.fuel !== undefined) updates.fuel = body.fuel
    if (body.transmission !== undefined) updates.transmission = body.transmission
    if (body.description !== undefined) updates.description = body.description
    if (body.image_urls !== undefined) updates.image_urls = body.image_urls
    if (body.status !== undefined) updates.status = body.status

    console.log(`⏳ [PUT] Обновляем в БД:`, Object.keys(updates))

    // Обновляем авто в БД
    const updatedCar = await updateCar(id, updates)

    console.log(`✅ [PUT] Авто успешно обновлено: ${updatedCar.brand} ${updatedCar.model}`)
    
    return NextResponse.json(updatedCar, { status: 200 })
  } catch (error) {
    console.error('❌ [PUT] Ошибка:', error)
    
    let errorMessage = 'Ошибка при обновлении авто'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// =====================================================
// DELETE /api/cars/[id] - удалить авто (только админ)
// =====================================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔐 [DELETE] Проверяем авторизацию...')

    // Проверяем авторизацию
    const admin = await getAuthAdmin()
    if (!admin) {
      console.log('❌ [DELETE] Админ не авторизован')
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    console.log(`✅ [DELETE] Админ авторизован: ${admin.email}`)

    const { id } = await params
    console.log(`🗑️ [DELETE /api/cars/${id}] Начинаем удаление...`)

    // Проверяем что авто существует
    console.log(`🔍 [DELETE] Проверяем существование авто: ${id}`)
    const car = await getCarById(id)
    
    if (!car) {
      console.log(`❌ [DELETE] Авто не найдено: ${id}`)
      return NextResponse.json(
        { error: 'Авто не найдено' },
        { status: 404 }
      )
    }

    console.log(`📋 [DELETE] Найдено авто для удаления: ${car.brand} ${car.model}`)

    // Удаляем авто из БД
    console.log(`⏳ [DELETE] Удаляем из БД...`)
    await deleteCar(id)

    console.log(`✅ [DELETE] Авто успешно удалено: ${car.brand} ${car.model}`)
    
    return NextResponse.json(
      { 
        message: 'Авто успешно удалено',
        deleted_car: {
          id: car.id,
          brand: car.brand,
          model: car.model
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ [DELETE] Неожиданная ошибка:', error)
    
    let errorMessage = 'Ошибка при удалении авто'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}