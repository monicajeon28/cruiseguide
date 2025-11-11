'use client';
import { useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TbDirectionSign } from 'react-icons/tb'; // 길찾기 아이콘
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'; // 장소 아이콘
import { BsChatText } from 'react-icons/bs'; // 일반 검색 아이콘

export type GoAnywhereKind = 'directions' | 'poi' | 'general';

export interface GoAnywhereLink {
  label: string;
  href: string;
  emoji?: string;
  kind?: GoAnywhereKind;
}

export interface GoAnywhereProps {
  title?: string;
  subtitle?: string;
  from?: string; // 출발지
  to?: string;   // 목적지
  links: GoAnywhereLink[];
}

const getIcon = (kind?: GoAnywhereKind) => {
  switch (kind) {
    case 'directions': return <TbDirectionSign className="text-xl" />;
    case 'poi': return <HiOutlineBuildingOffice2 className="text-xl" />;
    case 'general': return <BsChatText className="text-xl" />;
    default: return null;
  }
};

export default function GoAnywhere({ title, subtitle, from, to, links }: GoAnywhereProps) {
  const renderFromTo = useCallback(() => {
    if (from && to) {
      return (
        <div className="text-gray-700 text-sm mb-2">
          <span className="font-medium">출발:</span> {from} &rarr; <span className="font-medium">도착:</span> {to}
        </div>
      );
    } else if (to) {
      return (
        <div className="text-gray-700 text-sm mb-2">
          <span className="font-medium">목적지:</span> {to}
        </div>
      );
    } else if (from) {
      return (
        <div className="text-gray-700 text-sm mb-2">
          <span className="font-medium">출발지:</span> {from}
        </div>
      );
    }
    return null;
  }, [from, to]);

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100">
      <div className="flex items-center space-x-3 mb-4">
        <TbDirectionSign className="text-3xl text-red-600" />
        <h2 className="text-2xl font-bold text-gray-900">
          {title || '길찾기/지도 정보'}
        </h2>
      </div>

      {subtitle && <p className="text-gray-600 mb-3">{subtitle}</p>}

      {renderFromTo()}

      {links.length > 0 ? (
        <div className="space-y-3">
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 p-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors duration-200"
            >
              {link.emoji && <span className="text-2xl">{link.emoji}</span>}
              {getIcon(link.kind)}
              <span className="text-red-700 font-medium text-lg">{link.label}</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">제공할 길찾기/지도 정보가 없습니다.</p>
      )}
    </div>
  );
}
