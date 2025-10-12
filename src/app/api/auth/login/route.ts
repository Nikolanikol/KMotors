import { NextRequest, NextResponse } from 'next/server'

import { createToken, setAuthCookie } from '@/lib/auth'
import { verifyAdmin } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    const admin = await verifyAdmin(email, password)
    if (!admin) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    const token = createToken(admin.id, admin.email)
    await setAuthCookie(token)

    return NextResponse.json(
      { message: 'Успешно авторизован', email: admin.email },
      { status: 200 }
    )
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Ошибка при авторизации' },
      { status: 500 }
    )
  }
}