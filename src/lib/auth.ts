import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'your-secret-key'
const COOKIE_NAME = 'admin_token'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 дней

// Хеширование пароля
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}// Проверка пароля
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Создание JWT токена
export function createToken(adminId: string, email: string): string {
  return jwt.sign(
    { id: adminId, email },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Проверка JWT токена
export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string
      email: string
    }
    return decoded
  } catch {
    return null
  }
}

// Установить cookie с токеном
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true, // Только сервер может читать
    secure: process.env.NODE_ENV === 'production', // HTTPS в продакшене
    sameSite: 'lax',
    path: '/',
  })
}

// Получить токен из cookies
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  return token || null
}

// Удалить cookie
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

// Проверить, авторизован ли администратор
export async function getAuthAdmin(): Promise<{ id: string; email: string } | null> {
  const token = await getAuthCookie()
  if (!token) return null
  return verifyToken(token)
}