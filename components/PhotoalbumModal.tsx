'use client';
import Image from 'next/image';

interface PhotoAlbumModalProps {
  open: boolean;
  onClose: () => void;
  images: string[];
  onImageClick?: (images: string[], clickedIndex: number) => void;
}

export default function PhotoAlbumModal({ open, onClose, images, onImageClick }: PhotoAlbumModalProps) {
  if (!open) return null;
  if (!images || images.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">사진 앨범</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          <p className="text-gray-500 text-center">표시할 사진이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg p-6 w-11/12 max-w-6xl overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-700 hover:text-gray-900 text-3xl font-bold z-10">×</button>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">사진 앨범 ({images.length}장)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {images.map((url, index) => {
            const isVideo = (u: string) => u.toLowerCase().endsWith('.mp4');
            return (
              <div
                key={index}
                className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transform hover:scale-105 shadow-md"
                onClick={() => onImageClick?.(images, index)}
              >
                {isVideo(url) ? (
                  <video src={url} controls playsInline className="rounded-lg w-full h-full object-cover" />
                ) : (
                  <Image
                    src={url}
                    alt={`갤러리 이미지 ${index + 1}`}
                    fill
                    className="object-cover"
                    quality={75}
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
