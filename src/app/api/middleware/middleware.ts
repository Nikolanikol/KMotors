import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'your-secret-key-min-32-characters'
)

const PROTECTED_ROUTES = ['/admin/cars', '/admin/analytics']
const AUTH_ROUTES = ['/admin/login']
const COOKIE_NAME = 'admin_token'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const token = req.cookies.get(COOKIE_NAME)?.value

  // ✅ Защищенные маршруты - нужна авторизация
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      console.log(`🚫 No token for protected route: ${pathname}`)
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    try {
      await jwtVerify(token, JWT_SECRET)
      console.log(`✅ Valid token for: ${pathname}`)
      return NextResponse.next()
    } catch (error) {
      console.error(`❌ Invalid token:`, error)
      const response = NextResponse.redirect(new URL('/admin/login', req.url))
      response.cookies.delete(COOKIE_NAME)
      return response
    }
  }

  // 🔓 Если авторизован и заходит на /admin/login - редирект в админку
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (token) {
      try {
        await jwtVerify(token, JWT_SECRET)
        console.log(`👤 Already authenticated, redirecting to /admin/cars`)
        return NextResponse.redirect(new URL('/admin/cars', req.url))
      } catch (error) {
        console.log(`🔄 Token invalid, allowing access to login`)
        return NextResponse.next()
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}