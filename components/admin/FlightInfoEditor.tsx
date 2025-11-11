// components/admin/FlightInfoEditor.tsx
// 항공 정보 입력 컴포넌트

'use client';

import { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';

export interface FlightInfo {
  travelPeriod: {
    startDate: string;
    endDate: string;
    nights: number;
    days: number;
  };
  departure: {
    from: string;
    to: string;
    date: string;
    time: string; // 출발시간
    arrivalTime?: string; // 도착시간 (추가)
    flightNumber: string;
    duration: string;
    type: '직항' | '경유';
  };
  return: {
    from: string;
    to: string;
    date: string;
    time: string; // 출발시간
    arrivalTime?: string; // 도착시간 (추가)
    flightNumber: string;
    duration: string;
    type: '직항' | '경유';
  };
  aircraftType?: string; // 비행기 정보 (추가)
}

interface FlightInfoEditorProps {
  flightInfo: FlightInfo | null;
  onChange: (flightInfo: FlightInfo | null) => void;
  startDate?: string;
  endDate?: string;
  nights?: number;
  days?: number;
}

export default function FlightInfoEditor({
  flightInfo,
  onChange,
  startDate,
  endDate,
  nights,
  days,
}: FlightInfoEditorProps) {
  const [localFlightInfo, setLocalFlightInfo] = useState<FlightInfo>(
    flightInfo || {
      travelPeriod: {
        startDate: startDate || '',
        endDate: endDate || '',
        nights: nights || 0,
        days: days || 0,
      },
      departure: {
        from: '',
        to: '',
        date: startDate || '',
        time: '',
        arrivalTime: '',
        flightNumber: '',
        duration: '',
        type: '직항',
      },
      return: {
        from: '',
        to: '',
        date: endDate || '',
        time: '',
        arrivalTime: '',
        flightNumber: '',
        duration: '',
        type: '직항',
      },
      aircraftType: '',
    }
  );

  // startDate, endDate, nights, days 변경 시 travelPeriod 자동 업데이트
  useEffect(() => {
    if (startDate && endDate) {
      setLocalFlightInfo(prev => {
        const updated = {
          ...prev,
          travelPeriod: {
            startDate,
            endDate,
            nights: nights || prev.travelPeriod.nights,
            days: days || prev.travelPeriod.days,
          },
          departure: {
            ...prev.departure,
            date: startDate,
          },
        };
        // onChange는 다음 렌더 사이클에서 호출하도록 setTimeout 사용
        setTimeout(() => {
          onChange(updated);
        }, 0);
        return updated;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, nights, days]);

  const updateFlightInfo = (updates: Partial<FlightInfo>) => {
    const newInfo = { ...localFlightInfo, ...updates };
    setLocalFlightInfo(newInfo);
    onChange(newInfo);
  };

  // 공항별 UTC 오프셋 (시간 단위, 한국은 UTC+9)
  const getAirportTimezone = (airportName: string): number => {
    const airportMap: Record<string, number> = {
      // 한국
      '인천': 9, 'ICN': 9, '김해': 9, 'PUS': 9, '김포': 9, 'GMP': 9,
      // 미국
      '시애틀': -8, 'SEA': -8, '주노': -9, 'JNU': -9, '알래스카': -9, '앵커리지': -9, 'ANC': -9,
      '스캐그웨이': -9, '싯카': -9, '로스앤젤레스': -8, 'LAX': -8, '뉴욕': -5, 'JFK': -5, '뉴어크': -5, 'EWR': -5,
      '샌프란시스코': -8, 'SFO': -8, '시카고': -6, 'ORD': -6, '마이애미': -5, 'MIA': -5,
      // 캐나다
      '빅토리아': -8, 'YYJ': -8, '밴쿠버': -8, 'YVR': -8, '토론토': -5, 'YYZ': -5,
      // 일본
      '도쿄': 9, 'NRT': 9, '하네다': 9, 'HND': 9, '오사카': 9, 'KIX': 9, '사세보': 9,
      '미야코지마': 9, '이시가키': 9, '오키나와': 9, 'OKA': 9,
      // 중국
      '베이징': 8, 'PEK': 8, '상하이': 8, 'PVG': 8, '홍콩': 8, 'HKG': 8,
      // 태국
      '방콕': 7, 'BKK': 7, '푸켓': 7, 'HKT': 7,
      // 말레이시아
      '쿠알라룸푸르': 8, 'KUL': 8, '페낭': 8, '랑카위': 8,
      // 싱가포르
      '싱가포르': 8, 'SIN': 8,
      // 유럽
      '런던': 0, 'LHR': 0, '파리': 1, 'CDG': 1, '로마': 1, 'FCO': 1, '베네치아': 1, 'VCE': 1,
      '바르셀로나': 1, 'BCN': 1, '마르세유': 1, 'MRS': 1, '제노아': 1, 'GOA': 1, '라벤나': 1,
      '팔레르모': 1, 'PMO': 1, '아테네': 2, 'ATH': 2, '미코노스': 2, 'JMK': 2,
      '스플리트': 1, 'SPU': 1, '이비자': 1, 'IBZ': 1,
    };
    
    // 공항명 또는 IATA 코드로 검색
    const normalized = airportName.toUpperCase();
    for (const [key, offset] of Object.entries(airportMap)) {
      if (key.toUpperCase() === normalized || key === airportName) {
        return offset;
      }
    }
    
    // 기본값: 한국 시간대
    return 9;
  };

  // 시간 차이 계산 함수 (시차 고려)
  const calculateDuration = (departureTime: string, arrivalTime: string, departureDate: string, departureAirport: string, arrivalAirport: string, arrivalDate?: string): string => {
    if (!departureTime || !arrivalTime || !departureAirport || !arrivalAirport) return '';
    
    try {
      // 출발지와 도착지의 UTC 오프셋 가져오기
      const depOffset = getAirportTimezone(departureAirport);
      const arrOffset = getAirportTimezone(arrivalAirport);
      
      // 시간 파싱 (HH:MM)
      const [depHours, depMinutes] = departureTime.split(':').map(Number);
      const [arrHours, arrMinutes] = arrivalTime.split(':').map(Number);
      
      // 날짜 파싱
      const depDate = departureDate ? new Date(departureDate + 'T00:00:00') : new Date();
      let arrDate = arrivalDate ? new Date(arrivalDate + 'T00:00:00') : new Date(departureDate + 'T00:00:00');
      
      // 출발 시간이 오후(12시 이후)이고 도착 시간이 오전(12시 이전)이면 하루 추가
      // 이는 일반적으로 다음날 도착을 의미함
      if (depHours >= 12 && arrHours < 12 && !arrivalDate) {
        arrDate = new Date(arrDate);
        arrDate.setDate(arrDate.getDate() + 1);
      }
      
      // 날짜가 같은 경우에도 시간 차이를 확인하여 하루 추가 필요 여부 판단
      // UTC로 변환했을 때 음수가 나오면 하루 추가 필요
      const testDepUTC = new Date(Date.UTC(
        depDate.getFullYear(),
        depDate.getMonth(),
        depDate.getDate(),
        depHours - depOffset,
        depMinutes,
        0,
        0
      ));
      const testArrUTC = new Date(Date.UTC(
        arrDate.getFullYear(),
        arrDate.getMonth(),
        arrDate.getDate(),
        arrHours - arrOffset,
        arrMinutes,
        0,
        0
      ));
      
      // 테스트 계산으로 음수가 나오면 하루 추가
      if (testArrUTC.getTime() < testDepUTC.getTime()) {
        arrDate = new Date(arrDate);
        arrDate.setDate(arrDate.getDate() + 1);
      }
      
      // 출발지 현지시간을 UTC로 변환
      // 예: 인천 16:40 (UTC+9) -> UTC 07:40
      const depUTC = new Date(Date.UTC(
        depDate.getFullYear(),
        depDate.getMonth(),
        depDate.getDate(),
        depHours - depOffset,
        depMinutes,
        0,
        0
      ));
      
      // 도착지 현지시간을 UTC로 변환
      // 예: 시애틀 01:58 (UTC-8) -> UTC 09:58
      // arrDate가 하루 추가되었는지 확인하여 올바른 날짜 사용
      const arrUTC = new Date(Date.UTC(
        arrDate.getFullYear(),
        arrDate.getMonth(),
        arrDate.getDate(),
        arrHours - arrOffset,
        arrMinutes,
        0,
        0
      ));
      
      // UTC 기준 시간 차이 계산 (밀리초)
      let diffMs = arrUTC.getTime() - depUTC.getTime();
      
      // 음수면 날짜가 넘어간 경우 (도착이 출발보다 이전인 경우)
      // 이 경우는 일반적으로 발생하지 않지만, 안전장치로 처리
      if (diffMs < 0) {
        // 하루 추가
        arrUTC.setUTCDate(arrUTC.getUTCDate() + 1);
        diffMs = arrUTC.getTime() - depUTC.getTime();
      }
      
      // 분 단위로 변환
      const totalMinutes = Math.floor(diffMs / (1000 * 60));
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      // 디버깅 로그 (개발 중에만)
      if (process.env.NODE_ENV === 'development') {
        console.log('[Flight Duration Calculation]', {
          departure: `${departureAirport} ${depHours}:${depMinutes.toString().padStart(2, '0')} (UTC${depOffset >= 0 ? '+' : ''}${depOffset})`,
          arrival: `${arrivalAirport} ${arrHours}:${arrMinutes.toString().padStart(2, '0')} (UTC${arrOffset >= 0 ? '+' : ''}${arrOffset})`,
          depUTC: depUTC.toISOString(),
          arrUTC: arrUTC.toISOString(),
          diffMs,
          result: `${hours}시간 ${minutes}분`
        });
      }
      
      return `${hours}시간 ${minutes}분`;
    } catch (error) {
      console.error('Duration calculation error:', error);
      return '';
    }
  };

  // 날짜 포맷팅 (요일 포함)
  const formatDateWithDay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dayOfWeek = days[date.getDay()];
    return `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">✈️</span>
        <h3 className="text-lg font-bold text-gray-800">항공 정보</h3>
      </div>

      {/* 여행기간 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          여행기간
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">출발일</label>
            <input
              type="date"
              value={localFlightInfo.travelPeriod.startDate}
              onChange={(e) => {
                const newPeriod = {
                  ...localFlightInfo.travelPeriod,
                  startDate: e.target.value,
                };
                updateFlightInfo({ travelPeriod: newPeriod });
                updateFlightInfo({
                  departure: { ...localFlightInfo.departure, date: e.target.value },
                });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">종료일</label>
            <input
              type="date"
              value={localFlightInfo.travelPeriod.endDate}
              onChange={(e) => {
                const newPeriod = {
                  ...localFlightInfo.travelPeriod,
                  endDate: e.target.value,
                };
                updateFlightInfo({ travelPeriod: newPeriod });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {localFlightInfo.travelPeriod.startDate && localFlightInfo.travelPeriod.endDate && (
            <span>
              {formatDateWithDay(localFlightInfo.travelPeriod.startDate)} ~{' '}
              {formatDateWithDay(localFlightInfo.travelPeriod.endDate)} /{' '}
              {localFlightInfo.travelPeriod.nights}박 {localFlightInfo.travelPeriod.days}일
            </span>
          )}
        </div>
      </div>

      {/* 출국 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-lg">✈️</span>
          출국
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">출발지</label>
            <input
              type="text"
              value={localFlightInfo.departure.from}
              onChange={(e) =>
                updateFlightInfo({
                  departure: { ...localFlightInfo.departure, from: e.target.value },
                })
              }
              placeholder="예: 인천"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">도착지</label>
            <input
              type="text"
              value={localFlightInfo.departure.to}
              onChange={(e) =>
                updateFlightInfo({
                  departure: { ...localFlightInfo.departure, to: e.target.value },
                })
              }
              placeholder="예: 시애틀"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">출발일</label>
            <input
              type="date"
              value={localFlightInfo.departure.date}
              onChange={(e) =>
                updateFlightInfo({
                  departure: { ...localFlightInfo.departure, date: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">출발시간</label>
            <input
              type="time"
              value={localFlightInfo.departure.time}
              onChange={(e) => {
                const updated = {
                  ...localFlightInfo.departure,
                  time: e.target.value,
                };
                // 도착시간이 있으면 소요시간 자동 계산
                if (localFlightInfo.departure.arrivalTime) {
                  // 출발 시간이 오후이고 도착 시간이 오전이면 하루 추가
                  const depHours = parseInt(e.target.value.split(':')[0]);
                  const arrHours = parseInt(localFlightInfo.departure.arrivalTime.split(':')[0]);
                  const arrivalDate = (depHours >= 12 && arrHours < 12) 
                    ? new Date(new Date(localFlightInfo.departure.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    : localFlightInfo.departure.date;
                  
                  updated.duration = calculateDuration(
                    e.target.value,
                    localFlightInfo.departure.arrivalTime,
                    localFlightInfo.departure.date,
                    localFlightInfo.departure.from,
                    localFlightInfo.departure.to,
                    arrivalDate
                  );
                }
                updateFlightInfo({ departure: updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">도착시간</label>
            <input
              type="time"
              value={localFlightInfo.departure.arrivalTime || ''}
              onChange={(e) => {
                const updated = {
                  ...localFlightInfo.departure,
                  arrivalTime: e.target.value,
                };
                // 출발시간이 있으면 소요시간 자동 계산
                if (localFlightInfo.departure.time) {
                  // 출발 시간이 오후이고 도착 시간이 오전이면 하루 추가
                  const depHours = parseInt(localFlightInfo.departure.time.split(':')[0]);
                  const arrHours = parseInt(e.target.value.split(':')[0]);
                  const arrivalDate = (depHours >= 12 && arrHours < 12) 
                    ? new Date(new Date(localFlightInfo.departure.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    : localFlightInfo.departure.date;
                  
                  updated.duration = calculateDuration(
                    localFlightInfo.departure.time,
                    e.target.value,
                    localFlightInfo.departure.date,
                    localFlightInfo.departure.from,
                    localFlightInfo.departure.to,
                    arrivalDate
                  );
                }
                updateFlightInfo({ departure: updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">항공편명</label>
            <input
              type="text"
              value={localFlightInfo.departure.flightNumber}
              onChange={(e) =>
                updateFlightInfo({
                  departure: { ...localFlightInfo.departure, flightNumber: e.target.value },
                })
              }
              placeholder="예: KE041"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">소요시간</label>
            <input
              type="text"
              value={localFlightInfo.departure.duration}
              onChange={(e) =>
                updateFlightInfo({
                  departure: { ...localFlightInfo.departure, duration: e.target.value },
                })
              }
              placeholder="출발시간과 도착시간 입력 시 자동 계산"
              readOnly={!!(localFlightInfo.departure.time && localFlightInfo.departure.arrivalTime)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                localFlightInfo.departure.time && localFlightInfo.departure.arrivalTime
                  ? 'bg-gray-50 cursor-not-allowed'
                  : ''
              }`}
            />
            {localFlightInfo.departure.time && localFlightInfo.departure.arrivalTime && (
              <p className="text-xs text-green-600 mt-1">✓ 자동 계산됨</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">항공편 종류</label>
            <select
              value={localFlightInfo.departure.type}
              onChange={(e) =>
                updateFlightInfo({
                  departure: {
                    ...localFlightInfo.departure,
                    type: e.target.value as '직항' | '경유',
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="직항">직항</option>
              <option value="경유">경유</option>
            </select>
          </div>
        </div>
      </div>

      {/* 귀국 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-lg">✈️</span>
          귀국
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">출발지</label>
            <input
              type="text"
              value={localFlightInfo.return.from}
              onChange={(e) =>
                updateFlightInfo({
                  return: { ...localFlightInfo.return, from: e.target.value },
                })
              }
              placeholder="예: 시애틀"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">도착지</label>
            <input
              type="text"
              value={localFlightInfo.return.to}
              onChange={(e) =>
                updateFlightInfo({
                  return: { ...localFlightInfo.return, to: e.target.value },
                })
              }
              placeholder="예: 인천"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">출발일</label>
            <input
              type="date"
              value={localFlightInfo.return.date}
              onChange={(e) =>
                updateFlightInfo({
                  return: { ...localFlightInfo.return, date: e.target.value },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">출발시간</label>
            <input
              type="time"
              value={localFlightInfo.return.time}
              onChange={(e) => {
                const updated = {
                  ...localFlightInfo.return,
                  time: e.target.value,
                };
                // 도착시간이 있으면 소요시간 자동 계산
                if (localFlightInfo.return.arrivalTime) {
                  // 출발 시간이 오후이고 도착 시간이 오전이면 하루 추가
                  const depHours = parseInt(e.target.value.split(':')[0]);
                  const arrHours = parseInt(localFlightInfo.return.arrivalTime.split(':')[0]);
                  const arrivalDate = (depHours >= 12 && arrHours < 12) 
                    ? new Date(new Date(localFlightInfo.return.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    : localFlightInfo.return.date;
                  
                  updated.duration = calculateDuration(
                    e.target.value,
                    localFlightInfo.return.arrivalTime,
                    localFlightInfo.return.date,
                    localFlightInfo.return.from,
                    localFlightInfo.return.to,
                    arrivalDate
                  );
                }
                updateFlightInfo({ return: updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">도착시간</label>
            <input
              type="time"
              value={localFlightInfo.return.arrivalTime || ''}
              onChange={(e) => {
                const updated = {
                  ...localFlightInfo.return,
                  arrivalTime: e.target.value,
                };
                // 출발시간이 있으면 소요시간 자동 계산
                if (localFlightInfo.return.time) {
                  // 출발 시간이 오후이고 도착 시간이 오전이면 하루 추가
                  const depHours = parseInt(localFlightInfo.return.time.split(':')[0]);
                  const arrHours = parseInt(e.target.value.split(':')[0]);
                  const arrivalDate = (depHours >= 12 && arrHours < 12) 
                    ? new Date(new Date(localFlightInfo.return.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    : localFlightInfo.return.date;
                  
                  updated.duration = calculateDuration(
                    localFlightInfo.return.time,
                    e.target.value,
                    localFlightInfo.return.date,
                    localFlightInfo.return.from,
                    localFlightInfo.return.to,
                    arrivalDate
                  );
                }
                updateFlightInfo({ return: updated });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">항공편명</label>
            <input
              type="text"
              value={localFlightInfo.return.flightNumber}
              onChange={(e) =>
                updateFlightInfo({
                  return: { ...localFlightInfo.return, flightNumber: e.target.value },
                })
              }
              placeholder="예: KE042"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">소요시간</label>
            <input
              type="text"
              value={localFlightInfo.return.duration}
              onChange={(e) =>
                updateFlightInfo({
                  return: { ...localFlightInfo.return, duration: e.target.value },
                })
              }
              placeholder="출발시간과 도착시간 입력 시 자동 계산"
              readOnly={!!(localFlightInfo.return.time && localFlightInfo.return.arrivalTime)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${
                localFlightInfo.return.time && localFlightInfo.return.arrivalTime
                  ? 'bg-gray-50 cursor-not-allowed'
                  : ''
              }`}
            />
            {localFlightInfo.return.time && localFlightInfo.return.arrivalTime && (
              <p className="text-xs text-green-600 mt-1">✓ 자동 계산됨</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">항공편 종류</label>
            <select
              value={localFlightInfo.return.type}
              onChange={(e) =>
                updateFlightInfo({
                  return: {
                    ...localFlightInfo.return,
                    type: e.target.value as '직항' | '경유',
                  },
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="직항">직항</option>
              <option value="경유">경유</option>
            </select>
          </div>
        </div>
      </div>

      {/* 비행기 정보 */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <span className="text-lg">✈️</span>
          비행기 정보
        </label>
        <input
          type="text"
          value={localFlightInfo.aircraftType || ''}
          onChange={(e) =>
            updateFlightInfo({ aircraftType: e.target.value })
          }
          placeholder="예: 보잉 777-300ER, 에어버스 A350-900 등"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          사용되는 비행기 기종을 입력하세요
        </p>
      </div>
    </div>
  );
}

