"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type GalleryImage = {
  src: string;
  alt: string;
  featured?: boolean;
};

type GalleryLightboxProps = {
  dayImages: GalleryImage[];
  nightImages: GalleryImage[];
};

function GalleryCard({
  image,
  onOpen,
  priority = false,
  section = "day",
}: {
  image: GalleryImage;
  onOpen: (image: GalleryImage) => void;
  priority?: boolean;
  section?: "day" | "night";
}) {
  const sizeClass = image.featured
    ? "aspect-[4/3] md:col-span-4 md:row-span-2 md:min-h-[360px]"
    : section === "night"
      ? "aspect-[4/3]"
      : "aspect-[4/3] md:col-span-2";

  return (
    <button
      type="button"
      onClick={() => onOpen(image)}
      className={`group relative overflow-hidden rounded-2xl border border-[#d9b76f]/25 bg-[#efe5cf] shadow-md shadow-[#0A5458]/5 transition hover:border-[#d9b76f]/45 ${sizeClass}`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes={image.featured ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
        className="object-contain p-2 transition duration-500 group-hover:scale-[1.02]"
      />
    </button>
  );
}

export function GalleryLightbox({ dayImages, nightImages }: GalleryLightboxProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [selectedImage]);

  function openImage(image: GalleryImage) {
    setSelectedImage(image);
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-6">
        {dayImages.map((image, index) => (
          <GalleryCard key={image.src} image={image} onOpen={openImage} priority={index === 0} />
        ))}
      </div>

      <div className="mb-8 mt-16">
        <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#b58d3d]">
          Βράδυ
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {nightImages.map((image) => (
          <GalleryCard key={image.src} image={image} onOpen={openImage} section="night" />
        ))}
      </div>

      {selectedImage ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#062f32]/90 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative h-[82vh] w-full max-w-6xl rounded-3xl border border-[#d9b76f]/30 bg-[#fffaf0] p-3 shadow-2xl shadow-black/35"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute right-4 top-4 z-10 rounded-full border border-[#d9b76f]/40 bg-[#0A5458] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#07383b]"
              aria-label="Κλείσιμο εικόνας"
            >
              Κλείσιμο
            </button>
            <div className="relative h-full overflow-hidden rounded-2xl bg-[#efe5cf]">
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                fill
                sizes="100vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
