import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

/**
 * On-Demand ISR endpoint
 * Пересчитывает SSG страницы при обновлении данных
 * 
 * Использование:
 * POST /api/revalidate?path=/catalog
 * POST /api/revalidate?path=/catalog/[id]&id=123
 */

export async function POST(req: NextRequest) {
  // Проверяем secret token для безопасности
  const secret = req.nextUrl.searchParams.get('secret')
  const adminSecret = process.env.REVALIDATE_SECRET

  if (secret !== adminSecret) {
    return NextResponse.json(
      { error: 'Invalid secret' },
      { status: 401 }
    )
  }

  const path = req.nextUrl.searchParams.get('path')

  if (!path) {
    return NextResponse.json(
      { error: 'Path parameter required' },
      { status: 400 }
    )
  }

  try {
    // Пересчитываем страницу
    revalidatePath(path)
    
    return NextResponse.json(
      { revalidated: true, path },
      { status: 200 }
    )
  } catch (error) {
    console.error('Revalidate error:', error)
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    )
  }
}