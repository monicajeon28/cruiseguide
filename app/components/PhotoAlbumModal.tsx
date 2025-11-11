import Image from 'next/image';

type Props = { open: boolean; onClose: () => void; images: string[] };
export default function PhotoAlbumModal({ open, onClose, images }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg" onClick={e => e.stopPropagation()}>
        <p className="font-semibold mb-2">사진 모아보기</p>
        <div className="grid grid-cols-3 gap-2 max-h-[70vh] overflow-auto">
          {images.map((u, i) => (
            <div key={i} className="relative w-full h-24">
              <Image
                src={encodeURI(u)}
                alt=""
                fill
                className="object-cover rounded"
                quality={75}
                loading="lazy"
                sizes="96px"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 