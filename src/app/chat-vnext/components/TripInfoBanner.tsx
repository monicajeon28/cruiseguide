'use client';
import { Trip } from '@/lib/types';
import { toDestArray } from '@/lib/normalize';

interface TripInfoBannerProps {
  trip: Trip | null;
}

export default function TripInfoBanner({ trip }: TripInfoBannerProps) {
  if (!trip) {
    return null; // 트립 정보가 없으면 배너를 렌더링하지 않음
  }

  const destinationText = Array.isArray(trip.destination)
    ? trip.destination.join(', ')
    : trip.destination;

  return (
    <div className="w-full bg-blue-50 text-blue-700 p-3 text-sm text-center shadow-sm">
      <div className="font-medium">등록된 여행</div>
      <div>
        🚢 {trip.cruiseName ?? ''} ❤️ {destinationText}
      </div>
      <div>
        {(typeof trip.startDate === 'string' ? trip.startDate.slice(0, 10) : '')} ~ {(typeof trip.endDate === 'string' ? trip.endDate.slice(0, 10) : '')}
      </div>
    </div>
  );
}
