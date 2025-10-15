import Link from "next/link";
import { AlertCircle, Home, Search, MessageCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Main Error Box */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-orange-100 rounded-full mb-8">
            <AlertCircle className="w-12 h-12 text-orange-600" />
          </div>

          <h1 className="text-6xl md:text-7xl font-bold text-gray-900 mb-4">
            404
          </h1>

          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Страница не найдена
          </h2>

          <p className="text-lg text-gray-600 mb-2">
            Похоже, вы попали на дорогу, которой нет на нашей карте
          </p>
          <p className="text-gray-500">
            Пожалуйста, проверьте URL или вернитесь на главную страницу
          </p>
        </div>

        {/* Suggestions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {/* Back Home */}
          <Link href="/">
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-2">На главную</h3>
                  <p className="text-sm text-gray-600">
                    Вернитесь на главную страницу K Motors
                  </p>
                </div>
              </div>
            </div>
          </Link>

          {/* To Catalog */}
          <Link href="/catalog">
            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-500">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Search className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 mb-2">В каталог</h3>
                  <p className="text-sm text-gray-600">
                    Посмотрите наши автомобили из Кореи
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-8 border-2 border-orange-200">
          <div className="flex items-start gap-4">
            <MessageCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">
                Что-то пошло не так?
              </h3>
              <p className="text-gray-700 mb-4">
                Если вы уверены, что эта страница должна существовать, или у вас
                есть вопросы, свяжитесь с нашей командой
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://t.me/kmotorsshop"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-orange-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-700 transition-colors text-center"
                >
                  Написать в Telegram
                </a>
                <a
                  href="https://www.instagram.com/kmotors.shop/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-white text-orange-600 font-bold py-2 px-6 rounded-lg border-2 border-orange-600 hover:bg-orange-50 transition-colors text-center"
                >
                  Написать в Instagram
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t-2 border-gray-200">
          <p className="text-gray-600 text-center mb-6">Популярные разделы:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/catalog"
              className="px-4 py-2 bg-white border-2 border-orange-500 text-orange-600 font-semibold rounded-lg hover:bg-orange-50 transition-colors"
            >
              Каталог
            </Link>
            <a
              href="/#how-to-buy"
              className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors"
            >
              Как купить
            </a>
            <Link
              href="/"
              className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors"
            >
              О компании
            </Link>
            <a
              href="#contact"
              className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-orange-500 hover:text-orange-600 transition-colors"
            >
              Контакты
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
