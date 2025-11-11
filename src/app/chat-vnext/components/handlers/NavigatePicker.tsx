'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PiMapPinLineFill } from 'react-icons/pi';
import { GoAnywhereLink } from '../blocks/GoAnywhere'; // GoAnywhereLink import
import Link from 'next/link'; // Link import

interface NavigatePickerProps {
  title?: string;
  subtitle?: string;
  currentLocation?: string; // 현재 위치 prop 추가
  links: GoAnywhereLink[];
}

export default function NavigatePicker({ title, subtitle, currentLocation, links }: NavigatePickerProps) {
  const router = useRouter();
  const [from, setFrom] = useState(currentLocation || '');
  const [to, setTo] = useState('');

  const handleNavigate = () => {
    if (from && to) {
      // Google Maps 길찾기 링크 생성 (대중교통, 자동차 등)
      const transitLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=transit`;
      const drivingLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&travelmode=driving`;
      
      // 실제 앱에서는 이 링크들을 사용하여 새 탭을 열거나 WebView를 띄울 수 있습니다.
      // 여기서는 콘솔 로그로 대체합니다.
      console.log('Transit Link:', transitLink);
      console.log('Driving Link:', drivingLink);
      
      // 사용자에게 선택할 수 있는 옵션을 제공하거나, 특정 링크로 바로 이동시킬 수 있습니다.
      // 예: router.push(transitLink);
    } else {
      alert('출발지와 목적지를 모두 입력해주세요.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 space-y-4">
      <div className="flex items-center space-x-3">
        <PiMapPinLineFill className="text-3xl text-red-600" />
        <h2 className="text-2xl font-bold text-gray-900">{title || '길찾기/지도'}</h2>
      </div>
      {subtitle && <p className="text-gray-600">{subtitle}</p>}

      <div className="space-y-3">
        <div>
          <label htmlFor="from" className="block text-sm font-medium text-gray-700">출발지</label>
          <input
            type="text"
            id="from"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="현재 위치 또는 출발지 입력"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-sm font-medium text-gray-700">목적지</label>
          <input
            type="text"
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="목적지 입력 (예: 포트마이애미 크루즈 터미널)"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm p-2"
          />
        </div>
        <button
          onClick={handleNavigate}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          길찾기 시작
        </button>
      </div>

      {links.length > 0 && (
        <div className="mt-4 border-t border-gray-200 pt-4 space-y-2">
          <h3 className="text-lg font-medium text-gray-900">추천 검색</h3>
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors duration-200 text-blue-600"
            >
              {link.emoji && <span className="text-xl">{link.emoji}</span>}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
