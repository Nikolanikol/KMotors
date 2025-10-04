"use client";
import { FC, useCallback, useEffect, useRef, useState } from "react";
import LightGallery from "lightgallery/react";
import type { LightGallery as LGInstance } from "lightgallery/lightgallery";
import lgZoom from "lightgallery/plugins/zoom";
import lgThumbnail from "lightgallery/plugins/thumbnail";

// Стили
import "lightgallery/css/lightgallery.css";
import "lightgallery/css/lg-thumbnail.css";
import "lightgallery/css/lg-zoom.css";
import "./carousel.css";
const CarouselLight = ({
  photos,
}: {
  photos: {
    code: string;
    path: string;
    desc: string;
    updateDateTime: string;
    type: string;
  }[];
}) => {
  const lightGalleryRef = useRef<LGInstance>(null);
  const containerRef = useRef(null);
  const [galleryContainer, setGalleryContainer] = useState(null);

  const onInit = useCallback((detail: any) => {
    if (detail) {
      lightGalleryRef.current = detail.instance;
      lightGalleryRef.current.openGallery();
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setGalleryContainer(containerRef.current);
    }
  }, []);
  //   console.log(photos);
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
          src:
            "https://ci.encar.com" +
            item.path +
            "?impolicy=heightRate&rh=696&cw=1160&ch=696&cg=Center&wtmk=https://ci.encar.com/wt_mark/w_mark_04.png&t=20250912164710",
          thumb: "https://ci.encar.com" + item.path,
        }))}
      />
    </div>
  );
};

export default CarouselLight;
