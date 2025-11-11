'use client';

import { useState, useEffect, useMemo } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiClock, FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

type ScheduledMessage = {
  id: number;
  title: string;
  category: string;
  groupName: string | null;
  description: string | null;
  sendMethod: string;
  senderName: string | null;
  senderPhone: string | null;
  senderEmail: string | null;
  optOutNumber: string | null;
  isAdMessage: boolean;
  autoAddAdTag: boolean;
  autoAddOptOut: boolean;
  startDate: string | null;
  startTime: string | null;
  maxDays: number;
  repeatInterval: number | null;
  isActive: boolean;
  createdAt: string;
  stages: ScheduledMessageStage[];
};

type ScheduledMessageStage = {
  id: number;
  stageNumber: number;
  daysAfter: number;
  sendTime: string | null;
  title: string;
  content: string;
  order: number;
};

export default function ScheduledMessagesPage() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    category: '예약메시지',
    groupName: '',
    description: '',
    sendMethod: 'sms' as 'email' | 'sms' | 'kakao' | 'cruise-guide',
    senderName: '크루즈닷',
    senderPhone: '',
    senderEmail: '',
    optOutNumber: '080-888-1003',
    isAdMessage: true,
    autoAddAdTag: true,
    autoAddOptOut: true,
    startDate: '',
    startTime: '',
    maxDays: 99999,
    repeatInterval: null as number | null,
    stages: [
      {
        stageNumber: 1,
        daysAfter: 0,
        sendTime: '',
        title: '',
        content: '',
      },
    ] as Array<{
      stageNumber: number;
      daysAfter: number;
      sendTime: string;
      title: string;
      content: string;
    }>,
  });

  // 메시지 목록 로드
  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/scheduled-messages', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load scheduled messages:', error);
      alert('예약 메시지를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // 새 메시지 작성 모달 열기
  const openCreateModal = () => {
    setEditingMessage(null);
    setFormData({
      title: '',
      category: '예약메시지',
      groupName: '',
      description: '',
      sendMethod: 'sms',
      senderName: '크루즈닷',
      senderPhone: '',
      senderEmail: '',
      optOutNumber: '080-888-1003',
      isAdMessage: true,
      autoAddAdTag: true,
      autoAddOptOut: true,
      startDate: '',
      startTime: '',
      maxDays: 99999,
      repeatInterval: null,
      stages: [
        {
          stageNumber: 1,
          daysAfter: 0,
          sendTime: '',
          title: '',
          content: '',
        },
      ],
    });
    setShowModal(true);
  };

  // 단계 추가
  const addStage = () => {
    const newStageNumber = formData.stages.length + 1;
    setFormData({
      ...formData,
      stages: [
        ...formData.stages,
        {
          stageNumber: newStageNumber,
          daysAfter: 0,
          sendTime: '',
          title: '',
          content: '',
        },
      ],
    });
  };

  // 단계 제거
  const removeStage = (index: number) => {
    if (formData.stages.length <= 1) {
      alert('최소 1개의 단계가 필요합니다.');
      return;
    }
    const newStages = formData.stages.filter((_, i) => i !== index);
    // 단계 번호 재정렬
    newStages.forEach((stage, i) => {
      stage.stageNumber = i + 1;
    });
    setFormData({
      ...formData,
      stages: newStages,
    });
  };

  // 메시지 저장
  const handleSave = async () => {
    // 유효성 검사
    if (!formData.title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (formData.sendMethod === 'sms' && !formData.senderPhone.trim()) {
      alert('SMS 발송 시 발신번호를 입력해주세요.');
      return;
    }

    if (formData.sendMethod === 'email' && !formData.senderEmail.trim()) {
      alert('이메일 발송 시 발신 이메일을 입력해주세요.');
      return;
    }

    if (formData.isAdMessage && formData.autoAddOptOut && !formData.optOutNumber.trim()) {
      alert('무료수신거부 번호를 입력해주세요.');
      return;
    }

    // 단계별 유효성 검사
    for (let i = 0; i < formData.stages.length; i++) {
      const stage = formData.stages[i];
      if (!stage.title.trim() || !stage.content.trim()) {
        alert(`${i + 1}회차 메시지의 제목과 내용을 모두 입력해주세요.`);
        return;
      }
    }

    // 야간 시간 체크 (SMS/카카오톡의 경우)
    if (formData.sendMethod === 'sms' || formData.sendMethod === 'kakao') {
      const sendTime = formData.startTime || formData.stages[0]?.sendTime;
      if (sendTime) {
        const [hours] = sendTime.split(':').map(Number);
        if (hours >= 21 || hours < 8) {
          if (!confirm('야간 시간(오후 9시 ~ 오전 8시)에 광고성 메시지를 발송하면 법적 문제가 발생할 수 있습니다. 계속하시겠습니까?')) {
            return;
          }
        }
      }
    }

    try {
      const url = editingMessage
        ? `/api/admin/scheduled-messages/${editingMessage.id}`
        : '/api/admin/scheduled-messages';
      const method = editingMessage ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.ok) {
        alert(editingMessage ? '예약 메시지가 수정되었습니다.' : '예약 메시지가 생성되었습니다.');
        setShowModal(false);
        loadMessages();
      } else {
        alert('저장 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save scheduled message:', error);
      alert('예약 메시지 저장 중 오류가 발생했습니다.');
    }
  };

  // 메시지 삭제
  const handleDelete = async (message: ScheduledMessage) => {
    if (!confirm('정말 이 예약 메시지를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/scheduled-messages/${message.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.ok) {
        alert('예약 메시지가 삭제되었습니다.');
        loadMessages();
      } else {
        alert('삭제 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to delete scheduled message:', error);
      alert('예약 메시지 삭제 중 오류가 발생했습니다.');
    }
  };

  // 필터링된 메시지 목록
  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const query = searchQuery.toLowerCase();
    return messages.filter(
      (msg) =>
        msg.title.toLowerCase().includes(query) ||
        msg.groupName?.toLowerCase().includes(query) ||
        msg.description?.toLowerCase().includes(query)
    );
  }, [messages, searchQuery]);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <span className="text-4xl">📅</span>
            예약 메시지 관리
          </h1>
          <p className="text-gray-600 mt-2">
            고객에게 예약된 시간에 자동으로 발송되는 메시지를 관리합니다.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
        >
          <FiPlus size={20} />
          예약 메시지 작성
        </button>
      </div>

      {/* 검색 */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="제목, 묶음명, 설명으로 검색..."
          className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* 메시지 목록 */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-md text-center">
          <p className="text-gray-500 text-lg">등록된 예약 메시지가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => (
            <div
              key={message.id}
              className="bg-white p-6 rounded-xl shadow-md border-2 border-gray-200 hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{message.title}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-semibold">
                      {message.sendMethod === 'sms' ? 'SMS' : message.sendMethod === 'email' ? '이메일' : message.sendMethod === 'kakao' ? '카카오톡' : '크루즈가이드'}
                    </span>
                    {message.isAdMessage && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-semibold">
                        광고
                      </span>
                    )}
                    {message.isActive ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                        활성
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm font-semibold">
                        비활성
                      </span>
                    )}
                  </div>
                  {message.groupName && (
                    <p className="text-sm text-gray-600 mb-1">묶음명: {message.groupName}</p>
                  )}
                  {message.description && (
                    <p className="text-sm text-gray-600 mb-2">{message.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
                    <span>단계: {message.stages.length}개</span>
                    {message.startDate && (
                      <span>시작일: {new Date(message.startDate).toLocaleDateString('ko-KR')}</span>
                    )}
                    {message.repeatInterval && (
                      <span>반복: {message.repeatInterval}일마다</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingMessage(message);
                      setFormData({
                        title: message.title,
                        category: message.category,
                        groupName: message.groupName || '',
                        description: message.description || '',
                        sendMethod: message.sendMethod as any,
                        senderName: message.senderName || '',
                        senderPhone: message.senderPhone || '',
                        senderEmail: message.senderEmail || '',
                        optOutNumber: message.optOutNumber || '',
                        isAdMessage: message.isAdMessage,
                        autoAddAdTag: message.autoAddAdTag,
                        autoAddOptOut: message.autoAddOptOut,
                        startDate: message.startDate ? new Date(message.startDate).toISOString().split('T')[0] : '',
                        startTime: message.startTime || '',
                        maxDays: message.maxDays,
                        repeatInterval: message.repeatInterval,
                        stages: message.stages.map((s) => ({
                          stageNumber: s.stageNumber,
                          daysAfter: s.daysAfter,
                          sendTime: s.sendTime || '',
                          title: s.title,
                          content: s.content,
                        })),
                      });
                      setShowModal(true);
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    <FiEdit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(message)}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 작성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                <span className="text-4xl">📅</span>
                {editingMessage ? '예약 메시지 수정' : '예약 메시지 작성'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:scale-110 transition-transform"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="예약 메시지 제목"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    카테고리
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="예약메시지"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    퍼널문자 묶음명
                  </label>
                  <input
                    type="text"
                    value={formData.groupName}
                    onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    placeholder="동일한 묶음끼리 목록에서 표시"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                </div>
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-2">
                    발송 방식 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.sendMethod}
                    onChange={(e) => {
                      const method = e.target.value as any;
                      setFormData({
                        ...formData,
                        sendMethod: method,
                        maxDays: method === 'sms' ? 999999 : 99999,
                      });
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="sms">SMS</option>
                    <option value="email">이메일</option>
                    <option value="kakao">카카오톡 알림톡</option>
                    <option value="cruise-guide">크루즈가이드 메시지</option>
                  </select>
                </div>
              </div>

              {/* 발신자 정보 */}
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">발신자 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      업체명/서비스명
                    </label>
                    <input
                      type="text"
                      value={formData.senderName}
                      onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                      placeholder="크루즈닷"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  {formData.sendMethod === 'sms' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        발신번호 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.senderPhone}
                        onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                        placeholder="010-1234-5678"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  )}
                  {formData.sendMethod === 'email' && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        발신 이메일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.senderEmail}
                        onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                        placeholder="sender@example.com"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* 광고성 메시지 설정 */}
              <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                  <FiAlertCircle size={20} />
                  광고성 메시지 법규 준수
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isAdMessage}
                      onChange={(e) => setFormData({ ...formData, isAdMessage: e.target.checked })}
                      className="w-5 h-5"
                    />
                    <span className="font-semibold text-gray-900">광고성 메시지입니다</span>
                  </label>
                  {formData.isAdMessage && (
                    <>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.autoAddAdTag}
                          onChange={(e) => setFormData({ ...formData, autoAddAdTag: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <span className="text-gray-900">제목에 "(광고)" 자동 추가</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.autoAddOptOut}
                          onChange={(e) => setFormData({ ...formData, autoAddOptOut: e.target.checked })}
                          className="w-5 h-5"
                        />
                        <span className="text-gray-900">메시지 끝에 "무료수신거부" 자동 추가</span>
                      </label>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          무료수신거부 번호 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.optOutNumber}
                          onChange={(e) => setFormData({ ...formData, optOutNumber: e.target.value })}
                          placeholder="080-888-1003"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          ※ 야간 시간(오후 9시 ~ 오전 8시) 광고성 정보 전송은 금지됩니다.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 예약 설정 */}
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">예약 설정</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      시작 날짜
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      시작 시간
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      반복 간격 (일)
                    </label>
                    <input
                      type="number"
                      value={formData.repeatInterval || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          repeatInterval: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      placeholder="비워두면 1회만 발송"
                      min="1"
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    최대 예약 일수
                  </label>
                  <input
                    type="number"
                    value={formData.maxDays}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDays: parseInt(e.target.value) || 99999 })
                    }
                    min="1"
                    max={formData.sendMethod === 'sms' ? 999999 : 99999}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    SMS: 최대 999999일, 기타: 최대 99999일
                  </p>
                </div>
              </div>

              {/* 메시지 단계 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">메시지 단계</h3>
                  <button
                    type="button"
                    onClick={addStage}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-semibold"
                  >
                    + 단계 추가
                  </button>
                </div>
                {formData.stages.map((stage, index) => (
                  <div key={index} className="p-4 bg-white border-2 border-gray-300 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-900">{stage.stageNumber}회차 메시지</h4>
                      {formData.stages.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeStage(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiX size={20} />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          시작점으로부터 며칠 후
                        </label>
                        <input
                          type="number"
                          value={stage.daysAfter}
                          onChange={(e) => {
                            const newStages = [...formData.stages];
                            newStages[index].daysAfter = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, stages: newStages });
                          }}
                          min="0"
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          0일로 설정 시 시작 시간에 발송
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          발송 시간
                        </label>
                        <input
                          type="time"
                          value={stage.sendTime}
                          onChange={(e) => {
                            const newStages = [...formData.stages];
                            newStages[index].sendTime = e.target.value;
                            setFormData({ ...formData, stages: newStages });
                          }}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        제목 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={stage.title}
                        onChange={(e) => {
                          const newStages = [...formData.stages];
                          newStages[index].title = e.target.value;
                          setFormData({ ...formData, stages: newStages });
                        }}
                        placeholder="메시지 제목"
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        내용 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={stage.content}
                        onChange={(e) => {
                          const newStages = [...formData.stages];
                          newStages[index].content = e.target.value;
                          setFormData({ ...formData, stages: newStages });
                        }}
                        placeholder="보내실 내용을 입력해주세요."
                        rows={4}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  메시지 설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="동일한 제목 구분 시 사용, 입력 시에만 제목 대신 노출됩니다."
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base resize-none"
                />
              </div>

              {/* 버튼 */}
              <div className="flex gap-4 pt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all shadow-md"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all"
                >
                  <FiClock size={18} />
                  {editingMessage ? '수정하기' : '저장하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

