// 🔴 ВАЖНО: Загружаем .env.local ДО всего остального!
require('dotenv').config({ path: '.env.local' })

const readline = require('readline')
const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')

// Проверяем что переменные загружены
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ ОШИБКА: .env.local не найден или не заполнен!')
  console.error('   Скопируй .env.example в .env.local и заполни переменные')
  process.exit(1)
}

// Инициализируем Supabase
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const question = (prompt) => {
  return new Promise(resolve => {
    rl.question(prompt, resolve)
  })
}

async function getAdminByEmail(email) {
  const { data, error } = await supabaseServer
    .from('admins')
    .select('*')
    .eq('email', email)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data || null
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

async function createAdmin(email, password) {
  const passwordHash = await hashPassword(password)

  const { data, error } = await supabaseServer
    .from('admins')
    .insert([{ email, password_hash: passwordHash }])
    .select()
    .single()

  if (error) throw new Error(`Ошибка при создании админа: ${error.message}`)
  return data
}

async function main() {
  console.log('\n🔐 === Создание администратора KMotors === 🔐\n')

  try {
    // Проверяем переменные окружения
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Ошибка: не установлены переменные окружения Supabase')
      console.error('   Проверь .env.local файл:')
      console.error('   - NEXT_PUBLIC_SUPABASE_URL')
      console.error('   - SUPABASE_SERVICE_ROLE_KEY')
      rl.close()
      process.exit(1)
    }

    console.log('✅ Переменные окружения загружены\n')

    const email = await question('📧 Введите email администратора: ')
    const password = await question('🔑 Введите пароль: ')
    const passwordConfirm = await question('🔑 Повторите пароль: ')

    // Проверки
    if (!email || !password) {
      console.error('❌ Email и пароль обязательны')
      rl.close()
      process.exit(1)
    }

    if (password !== passwordConfirm) {
      console.error('❌ Пароли не совпадают')
      rl.close()
      process.exit(1)
    }

    if (password.length < 6) {
      console.error('❌ Пароль должен быть не менее 6 символов')
      rl.close()
      process.exit(1)
    }

    // Проверяем, не существует ли уже
    console.log('\n⏳ Проверяем email в БД...')
    const existing = await getAdminByEmail(email)
    if (existing) {
      console.error('❌ Администратор с этим email уже существует')
      rl.close()
      process.exit(1)
    }

    // Создаем администратора
    console.log('⏳ Создаем администратора...')
    const admin = await createAdmin(email, password)

    console.log('\n✅ Администратор успешно создан!')
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🆔 ID: ${admin.id}`)
    console.log(`📅 Создан: ${new Date(admin.created_at).toLocaleString('ru-RU')}`)
    console.log('\n💡 Теперь вы можете зайти на /admin/login с этими учетными данными')
    console.log('💡 URL: http://localhost:3000/admin/login\n')

    rl.close()
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Ошибка при создании администратора:')
    console.error(error.message || error)
    console.error('\n🔍 Возможные причины:')
    console.error('   1. .env.local не заполнен')
    console.error('   2. Таблица admins не создана в Supabase')
    console.error('   3. Нет соединения с Supabase')
    rl.close()
    process.exit(1)
  }
}

main()