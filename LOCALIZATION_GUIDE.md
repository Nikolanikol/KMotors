# 🌍 Руководство по локализации KMotors

## Обзор

Проект настроен для работы с тремя языками:
- 🇷🇺 **Русский** (ru) - язык по умолчанию
- 🇺🇸 **Английский** (en)
- 🇰🇷 **Корейский** (ko)

## Структура файлов

```
src/
├── lib/
│   └── i18n.ts                  # Конфигурация i18n
├── locales/
│   ├── ru/
│   │   ├── common.json          # Переводы интерфейса (RU)
│   │   └── cars.json            # Названия автомобилей (RU)
│   ├── en/
│   │   ├── common.json          # Переводы интерфейса (EN)
│   │   └── cars.json            # Названия автомобилей (EN)
│   └── ko/
│       ├── common.json          # Переводы интерфейса (KO)
│       └── cars.json            # Названия автомобилей (KO)
└── components/
    ├── I18nProvider/
    │   └── I18nProvider.tsx     # Провайдер i18n
    └── LanguageSwitcher/
        └── LanguageSwitcher.tsx # Компонент переключения языка
```

## Использование в компонентах

### 1. Базовое использование

```tsx
'use client';

import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('catalog.title')}</h1>
      <p>{t('catalog.description')}</p>
      <button>{t('common.submit')}</button>
    </div>
  );
}
```

### 2. Использование с namespace

```tsx
'use client';

import { useTranslation } from 'react-i18next';

export default function CarCard() {
  const { t } = useTranslation(['common', 'cars']);

  return (
    <div>
      {/* Из common namespace */}
      <p>{t('common:car.price')}: {price}</p>

      {/* Из cars namespace */}
      <h3>{t('cars:아반떼')}</h3>
    </div>
  );
}
```

### 3. Переключение языка программно

```tsx
'use client';

import { useTranslation } from 'react-i18next';

export default function LanguageButton() {
  const { i18n } = useTranslation();

  const changeToRussian = () => {
    i18n.changeLanguage('ru');
  };

  return <button onClick={changeToRussian}>Русский</button>;
}
```

### 4. Получение текущего языка

```tsx
'use client';

import { useTranslation } from 'react-i18next';

export default function CurrentLanguage() {
  const { i18n } = useTranslation();

  return <p>Текущий язык: {i18n.language}</p>;
}
```

## Доступные ключи переводов

### Common (Интерфейс)

#### Навигация
- `nav.home` - "Главная"
- `nav.catalog` - "Каталог"
- `nav.buy` - "Как купить"
- `nav.contact` - "Контакты"

#### Каталог
- `catalog.title` - "Каталог корейских автомобилей"
- `catalog.filters` - "Фильтры"
- `catalog.noResults` - "Автомобили не найдены"

#### Автомобиль
- `car.brand` - "Марка"
- `car.model` - "Модель"
- `car.price` - "Цена"
- `car.mileage` - "Пробег"
- `car.fuel` - "Топливо"
- `car.transmission` - "Коробка передач"

#### Фильтры
- `filter.all` - "Все"
- `filter.priceRange` - "Диапазон цен"
- `filter.reset` - "Сбросить"
- `filter.apply` - "Применить"

#### Общие
- `common.submit` - "Отправить"
- `common.save` - "Сохранить"
- `common.delete` - "Удалить"
- `common.loading` - "Загрузка..."
- `common.km` - "км"
- `common.won` - "вон"

### Cars (Названия автомобилей)

Примеры:
- `아반떼` → "Аванте" (RU) / "Avante" (EN)
- `소나타` → "Соната" (RU) / "Sonata" (EN)
- `K5` → "K5" (все языки)

## Добавление новых переводов

### 1. Добавить в common.json

```json
// src/locales/ru/common.json
{
  "myNewSection": {
    "title": "Мой новый заголовок",
    "description": "Описание"
  }
}
```

### 2. Добавить во все языки

Не забудьте добавить тот же ключ в `en/common.json` и `ko/common.json`:

```json
// src/locales/en/common.json
{
  "myNewSection": {
    "title": "My new title",
    "description": "Description"
  }
}
```

### 3. Использовать в компоненте

```tsx
const { t } = useTranslation();
return <h1>{t('myNewSection.title')}</h1>;
```

## Хранение выбранного языка

Выбранный язык автоматически сохраняется в `localStorage` с ключом `kmotors-language`.

При следующем посещении сайта язык восстановится автоматически.

## Обновление существующих компонентов

### Пример: Обновление CarCard

**До:**
```tsx
<p>Пробег</p>
<p>Цена покупки</p>
```

**После:**
```tsx
'use client';

import { useTranslation } from 'react-i18next';

export default function CarCard() {
  const { t } = useTranslation();

  return (
    <>
      <p>{t('car.mileage')}</p>
      <p>{t('car.buyPrice')}</p>
    </>
  );
}
```

## Важные замечания

⚠️ **Client Components**: Компоненты, использующие `useTranslation`, должны быть помечены как `'use client'`

⚠️ **SSR/SSG**: Для серверных компонентов используйте статические тексты или передавайте переводы через props

⚠️ **Namespace**: По умолчанию используется `common`. Для доступа к `cars` укажите явно:
```tsx
const { t } = useTranslation(['common', 'cars']);
t('cars:아반떼');
```

## Тестирование

1. Запустите dev сервер:
```bash
npm run dev
```

2. Откройте http://localhost:3000

3. Переключите язык через компонент LanguageSwitcher в header

4. Проверьте, что все тексты переключаются корректно

## Добавление нового языка

Для добавления нового языка (например, японского):

1. Создайте папку `src/locales/ja/`

2. Добавьте файлы `common.json` и `cars.json`

3. Обновите `src/lib/i18n.ts`:
```typescript
import jaCommon from '../locales/ja/common.json';
import jaCars from '../locales/ja/cars.json';

resources: {
  // ...
  ja: {
    common: jaCommon,
    cars: jaCars,
  },
},
supportedLngs: ['ru', 'en', 'ko', 'ja'],
```

4. Добавьте в `LanguageSwitcher.tsx`:
```typescript
const languages = [
  // ...
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
];
```

## Полезные ссылки

- [react-i18next документация](https://react.i18next.com/)
- [i18next документация](https://www.i18next.com/)
