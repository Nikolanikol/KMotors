"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "yet-another-react-lightbox/plugins/counter.css";

interface Photo {
  code: string;
  path: string;
  desc: string;
  updateDateTime: string;
  type: string;
}

interface Props {
  photos: Photo[] | string[];
  mode?: string;
  carName?: string;
  photoLabel?: string;
}

const CarouselLight = ({
  photos,
  mode,
  carName,
  photoLabel = "фото",
}: Props) => {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const getUrl = useCallback(
    (photo: Photo | string, thumb = false) => {
      if (mode === "static" || typeof photo === "string")
        return photo as string;
      const p = photo as Photo;
      if (thumb) return `https://ci.encar.com${p.path}`;
      return `https://ci.encar.com${p.path}?impolicy=heightRate&rh=696&cw=1160&ch=696&cg=Center&wtmk=https://ci.encar.com/wt_mark/w_mark_04.png`;
    },
    [mode],
  );
  const slides = (photos || []).map((photo, i) => ({
    src: getUrl(photo),
    alt: carName ? `${carName} — ${photoLabel} ${i + 1}` : `photo ${i + 1}`,
    width: 1160,
    height: 696,
  }));

  const current = photos?.[index];

  return (
    <>
      {/* Main image */}
      <div
        className="relative rounded-2xl overflow-hidden cursor-zoom-in group"
        style={{
          aspectRatio: "16/10",
          backgroundColor: "var(--axis-graphite)",
        }}
        onClick={() => setOpen(true)}
      >
        {current && (
          <Image
            src={getUrl(current)}
            alt={
              carName
                ? `${carName} — ${photoLabel} ${index + 1}`
                : `photo ${index + 1}`
            }
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 60vw"
            priority={index === 0}
          />
        )}

        {/* Counter */}
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold z-10"
          style={{
            backgroundColor: "rgba(10,10,10,0.7)",
            color: "var(--axis-white)",
            backdropFilter: "blur(8px)",
          }}
        >
          {index + 1} / {photos?.length || 0}
        </div>

        {/* Arrows */}
        {photos?.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => Math.max(0, i - 1));
              }}
              disabled={index === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all z-10 sm:opacity-0 sm:group-hover:opacity-100"
              style={{
                backgroundColor: "rgba(10,10,10,0.7)",
                color: "white",
                backdropFilter: "blur(8px)",
                opacity: index === 0 ? 0.3 : undefined,
                fontSize: 22,
              }}
            >
              ‹
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => Math.min((photos?.length || 1) - 1, i + 1));
              }}
              disabled={index === (photos?.length || 1) - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center transition-all z-10 sm:opacity-0 sm:group-hover:opacity-100"
              style={{
                backgroundColor: "rgba(10,10,10,0.7)",
                color: "white",
                backdropFilter: "blur(8px)",
                opacity: index === (photos?.length || 1) - 1 ? 0.3 : undefined,
                fontSize: 22,
              }}
            >
              ›
            </button>
          </>
        )}

        {/* Expand hint */}
        <div
          className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={{
            backgroundColor: "rgba(10,10,10,0.7)",
            color: "var(--axis-gray)",
            backdropFilter: "blur(8px)",
          }}
        >
          ⛶ Открыть галерею
        </div>
      </div>

      {/* Thumbnails strip */}
      {photos?.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mt-2 pb-1">
          {(photos as Photo[]).map((photo, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className="relative flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200"
              style={{
                width: 90,
                height: 60,
                outline:
                  i === index
                    ? "2px solid var(--axis-orange)"
                    : "2px solid transparent",
                opacity: i === index ? 1 : 0.5,
              }}
            >
              <Image
                src={getUrl(photo, true)}
                alt={`thumb ${i + 1}`}
                fill
                unoptimized
                className="object-cover"
                sizes="72px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
        plugins={[Thumbnails, Zoom, Counter]}
        styles={{
          root: { "--yarl__color_backdrop": "rgba(10,10,10,0.97)" },
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
        counter={{
          container: {
            style: { top: 16, right: 16, left: "unset", fontSize: 13 },
          },
        }}
        zoom={{ maxZoomPixelRatio: 3 }}
        on={{ view: ({ index: i }) => setIndex(i) }}
      />
    </>
  );
};

export default CarouselLight;
