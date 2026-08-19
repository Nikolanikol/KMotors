"use client";

import { X } from "lucide-react";
import Lightbox, { type Slide } from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
// БЕЗ этих стилей лайтбокс рендерится position:static и фото вываливаются
// в конец страницы (нет fixed-оверлея). Обязательны для полноэкранного режима.
// Лежат здесь, а не в Carousel: файл грузится динамически, поэтому и CSS, и JS
// плагинов уезжают в отдельный чанк и не едут в первую отрисовку карточки.
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/counter.css";

interface Props {
  slides: Slide[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  closeLabel: string;
}

const GalleryLightbox = ({
  slides,
  index,
  onIndexChange,
  onClose,
  closeLabel,
}: Props) => (
  <Lightbox
    open
    close={onClose}
    index={index}
    slides={slides}
    plugins={[Thumbnails, Zoom, Counter]}
    /* ⚠️ `carousel.preload` НЕ трогать ради экономии трафика: тем же числом
       плагин Thumbnails считает, сколько миниатюр отрисовать (2·preload+1).
       С preload:1 галерея грузит 3 слайда вместо 5, но и лента внизу
       схлопывается до трёх плиток — проверено, выглядит как поломка. */
    styles={{
      root: { "--yarl__color_backdrop": "rgba(10,10,10,0.97)" },
      // На телефонах с вырезом тулбар иначе оказывается под системной панелью.
      toolbar: {
        paddingTop: "max(8px, env(safe-area-inset-top))",
        paddingRight: "max(8px, env(safe-area-inset-right))",
      },
    }}
    thumbnails={{
      position: "bottom",
      width: 80,
      height: 50,
      gap: 8,
      border: 2,
      borderRadius: 8,
      borderColor: "var(--axis-orange)",
    }}
    /* ⚠️ Счётчик обязан лежать СЛЕВА и не ловить указатель. Плагин добавляет
       себя последним ребёнком контроллера, то есть ПОВЕРХ тулбара; сдвинутый
       вправо (top:16/right:16) он ложился ровно на крестик и съедал клики —
       закрыть галерею мышью было невозможно. Позиция по умолчанию у плагина
       левая, поэтому переопределяем только pointerEvents. */
    counter={{
      container: { style: { pointerEvents: "none" } },
    }}
    zoom={{ maxZoomPixelRatio: 3 }}
    render={{
      // Тот же крестик, что в модалке заявки (ui/dialog.tsx): круг 44×44 —
      // минимальный комфортный тап-таргет, доворот на наведении.
      buttonClose: () => (
        <button
          key="close"
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          /* ⚠️ Кнопка живёт на ДВУХ разных фонах сразу: почти чёрная подложка
             лайтбокса и само фото, которое на широком экране достаёт до угла
             (у Encar студийная съёмка на белом). Поэтому и тёмная заливка —
             под белый кадр, — и светлая рамка: без неё чёрный круг исчезал на
             подложке, а white/10 из модалки исчезал на фото. */
          className="group flex h-11 w-11 items-center justify-center rounded-full bg-black/70 text-white ring-1 ring-inset ring-white/25 backdrop-blur-md transition-all duration-300 ease-out hover:rotate-90 hover:scale-110 hover:bg-[var(--axis-bronze-deep)] hover:ring-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--axis-bronze)] active:scale-95"
        >
          <X className="h-6 w-6 transition-transform duration-300" strokeWidth={2.25} />
        </button>
      ),
    }}
    on={{ view: ({ index: i }) => onIndexChange(i) }}
  />
);

export default GalleryLightbox;
