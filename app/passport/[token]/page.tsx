'use client';

import type { ChangeEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiFilePlus,
  FiPlus,
  FiTrash,
  FiUpload,
  FiUserCheck,
} from 'react-icons/fi';

interface PassportFile {
  fileName: string;
  url: string;
  uploadedAt?: string;
}

interface SubmissionInfo {
  id: number;
  token: string;
  expiresAt: string;
  isExpired: boolean;
  isSubmitted: boolean;
  submittedAt: string | null;
  driveFolderUrl: string | null;
  extraData: {
    passportFiles: PassportFile[];
    groups: Array<{
      groupNumber: number;
      guests: Array<GuestPayload>;
    }>;
    remarks: string;
  };
}

interface UserInfo {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
}

interface TripInfo {
  id: number;
  cruiseName: string | null;
  startDate: string | null;
  endDate: string | null;
  reservationCode: string | null;
}

interface GuestPayload {
  id: string;
  name: string;
  phone: string;
  passportNumber: string;
  nationality: string;
  dateOfBirth: string;
  passportExpiryDate: string;
}

interface GroupState {
  groupNumber: number;
  guests: GuestPayload[];
}

type Step = 0 | 1 | 2 | 3 | 4;

const MAX_GROUPS = 30;
const MAX_GUESTS_PER_GROUP = 10;

function createEmptyGuest(): GuestPayload {
  return {
    id: `guest-${Math.random().toString(36).slice(2)}`,
    name: '',
    phone: '',
    passportNumber: '',
    nationality: '',
    dateOfBirth: '',
    passportExpiryDate: '',
  };
}

function createInitialGroups(savedGroups?: Array<{ groupNumber: number; guests: Array<Partial<GuestPayload>> }>): GroupState[] {
  if (savedGroups && savedGroups.length > 0) {
    return savedGroups.slice(0, MAX_GROUPS).map((group, index) => ({
      groupNumber: group.groupNumber ?? index + 1,
      guests:
        group.guests && group.guests.length > 0
          ? group.guests.slice(0, MAX_GUESTS_PER_GROUP).map((guest) => ({
              ...createEmptyGuest(),
              ...guest,
              id: `guest-${Math.random().toString(36).slice(2)}`,
              name: guest.name ?? '',
              phone: guest.phone ?? '',
              passportNumber: guest.passportNumber ?? '',
              nationality: guest.nationality ?? '',
              dateOfBirth: guest.dateOfBirth ?? '',
              passportExpiryDate: guest.passportExpiryDate ?? '',
            }))
          : [createEmptyGuest()],
    }));
  }

  return [
    {
      groupNumber: 1,
      guests: [createEmptyGuest()],
    },
  ];
}

