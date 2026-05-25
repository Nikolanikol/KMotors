"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  images: string[];
  alt: string;
}

export default function ModelGallery({ images, alt }: Props) {
  const [selected, setSelected] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="space-y-3">
        {/* Main image */}
        <div
          className="relative w-full rounded-2xl overflow-hidden cursor-zoom-in"
          style={{ aspectRatio: "16/9" }}
          onClick={() => setLightbox(true)}
        >
          <Image
            src={images[selected]}
            alt={`${alt} — фото ${selected + 1}`}
            fill
            className="object-cover transition-opacity duration-300"
            priority={selected === 0}
            sizes="(max-width: 768px) 100vw, 800px"
          />
          {/* Zoom hint */}
          <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
            🔍 {selected + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((src, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className="relative flex-shrink-0 rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  width: 80,
                  height: 56,
                  border: i === selected
                    ? "2px solid var(--axis-orange)"
                    : "2px solid transparent",
                  opacity: i === selected ? 1 : 0.6,
                }}
              >
                <Image
                  src={src}
                  alt={`${alt} thumbnail ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => setLightbox(false)}
          >
            ×
          </button>

          {/* Prev */}
          {selected > 0 && (
            <button
              className="absolute left-4 text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setSelected(selected - 1); }}
            >
              ‹
            </button>
          )}

          <div
            className="relative"
            style={{ width: "min(90vw, 1200px)", height: "min(80vh, 700px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[selected]}
              alt={`${alt} — фото ${selected + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          {/* Next */}
          {selected < images.length - 1 && (
            <button
              className="absolute right-4 text-white text-3xl w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setSelected(selected + 1); }}
            >
              ›
            </button>
          )}

          {/* Dots */}
          <div className="absolute bottom-4 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setSelected(i); }}
                className="w-2 h-2 rounded-full transition-all"
                style={{ backgroundColor: i === selected ? "var(--axis-orange)" : "rgba(255,255,255,0.4)" }}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
