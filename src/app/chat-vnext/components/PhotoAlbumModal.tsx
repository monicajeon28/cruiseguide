'use client';
import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

interface PhotoAlbumModalProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoAlbumModal({ images, initialIndex, onClose }: PhotoAlbumModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        goToNext();
      } else if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNext, goToPrevious, onClose]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="relative bg-white p-4 rounded-lg max-w-3xl max-h-[90vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-4xl hover:text-gray-300 z-10"
          style={{ filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))' }}
        >
          <IoCloseCircleOutline />
        </button>

        <div className="relative w-full h-[70vh] flex items-center justify-center">
          <Image
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            fill
            className="object-contain rounded-md"
            quality={75}
            sizes="(max-width: 768px) 100vw, 800px"
            priority={currentIndex === initialIndex}
          />

          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors text-xl"
              >
                <FaArrowLeft />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-colors text-xl"
              >
                <FaArrowRight />
              </button>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="mt-4 text-center text-gray-700">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
}
