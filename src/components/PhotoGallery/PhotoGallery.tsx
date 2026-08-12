import type { ShopPhoto } from "@/types/database.types";

interface PhotoGalleryProps {
  photos: ShopPhoto[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  if (photos.length === 0) return null;

  return (
    <div className="gallery">
      {photos.map((photo) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={photo.id} src={photo.url} alt={photo.caption ?? "Shop photo"} className="gallery__image" />
      ))}
    </div>
  );
}
