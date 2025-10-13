import { NextRequest, NextResponse } from 'next/server'
import { incrementCarViews, getCarViews } from '@/lib/db'

// =====================================================
// POST /api/views/[id] - увеличить счетчик просмотров
// =====================================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`👁️ [POST /api/views/${id}] Записываем просмотр...`)

    // Увеличиваем счетчик
    await incrementCarViews(id)

    console.log(`✅ [POST] Просмотр зафиксирован для авто: ${id}`)

    return NextResponse.json(
      { 
        message: 'Просмотр зафиксирован',
        carId: id
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ [POST] Ошибка:', error)
    
    let errorMessage = 'Ошибка при записи просмотра'
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
// GET /api/views/[id] - получить статистику просмотров
// =====================================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`👁️ [GET /api/views/${id}] Получаем статистику...`)

    const views = await getCarViews(id)

    console.log(`✅ [GET] Найдено просмотров: ${views?.view_count || 0}`)

    return NextResponse.json(
      views || { 
        view_count: 0,
        last_viewed: null,
        message: 'Просмотров еще нет'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ [GET] Ошибка:', error)
    
    let errorMessage = 'Ошибка при получении статистики'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}