export default function PassportSubmissionPage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const token = params.token;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>(0);
  const [submission, setSubmission] = useState<SubmissionInfo | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [tripInfo, setTripInfo] = useState<TripInfo | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<PassportFile[]>([]);
  const [groups, setGroups] = useState<GroupState[]>(createInitialGroups());
  const [remarks, setRemarks] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchSubmission = async () => {
      try {
        const res = await fetch(`/api/passport/${token}`, { signal: controller.signal });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || '토큰 확인 중 오류가 발생했습니다.');
        }
        const data = await res.json();
        setSubmission(data.submission);
        setUserInfo(data.user);
        setTripInfo(data.trip);
        setUploadedFiles(data.submission.extraData?.passportFiles ?? []);
        setRemarks(data.submission.extraData?.remarks ?? '');
        setGroups(createInitialGroups(data.submission.extraData?.groups));

        if (data.submission.isSubmitted) {
          setStep(4);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : '토큰 확인 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
    return () => controller.abort();
  }, [token]);

  const expiresInText = useMemo(() => {
    if (!submission) return '';
    const diff = new Date(submission.expiresAt).getTime() - Date.now();
    if (diff <= 0) return '만료됨';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${hours}시간 ${minutes}분 남음`;
  }, [submission]);

  const handleNextStep = () => {
    setStep((prev) => (prev >= 3 ? prev : ((prev + 1) as Step)));
  };

  const handlePrevStep = () => {
    setStep((prev) => (prev <= 0 ? prev : ((prev - 1) as Step)));
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const res = await fetch(`/api/passport/${token}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || '업로드에 실패했습니다.');
      }
      setUploadedFiles(data.files ?? []);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleAddGroup = () => {
    if (groups.length >= MAX_GROUPS) {
      alert(`그룹은 최대 ${MAX_GROUPS}개까지 추가할 수 있어요.`);
      return;
    }
    const nextGroupNumber = Math.max(...groups.map((g) => g.groupNumber)) + 1;
    setGroups((prev) => [...prev, { groupNumber: nextGroupNumber, guests: [createEmptyGuest()] }]);
  };

  const handleRemoveGroup = (groupNumber: number) => {
    if (groups.length === 1) {
      alert('최소 1개의 그룹은 유지해야 합니다.');
      return;
    }
    setGroups((prev) => prev.filter((group) => group.groupNumber !== groupNumber));
  };

  const handleAddGuest = (groupNumber: number) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.groupNumber === groupNumber
          ? {
              ...group,
              guests:
                group.guests.length >= MAX_GUESTS_PER_GROUP
                  ? group.guests
                  : [...group.guests, createEmptyGuest()],
            }
          : group,
      ),
    );
  };

  const handleRemoveGuest = (groupNumber: number, guestId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.groupNumber === groupNumber
          ? {
              ...group,
              guests:
                group.guests.length <= 1
                  ? group.guests
                  : group.guests.filter((guest) => guest.id !== guestId),
            }
          : group,
      ),
    );
  };

  const handleGuestChange = (groupNumber: number, guestId: string, field: keyof GuestPayload, value: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.groupNumber === groupNumber
          ? {
              ...group,
              guests: group.guests.map((guest) =>
                guest.id === guestId
                  ? {
                      ...guest,
                      [field]: value,
                    }
                  : guest,
              ),
            }
          : group,
      ),
    );
  };

  const totalGuests = useMemo(
    () => groups.reduce((sum, group) => sum + group.guests.filter((guest) => guest.name.trim().length > 0).length, 0),
    [groups],
  );

  const handleSubmit = async () => {
    if (submitting) return;

    const sanitizedGroups = groups.map((group) => ({
      groupNumber: group.groupNumber,
      guests: group.guests.map(({ id, ...rest }) => ({ ...rest })),
    }));

    if (sanitizedGroups.every((group) => group.guests.every((guest) => guest.name.trim().length === 0))) {
      alert('탑승자 이름을 최소 한 명 이상 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`/api/passport/${token}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groups: sanitizedGroups,
          remarks,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || '제출에 실패했습니다.');
      }
      setSuccessMessage('여권 정보 제출이 완료되었습니다. 빠르게 확인 후 안내드릴게요!');
      setStep(4);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : '제출 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-lg text-blue-700">여권 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="max-w-md bg-white border border-red-200 rounded-2xl shadow-lg p-8 text-center space-y-4">
          <FiAlertCircle className="text-red-500 text-5xl mx-auto" />
          <h1 className="text-2xl font-bold text-red-600">링크를 사용할 수 없습니다</h1>
          <p className="text-gray-600 leading-relaxed">{error ?? '링크가 만료되었거나 잘못된 접근입니다. 담당자에게 문의해주세요.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-5 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (step === 4 || submission.isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white border border-green-200 rounded-2xl shadow-xl p-8 space-y-5 text-center">
          <FiCheckCircle className="text-green-500 text-5xl mx-auto" />
          <h1 className="text-3xl font-extrabold text-green-700">여권 정보 제출이 완료되었습니다!</h1>
          <p className="text-gray-600 leading-relaxed">
            {successMessage || '제출해 주신 여권과 객실 배정 정보를 담당자가 확인 중입니다. 추가 안내가 곧 전달될 예정입니다.'}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-900">
            <p>제출일시: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : new Date().toLocaleString()}</p>
            {userInfo?.name && <p className="mt-1">제출자: {userInfo.name}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 bg-white border border-blue-100 shadow-lg rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 flex items-center gap-3">
                <span className="text-4xl">🛂</span>
                여권 제출 & 객실 배정
              </h1>
              <p className="mt-3 text-base md:text-lg text-gray-600 leading-relaxed">
                아래 안내에 따라 여권 사진을 업로드하고 객실 배정을 입력해주세요. 10분 이내에 완료되며, 제출 후 담당자가 확인하여 연락드릴 예정입니다.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 text-blue-900">
              <FiClock className="text-2xl" />
              <div>
                <p className="text-sm font-semibold">만료까지</p>
                <p className="text-lg font-bold">{expiresInText}</p>
              </div>
            </div>
          </div>

          {tripInfo && (
            <div className="mt-6 grid md:grid-cols-2 gap-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <div>
                <p className="text-sm text-blue-700 font-semibold">여행 상품</p>
                <p className="text-lg font-bold text-blue-900">{tripInfo.cruiseName ?? '상품명 미확인'}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 font-semibold">여행 일정</p>
                <p className="text-lg font-bold text-blue-900">
                  {tripInfo.startDate ? new Date(tripInfo.startDate).toLocaleDateString() : '?'} ~{' '}
                  {tripInfo.endDate ? new Date(tripInfo.endDate).toLocaleDateString() : '?'}
                </p>
              </div>
              {tripInfo.reservationCode && (
                <div>
                  <p className="text-sm text-blue-700 font-semibold">예약 번호</p>
                  <p className="text-lg font-bold text-blue-900">{tripInfo.reservationCode}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-6 grid grid-cols-4 gap-3">
          {['시작하기', '여권 업로드', '객실 배정 입력', '검토 & 제출'].map((label, index) => {
            const stepIndex = index as Step;
            const isActive = step === stepIndex;
            const isCompleted = step > stepIndex;
            return (
              <div
                key={label}
                className={`rounded-xl border-2 px-3 py-4 text-center text-sm md:text-base font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                    : isCompleted
                    ? 'bg-green-100 text-green-700 border-green-200'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {label}
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
          {step === 0 && (
            <section className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-4">
                <FiCheckCircle className="text-blue-600 text-3xl" />
                <div className="text-sm md:text-base text-blue-900 leading-relaxed">
                  <p className="font-semibold">제출 전 준비해주세요</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>여권 사진은 정보면 전체가 잘 나오도록 촬영해주세요.</li>
                    <li>각 객실에 함께 머물고 싶은 사람을 그룹으로 묶어 입력하세요.</li>
                    <li>필요시 담당자가 연락드릴 수 있도록 정확한 연락처를 기입해주세요.</li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <button
                  onClick={handleNextStep}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  다음 단계로 <FiChevronRight />
                </button>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <FiUpload /> 여권 사진 업로드
                </h2>
                <p className="text-gray-600">
                  여권 정보면 사진을 업로드해주세요. 여러 장이 필요한 경우 하나씩 업로드하면 목록에 추가됩니다.
                </p>
              </div>

              <label className="border-2 border-dashed border-blue-300 rounded-2xl p-8 bg-blue-50 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-500 transition-colors">
                <FiFilePlus className="text-4xl text-blue-500" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-blue-800">여권 사진 선택하기</p>
                  <p className="text-sm text-blue-600">이미지 파일 (JPG, PNG) 업로드 가능</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>

              {uploading && (
                <div className="text-blue-600 flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  업로드 중입니다...
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">업로드된 여권</h3>
                {uploadedFiles.length === 0 ? (
                  <p className="text-sm text-gray-500">아직 업로드된 여권이 없습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <li key={file.url} className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-2">
                        <span className="text-sm text-gray-700">{file.fileName}</span>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          보기
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <button
                  onClick={handlePrevStep}
                  className="px-5 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <FiChevronLeft /> 이전 단계
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  다음 단계로 <FiChevronRight />
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <FiUserCheck /> 객실 배정 입력
                </h2>
                <p className="text-gray-600">함께 객실을 사용할 인원끼리 그룹으로 묶어주세요. 그룹은 최대 30개까지 추가할 수 있습니다.</p>
              </div>

              <div className="space-y-5">
                {groups.map((group) => (
                  <div key={group.groupNumber} className="border border-gray-200 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">그룹 {group.groupNumber}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAddGuest(group.groupNumber)}
                          className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm flex items-center gap-1"
                        >
                          <FiPlus /> 인원 추가
                        </button>
                        {groups.length > 1 && (
                          <button
                            onClick={() => handleRemoveGroup(group.groupNumber)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm flex items-center gap-1"
                          >
                            <FiTrash /> 그룹 삭제
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      {group.guests.map((guest) => (
                        <div key={guest.id} className="grid md:grid-cols-6 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-1">이름 *</label>
                            <input
                              type="text"
                              value={guest.name}
                              onChange={(event) => handleGuestChange(group.groupNumber, guest.id, 'name', event.target.value)}
                              placeholder="탑승자 이름"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-1">연락처</label>
                            <input
                              type="tel"
                              value={guest.phone}
                              onChange={(event) => handleGuestChange(group.groupNumber, guest.id, 'phone', event.target.value)}
                              placeholder="010-1234-5678"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">여권번호</label>
                            <input
                              type="text"
                              value={guest.passportNumber}
                              onChange={(event) => handleGuestChange(group.groupNumber, guest.id, 'passportNumber', event.target.value)}
                              placeholder="여권 번호"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">국적</label>
                            <input
                              type="text"
                              value={guest.nationality}
                              onChange={(event) => handleGuestChange(group.groupNumber, guest.id, 'nationality', event.target.value)}
                              placeholder="예: 대한민국"
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">생년월일</label>
                            <input
                              type="date"
                              value={guest.dateOfBirth}
                              onChange={(event) => handleGuestChange(group.groupNumber, guest.id, 'dateOfBirth', event.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1">여권 만료일</label>
                            <input
                              type="date"
                              value={guest.passportExpiryDate}
                              onChange={(event) => handleGuestChange(group.groupNumber, guest.id, 'passportExpiryDate', event.target.value)}
                              className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          {group.guests.length > 1 && (
                            <div className="md:col-span-6 flex justify-end">
                              <button
                                onClick={() => handleRemoveGuest(group.groupNumber, guest.id)}
                                className="px-3 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                              >
                                <FiTrash /> 인원 삭제
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddGroup}
                  className="w-full px-4 py-3 bg-green-50 text-green-700 border border-green-200 rounded-xl hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
              >
                <FiPlus /> 그룹 추가하기
              </button>

              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <button
                  onClick={handlePrevStep}
                  className="px-5 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <FiChevronLeft /> 이전 단계
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  다음 단계로 <FiChevronRight />
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">입력 내용 확인</h2>
                <p className="text-gray-600">제출 전에 여권 업로드와 객실 배정이 올바른지 다시 확인해주세요.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <FiFilePlus /> 업로드된 여권 ({uploadedFiles.length}건)
                </h3>
                {uploadedFiles.length === 0 ? (
                  <p className="text-sm text-red-500">여권 사진이 업로드되지 않았습니다. 이전 단계에서 업로드해주세요.</p>
                ) : (
                  <ul className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <li key={file.url} className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-2">
                        <span className="text-sm text-gray-700">{file.fileName}</span>
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                          보기
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">객실별 배정 요약 (총 {totalGuests}명)</h3>
                {groups.map((group) => (
                  <div key={group.groupNumber} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <h4 className="font-semibold text-gray-800 mb-2">그룹 {group.groupNumber}</h4>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {group.guests
                        .filter((guest) => guest.name.trim().length > 0)
                        .map((guest) => (
                          <li key={guest.id}>
                            <span className="font-semibold">{guest.name}</span>
                            {guest.phone && <span className="ml-2 text-gray-500">({guest.phone})</span>}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">추가 전달 사항</label>
                <textarea
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  rows={4}
                  placeholder="객실 선호, 알레르기, 특별 요청 등이 있다면 적어주세요."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <button
                  onClick={handlePrevStep}
                  className="px-5 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <FiChevronLeft /> 이전 단계
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || totalGuests === 0}
                  className={`px-5 py-3 rounded-xl text-white font-bold transition-colors flex items-center justify-center gap-2 ${
                    submitting || totalGuests === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      제출 중...
                    </>
                  ) : (
                    '여권 정보 제출하기'
                  )}
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
