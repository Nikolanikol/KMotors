"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import LightGallery from "lightgallery/react";
import type { LightGallery as LGInstance } from "lightgallery/lightgallery";
import lgZoom from "lightgallery/plugins/zoom";
import lgThumbnail from "lightgallery/plugins/thumbnail";

// Стили
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-thumbnail.css";
import "lightgallery/css/lg-zoom.css";
import "./carousel.css";
const CarouselLight = ({ photos }: { photos: string[] }) => {
  const lightGalleryRef = useRef<LGInstance>(null);
  const containerRef = useRef(null);
  const [galleryContainer, setGalleryContainer] = useState(null);

  const onInit = useCallback((detail: any) => {
    if (detail) {
      lightGalleryRef.current = detail.instance;
      lightGalleryRef.current?.openGallery();
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setGalleryContainer(containerRef.current);
    }
  }, []);

  return (
    <div className="App">
      <div style={{ height: "800px" }} ref={containerRef}></div>
      <LightGallery
        container={galleryContainer}
        onInit={onInit}
        plugins={[lgZoom, lgThumbnail]}
        closable={false} // ❌ Отключает кнопку закрытия
        escKey={false} // ❌ Отключает закрытие по клавише Esc
        hideBarsDelay={0}
        dynamic={true}
        thumbHeight={"100px"}
        dynamicEl={photos.map((item) => ({
          src: item,
          thumb: item,
        }))}
      />
    </div>
  );
};

export default CarouselLight;
