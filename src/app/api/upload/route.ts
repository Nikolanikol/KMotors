import { NextRequest, NextResponse } from 'next/server'
import { getAuthAdmin } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase'

const STORAGE_BUCKET = 'car-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(req: NextRequest) {
  try {
    console.log('🖼️ [UPLOAD] Начало загрузки фото')

    // Проверяем авторизацию
    const admin = await getAuthAdmin()
    if (!admin) {
      console.log('❌ [UPLOAD] Админ не авторизован')
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }
    console.log(`✅ [UPLOAD] Админ авторизован: ${admin.email}`)

    // Получаем файл
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      console.log('❌ [UPLOAD] Файл не найден в formData')
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 400 }
      )
    }

    console.log(`📄 [UPLOAD] Файл получен: ${file.name}, размер: ${file.size} байт`)

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      console.log(`❌ [UPLOAD] Неподдерживаемый тип: ${file.type}`)
      return NextResponse.json(
        { error: `Только JPEG, PNG и WebP разрешены. Получен: ${file.type}` },
        { status: 400 }
      )
    }

    // Проверка размера
    if (file.size > MAX_FILE_SIZE) {
      console.log(`❌ [UPLOAD] Файл слишком большой: ${file.size} > ${MAX_FILE_SIZE}`)
      return NextResponse.json(
        { error: 'Файл слишком большой (макс 5MB)' },
        { status: 400 }
      )
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 9)
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${timestamp}-${random}.${extension}`

    console.log(`📝 [UPLOAD] Генерируем имя: ${fileName}`)

    // Преобразуем File в Buffer для загрузки
    const buffer = await file.arrayBuffer()

    console.log(`⏳ [UPLOAD] Загружаем в Supabase Storage...`)

    // Загружаем в Supabase Storage
    const { data, error } = await supabaseServer.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error(`❌ [UPLOAD] Ошибка Supabase при загрузке:`, error)
      return NextResponse.json(
        { error: `Ошибка загрузки: ${error.message}` },
        { status: 500 }
      )
    }

    console.log(`✅ [UPLOAD] Файл загружен в Supabase: ${data.path}`)

    // Получаем публичный URL
    const { data: publicData } = supabaseServer.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    const publicUrl = publicData.publicUrl

    console.log(`🌐 [UPLOAD] Публичный URL: ${publicUrl}`)

    return NextResponse.json(
      { 
        url: publicUrl,
        fileName: fileName,
        message: 'Файл успешно загружен'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ [UPLOAD] Неожиданная ошибка:', error)
    
    let errorMessage = 'Ошибка при загрузке'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}