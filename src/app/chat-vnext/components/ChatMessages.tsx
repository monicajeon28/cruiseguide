'use client';
import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  type?: 'text' | 'map-links' | 'photos' | 'photo-gallery' | 'suggest-chips';
  text?: string;
  title?: string;
  links?: { label: string; href: string; emoji?: string; kind?: string }[];
  images?: string[]; // 이미지 URL 배열
  chips?: { label: string; payload: string }[];
}

interface ChatMessagesProps {
  messages: ChatMessage[];
}

export default function ChatMessages({ messages }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((m, i) => (
        <div
          key={m.id || i}
          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] p-3 rounded-lg shadow-md
              ${m.role === 'user'
                ? 'bg-red-500 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
          >
            {m.text && <div className="whitespace-pre-wrap">{m.text}</div>}

            {m.links && m.links.length > 0 && (
              <div className="mt-2 space-y-2">
                {m.title && <div className="font-medium text-sm mb-1">{m.title}</div>}
                {m.links.map((link, linkIdx) => (
                  <Link
                    key={linkIdx}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 p-2 bg-white rounded-md shadow-sm text-blue-600 hover:bg-gray-50 transition-colors"
                  >
                    {link.emoji && <span>{link.emoji}</span>}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            )}

            {m.images && m.images.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {m.images.map((imageUrl, imgIdx) => (
                  <div key={imgIdx} className="relative w-full h-32 bg-gray-300 rounded-md overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt="여행 이미지"
                      layout="fill"
                      objectFit="cover"
                      className="hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}

            {m.chips && m.chips.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {m.chips.map((chip, chipIdx) => (
                  <button
                    key={chipIdx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                    onClick={() => console.log('Chip clicked:', chip.payload)}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
