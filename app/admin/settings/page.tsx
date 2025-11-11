'use client';

import { useState, useEffect } from 'react';
import { FiCopy, FiCheck, FiEye, FiEyeOff, FiSave, FiEdit2, FiPlus, FiTrash2, FiX } from 'react-icons/fi';

type KakaoApiManager = {
  id: string;
  name: string;
  phone: string;
  notifyEnabled: boolean;
  registeredAt: string;
};

type KakaoApiKey = {
  id: string;
  identifier: string;
  key: string;
  registeredAt: string;
};

type KakaoSenderKey = {
  id: string;
  channelId: string;
  senderKey: string;
  registeredAt: string;
};

type ServerIp = {
  id: string;
  ip: string;
  registeredAt: string;
};

type AdminInfo = {
  email: string;
  emailFromName: string;
  emailSmtpHost: string;
  emailSmtpPort: string;
  emailSmtpPassword: string;
  geminiApiKey: string;
  kakaoJsKey: string;
  kakaoAppName: string;
  kakaoAppId: string;
  kakaoRestApiKey: string;
  kakaoAdminKey: string;
  kakaoChannelId: string;
  kakaoChannelName: string;
  kakaoChannelSearchId: string;
  kakaoChannelUrl: string;
  kakaoChannelChatUrl: string;
  kakaoChannelBotId: string;
  aligoApiKey: string;
  aligoUserId: string;
  aligoSenderPhone: string;
  aligoKakaoSenderKey: string;
  aligoKakaoChannelId: string;
  pgSignkey: string;
  pgFieldEncryptIv: string;
  pgFieldEncryptKey: string;
  pgSignkeyNonAuth: string;
  pgFieldEncryptIvNonAuth: string;
  pgFieldEncryptKeyNonAuth: string;
  pgMidAuth: string;
  pgMidPassword: string;
  pgMidNonAuth: string;
  pgAdminUrl: string;
  pgMerchantName: string;
  baseUrl: string;
  pgCallbackUrl: string;
  pgNotifyUrl: string;
  pgVirtualAccountUrl: string;
  sendMethod: string;
  youtubeApiKey: string;
  kakaoApiManagers?: KakaoApiManager[];
  kakaoApiKeys?: KakaoApiKey[];
  kakaoSenderKeys?: KakaoSenderKey[];
  serverIps?: ServerIp[];
  currentIp?: string;
};

export default function AdminSettingsPage() {
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null);
  const [editableInfo, setEditableInfo] = useState<Partial<AdminInfo>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showKakaoKey, setShowKakaoKey] = useState(false);
  const [showKakaoRestApiKey, setShowKakaoRestApiKey] = useState(false);
  const [showKakaoAdminKey, setShowKakaoAdminKey] = useState(false);
  const [showAligoApiKey, setShowAligoApiKey] = useState(false);
  const [showAligoKakaoSenderKey, setShowAligoKakaoSenderKey] = useState(false);
  const [showPgSignkey, setShowPgSignkey] = useState(false);
  const [showPgFieldEncryptKey, setShowPgFieldEncryptKey] = useState(false);
  const [showPgMidPassword, setShowPgMidPassword] = useState(false);
  const [showPgSignkeyNonAuth, setShowPgSignkeyNonAuth] = useState(false);
  const [showPgFieldEncryptKeyNonAuth, setShowPgFieldEncryptKeyNonAuth] = useState(false);
  const [showYoutubeApiKey, setShowYoutubeApiKey] = useState(false);
  
  // 카카오톡 API 담당자 관리
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPhone, setNewManagerPhone] = useState('');
  const [newManagerNotify, setNewManagerNotify] = useState(true);
  
  // API Key 관리
  const [newApiKeyIdentifier, setNewApiKeyIdentifier] = useState('');
  
  // Senderkey 관리
  const [newSenderKeyChannelId, setNewSenderKeyChannelId] = useState('');
  const [newSenderKey, setNewSenderKey] = useState('');
  
  // 서버 IP 관리
  const [newServerIp, setNewServerIp] = useState('');
  
  // 발신번호
  const [senderPhoneNumber, setSenderPhoneNumber] = useState('01032893800');

  useEffect(() => {
    loadAdminInfo();
  }, []);

  const loadAdminInfo = async () => {
    try {
      const response = await fetch('/api/admin/settings/info', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setAdminInfo(data.info);
        setEditableInfo(data.info);
      }
    } catch (error) {
      console.error('Failed to load admin info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

    try {
      setIsSaving(true);
      
      // 환경 변수 매핑
      const envMapping: Record<string, string> = {
        email: 'EMAIL_SMTP_USER',
        emailFromName: 'EMAIL_FROM_NAME',
        emailSmtpHost: 'EMAIL_SMTP_HOST',
        emailSmtpPort: 'EMAIL_SMTP_PORT',
        emailSmtpPassword: 'EMAIL_SMTP_PASSWORD',
        geminiApiKey: 'GEMINI_API_KEY',
        kakaoJsKey: 'NEXT_PUBLIC_KAKAO_JS_KEY',
        kakaoAppName: 'KAKAO_APP_NAME',
        kakaoAppId: 'KAKAO_APP_ID',
        kakaoRestApiKey: 'KAKAO_REST_API_KEY',
        kakaoAdminKey: 'KAKAO_ADMIN_KEY',
        kakaoChannelId: 'NEXT_PUBLIC_KAKAO_CHANNEL_ID',
        kakaoChannelBotId: 'KAKAO_CHANNEL_BOT_ID',
        aligoApiKey: 'ALIGO_API_KEY',
        aligoUserId: 'ALIGO_USER_ID',
        aligoSenderPhone: 'ALIGO_SENDER_PHONE',
        aligoKakaoSenderKey: 'ALIGO_KAKAO_SENDER_KEY',
        aligoKakaoChannelId: 'ALIGO_KAKAO_CHANNEL_ID',
        pgSignkey: 'PG_SIGNKEY',
        pgFieldEncryptIv: 'PG_FIELD_ENCRYPT_IV',
        pgFieldEncryptKey: 'PG_FIELD_ENCRYPT_KEY',
        pgSignkeyNonAuth: 'PG_SIGNKEY_NON_AUTH',
        pgFieldEncryptIvNonAuth: 'PG_FIELD_ENCRYPT_IV_NON_AUTH',
        pgFieldEncryptKeyNonAuth: 'PG_FIELD_ENCRYPT_KEY_NON_AUTH',
        pgMidAuth: 'PG_MID_AUTH',
        pgMidPassword: 'PG_MID_PASSWORD',
        pgMidNonAuth: 'PG_MID_NON_AUTH',
        pgAdminUrl: 'PG_ADMIN_URL',
        pgMerchantName: 'PG_MERCHANT_NAME',
        baseUrl: 'NEXT_PUBLIC_BASE_URL',
        youtubeApiKey: 'YOUTUBE_API_KEY',
      };

      const updates: Record<string, string> = {};
      for (const [key, envKey] of Object.entries(envMapping)) {
        if (editableInfo[key as keyof AdminInfo] !== undefined && editableInfo[key as keyof AdminInfo] !== adminInfo?.[key as keyof AdminInfo]) {
          updates[envKey] = String(editableInfo[key as keyof AdminInfo] || '');
        }
      }

      if (Object.keys(updates).length === 0) {
        alert('변경된 내용이 없습니다.');
        setIsEditing(false);
        return;
      }

      const response = await fetch('/api/admin/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();
      if (data.ok) {
        alert(data.message + '\n\n' + (data.warning || ''));
        setIsEditing(false);
        await loadAdminInfo(); // 다시 로드
      } else {
        alert('저장 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditableInfo(adminInfo || {});
    setIsEditing(false);
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('복사 실패');
    }
  };

  const handleAddManager = async () => {
    if (!newManagerName || !newManagerPhone) {
      alert('성명과 전화번호를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/settings/kakao-managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newManagerName,
          phone: newManagerPhone,
          notifyEnabled: newManagerNotify,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setNewManagerName('');
        setNewManagerPhone('');
        setNewManagerNotify(true);
        await loadAdminInfo();
        alert('담당자가 추가되었습니다.');
      } else {
        alert('담당자 추가 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to add manager:', error);
      alert('담당자 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteManager = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/settings/kakao-managers/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.ok) {
        await loadAdminInfo();
        alert('담당자가 삭제되었습니다.');
      } else {
        alert('담당자 삭제 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to delete manager:', error);
      alert('담당자 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleRequestApiKey = async () => {
    if (!newApiKeyIdentifier) {
      alert('Identifier를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/settings/kakao-api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: newApiKeyIdentifier,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setNewApiKeyIdentifier('');
        await loadAdminInfo();
        alert('API Key 발급신청이 완료되었습니다.');
      } else {
        alert('API Key 발급신청 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to request API key:', error);
      alert('API Key 발급신청 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/settings/kakao-api-keys/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.ok) {
        await loadAdminInfo();
        alert('API Key가 삭제되었습니다.');
      } else {
        alert('API Key 삭제 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('API Key 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddServerIp = async () => {
    if (!newServerIp) {
      alert('IP번호를 입력해주세요.');
      return;
    }

    try {
      const response = await fetch('/api/admin/settings/server-ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ip: newServerIp,
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setNewServerIp('');
        await loadAdminInfo();
        alert('IP가 추가되었습니다.');
      } else {
        alert('IP 추가 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to add server IP:', error);
      alert('IP 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteServerIp = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/settings/server-ips/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.ok) {
        await loadAdminInfo();
        alert('IP가 삭제되었습니다.');
      } else {
        alert('IP 삭제 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to delete server IP:', error);
      alert('IP 삭제 중 오류가 발생했습니다.');
    }
  };

  const maskSensitiveInfo = (text: string, show: boolean) => {
    if (!text) return '';
    if (show) return text;
    if (text.length <= 8) return '•'.repeat(text.length);
    return text.substring(0, 4) + '•'.repeat(text.length - 8) + text.substring(text.length - 4);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-700">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-5xl">⚙️</span>
            관리자 정보
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            중요한 설정 정보를 확인하고 관리하세요
          </p>
        </div>
        <div className="flex gap-3">
          {isEditing && (
            <button
              onClick={handleCancel}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2 font-semibold"
            >
              취소
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`px-6 py-3 rounded-lg transition-colors flex items-center gap-2 font-semibold ${
              isEditing
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                저장 중...
              </>
            ) : isEditing ? (
              <>
                <FiSave size={18} />
                저장하기
              </>
            ) : (
              <>
                <FiEdit2 size={18} />
                수정하기
              </>
            )}
          </button>
        </div>
      </div>

      {/* 회사 정보 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">🏢</span>
          회사 정보
        </h2>
        <div className="space-y-4">
          <InfoRow
            label="상호"
            value="크루즈닷"
            onCopy={() => copyToClipboard('크루즈닷', 'companyName')}
            copied={copiedField === 'companyName'}
          />
          <InfoRow
            label="대표"
            value="배연성"
            onCopy={() => copyToClipboard('배연성', 'representative')}
            copied={copiedField === 'representative'}
          />
          <InfoRow
            label="주소"
            value="경기 화성시 효행로 1068 (리더스프라자) 603-A60호"
            onCopy={() => copyToClipboard('경기 화성시 효행로 1068 (리더스프라자) 603-A60호', 'address')}
            copied={copiedField === 'address'}
          />
          <InfoRow
            label="대표번호"
            value="010-3289-3800"
            onCopy={() => copyToClipboard('010-3289-3800', 'phone')}
            copied={copiedField === 'phone'}
          />
          <InfoRow
            label="이메일"
            value="hyeseon28@naver.com"
            onCopy={() => copyToClipboard('hyeseon28@naver.com', 'companyEmail')}
            copied={copiedField === 'companyEmail'}
          />
          <InfoRow
            label="사업자등록번호"
            value="714-57-00419"
            onCopy={() => copyToClipboard('714-57-00419', 'businessNumber')}
            copied={copiedField === 'businessNumber'}
          />
          <InfoRow
            label="통신판매업신고번호"
            value="제 2025-화성동부-0320 호"
            onCopy={() => copyToClipboard('제 2025-화성동부-0320 호', 'telecomNumber')}
            copied={copiedField === 'telecomNumber'}
          />
          <InfoRow
            label="관광사업자 등록번호"
            value="2025-000004호"
            onCopy={() => copyToClipboard('2025-000004호', 'tourismNumber')}
            copied={copiedField === 'tourismNumber'}
          />
          <InfoRow
            label="개인정보보호 책임자"
            value="전혜선"
            onCopy={() => copyToClipboard('전혜선', 'privacyOfficer')}
            copied={copiedField === 'privacyOfficer'}
          />
        </div>
      </div>

      {/* 이메일 설정 정보 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">📧</span>
          이메일 발송 설정
        </h2>
        <div className="space-y-4">
          <InfoRow
            label="이메일 주소"
            value={isEditing ? (editableInfo.email || '') : (adminInfo?.email || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.email || '', 'email')}
            copied={copiedField === 'email'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, email: value })}
          />
          <InfoRow
            label="발신자 이름"
            value={isEditing ? (editableInfo.emailFromName || '') : (adminInfo?.emailFromName || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.emailFromName || '', 'fromName')}
            copied={copiedField === 'fromName'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, emailFromName: value })}
          />
          <InfoRow
            label="SMTP 호스트"
            value={isEditing ? (editableInfo.emailSmtpHost || '') : (adminInfo?.emailSmtpHost || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.emailSmtpHost || '', 'smtpHost')}
            copied={copiedField === 'smtpHost'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, emailSmtpHost: value })}
          />
          <InfoRow
            label="SMTP 포트"
            value={isEditing ? (editableInfo.emailSmtpPort || '') : (adminInfo?.emailSmtpPort || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.emailSmtpPort || '', 'smtpPort')}
            copied={copiedField === 'smtpPort'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, emailSmtpPort: value })}
          />
          <EditablePasswordRow
            label="앱 비밀번호"
            value={isEditing ? (editableInfo.emailSmtpPassword || '') : (adminInfo?.emailSmtpPassword || '')}
            onCopy={() => copyToClipboard(adminInfo?.emailSmtpPassword || '', 'password')}
            copied={copiedField === 'password'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, emailSmtpPassword: value })}
            show={showPassword}
            onToggleShow={() => setShowPassword(!showPassword)}
          />
          <InfoRow
            label="발송 방식"
            value={adminInfo?.sendMethod || 'Gmail SMTP'}
            onCopy={() => copyToClipboard(adminInfo?.sendMethod || '', 'sendMethod')}
            copied={copiedField === 'sendMethod'}
          />
          <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ 발송 제한:</strong> Gmail SMTP는 일일 500통까지 발송 가능합니다. 
              더 많은 발송이 필요하면 SendGrid나 AWS SES를 고려하세요.
            </p>
          </div>
        </div>
      </div>

      {/* Gemini API 설정 정보 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">🤖</span>
          Gemini API 설정
        </h2>
        <div className="space-y-4">
          <EditablePasswordRow
            label="API 키"
            value={isEditing ? (editableInfo.geminiApiKey || '') : (adminInfo?.geminiApiKey || '')}
            onCopy={() => copyToClipboard(adminInfo?.geminiApiKey || '', 'apiKey')}
            copied={copiedField === 'apiKey'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, geminiApiKey: value })}
            show={showApiKey}
            onToggleShow={() => setShowApiKey(!showApiKey)}
          />
        </div>
      </div>

      {/* 카카오톡 설정 정보 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">💬</span>
          카카오톡 설정
        </h2>
        <div className="space-y-4">
          <InfoRow
            label="앱 이름"
            value={isEditing ? (editableInfo.kakaoAppName || '') : (adminInfo?.kakaoAppName || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.kakaoAppName || '', 'kakaoAppName')}
            copied={copiedField === 'kakaoAppName'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, kakaoAppName: value })}
          />
          <InfoRow
            label="앱 ID"
            value={isEditing ? (editableInfo.kakaoAppId || '') : (adminInfo?.kakaoAppId || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.kakaoAppId || '', 'kakaoAppId')}
            copied={copiedField === 'kakaoAppId'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, kakaoAppId: value })}
          />
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-600 mb-1 block">JavaScript 키</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-gray-800">
                  {maskSensitiveInfo(adminInfo?.kakaoJsKey || '', showKakaoKey)}
                </span>
                <button
                  onClick={() => setShowKakaoKey(!showKakaoKey)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showKakaoKey ? '숨기기' : '보기'}
                >
                  {showKakaoKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(adminInfo?.kakaoJsKey || '', 'kakaoKey')}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {copiedField === 'kakaoKey' ? <FiCheck size={18} /> : <FiCopy size={18} />}
              {copiedField === 'kakaoKey' ? '복사됨' : '복사'}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-600 mb-1 block">REST API 키</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-gray-800">
                  {maskSensitiveInfo(adminInfo?.kakaoRestApiKey || '', showKakaoRestApiKey)}
                </span>
                <button
                  onClick={() => setShowKakaoRestApiKey(!showKakaoRestApiKey)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showKakaoRestApiKey ? '숨기기' : '보기'}
                >
                  {showKakaoRestApiKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(adminInfo?.kakaoRestApiKey || '', 'kakaoRestApiKey')}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {copiedField === 'kakaoRestApiKey' ? <FiCheck size={18} /> : <FiCopy size={18} />}
              {copiedField === 'kakaoRestApiKey' ? '복사됨' : '복사'}
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-600 mb-1 block">Admin 키 (서버 전용)</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-gray-800">
                  {maskSensitiveInfo(adminInfo?.kakaoAdminKey || '', showKakaoAdminKey)}
                </span>
                <button
                  onClick={() => setShowKakaoAdminKey(!showKakaoAdminKey)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showKakaoAdminKey ? '숨기기' : '보기'}
                >
                  {showKakaoAdminKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(adminInfo?.kakaoAdminKey || '', 'kakaoAdminKey')}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {copiedField === 'kakaoAdminKey' ? <FiCheck size={18} /> : <FiCopy size={18} />}
              {copiedField === 'kakaoAdminKey' ? '복사됨' : '복사'}
            </button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="text-lg font-bold text-blue-900 mb-3">📱 카카오 채널 정보</h3>
            <div className="space-y-3">
              <InfoRow
                label="채널 이름"
                value={adminInfo?.kakaoChannelName || 'N/A'}
                onCopy={() => copyToClipboard(adminInfo?.kakaoChannelName || '', 'kakaoChannelName')}
                copied={copiedField === 'kakaoChannelName'}
              />
              <InfoRow
                label="검색용 아이디"
                value={adminInfo?.kakaoChannelSearchId || 'N/A'}
                onCopy={() => copyToClipboard(adminInfo?.kakaoChannelSearchId || '', 'kakaoChannelSearchId')}
                copied={copiedField === 'kakaoChannelSearchId'}
              />
              <InfoRow
                label="채널 공개 ID"
                value={adminInfo?.kakaoChannelId || 'N/A'}
                onCopy={() => copyToClipboard(adminInfo?.kakaoChannelId || '', 'kakaoChannelId')}
                copied={copiedField === 'kakaoChannelId'}
              />
              {adminInfo?.kakaoChannelUrl && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">채널 URL</label>
                    <a
                      href={adminInfo.kakaoChannelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {adminInfo.kakaoChannelUrl}
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(adminInfo.kakaoChannelUrl, 'kakaoChannelUrl')}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copiedField === 'kakaoChannelUrl' ? <FiCheck size={18} /> : <FiCopy size={18} />}
                    {copiedField === 'kakaoChannelUrl' ? '복사됨' : '복사'}
                  </button>
                </div>
              )}
              {adminInfo?.kakaoChannelChatUrl && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">채팅 URL</label>
                    <a
                      href={adminInfo.kakaoChannelChatUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all"
                    >
                      {adminInfo.kakaoChannelChatUrl}
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(adminInfo.kakaoChannelChatUrl, 'kakaoChannelChatUrl')}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copiedField === 'kakaoChannelChatUrl' ? <FiCheck size={18} /> : <FiCopy size={18} />}
                    {copiedField === 'kakaoChannelChatUrl' ? '복사됨' : '복사'}
                  </button>
                </div>
              )}
          <EditablePasswordRow
            label="JavaScript 키"
            value={isEditing ? (editableInfo.kakaoJsKey || '') : (adminInfo?.kakaoJsKey || '')}
            onCopy={() => copyToClipboard(adminInfo?.kakaoJsKey || '', 'kakaoKey')}
            copied={copiedField === 'kakaoKey'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, kakaoJsKey: value })}
            show={showKakaoKey}
            onToggleShow={() => setShowKakaoKey(!showKakaoKey)}
          />
          <EditablePasswordRow
            label="REST API 키"
            value={isEditing ? (editableInfo.kakaoRestApiKey || '') : (adminInfo?.kakaoRestApiKey || '')}
            onCopy={() => copyToClipboard(adminInfo?.kakaoRestApiKey || '', 'kakaoRestApiKey')}
            copied={copiedField === 'kakaoRestApiKey'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, kakaoRestApiKey: value })}
            show={showKakaoRestApiKey}
            onToggleShow={() => setShowKakaoRestApiKey(!showKakaoRestApiKey)}
          />
          <EditablePasswordRow
            label="Admin 키 (서버 전용)"
            value={isEditing ? (editableInfo.kakaoAdminKey || '') : (adminInfo?.kakaoAdminKey || '')}
            onCopy={() => copyToClipboard(adminInfo?.kakaoAdminKey || '', 'kakaoAdminKey')}
            copied={copiedField === 'kakaoAdminKey'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, kakaoAdminKey: value })}
            show={showKakaoAdminKey}
            onToggleShow={() => setShowKakaoAdminKey(!showKakaoAdminKey)}
          />
          <InfoRow
            label="채널 공개 ID"
            value={isEditing ? (editableInfo.kakaoChannelId || '') : (adminInfo?.kakaoChannelId || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.kakaoChannelId || '', 'kakaoChannelId')}
            copied={copiedField === 'kakaoChannelId'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, kakaoChannelId: value })}
          />
          <InfoRow
            label="봇 ID"
            value={isEditing ? (editableInfo.kakaoChannelBotId || '') : (adminInfo?.kakaoChannelBotId || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.kakaoChannelBotId || '', 'kakaoChannelBotId')}
            copied={copiedField === 'kakaoChannelBotId'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, kakaoChannelBotId: value })}
          />
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 안내:</strong> 카카오톡 공유 기능은 이 JavaScript 키를 사용합니다. 
              키가 설정되어 있으면 로그인 페이지에서 카카오톡 공유 버튼이 활성화됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 알리고 SMS 설정 정보 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">📱</span>
          알리고 SMS 설정
        </h2>
        <div className="space-y-4">
          <InfoRow
            label="사용자 ID"
            value={isEditing ? (editableInfo.aligoUserId || '') : (adminInfo?.aligoUserId || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.aligoUserId || '', 'aligoUserId')}
            copied={copiedField === 'aligoUserId'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, aligoUserId: value })}
          />
          <EditablePasswordRow
            label="API 키"
            value={isEditing ? (editableInfo.aligoApiKey || '') : (adminInfo?.aligoApiKey || '')}
            onCopy={() => copyToClipboard(adminInfo?.aligoApiKey || '', 'aligoApiKey')}
            copied={copiedField === 'aligoApiKey'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, aligoApiKey: value })}
            show={showAligoApiKey}
            onToggleShow={() => setShowAligoApiKey(!showAligoApiKey)}
          />
          <InfoRow
            label="발신번호"
            value={isEditing ? (editableInfo.aligoSenderPhone || '') : (adminInfo?.aligoSenderPhone || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.aligoSenderPhone || '', 'aligoSenderPhone')}
            copied={copiedField === 'aligoSenderPhone'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, aligoSenderPhone: value })}
          />
          <InfoRow
            label="카카오 채널 ID"
            value={isEditing ? (editableInfo.aligoKakaoChannelId || '') : (adminInfo?.aligoKakaoChannelId || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.aligoKakaoChannelId || '', 'aligoKakaoChannelId')}
            copied={copiedField === 'aligoKakaoChannelId'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, aligoKakaoChannelId: value })}
          />
          <EditablePasswordRow
            label="카카오 채널 Senderkey"
            value={isEditing ? (editableInfo.aligoKakaoSenderKey || '') : (adminInfo?.aligoKakaoSenderKey || '')}
            onCopy={() => copyToClipboard(adminInfo?.aligoKakaoSenderKey || '', 'aligoKakaoSenderKey')}
            copied={copiedField === 'aligoKakaoSenderKey'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, aligoKakaoSenderKey: value })}
            show={showAligoKakaoSenderKey}
            onToggleShow={() => setShowAligoKakaoSenderKey(!showAligoKakaoSenderKey)}
          />
          <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 안내:</strong> 알리고 SMS 발송 서비스를 사용합니다. 
              일일 500건 제한이 있으며, 500건 이상 발송을 원하시면 사업자 계정으로 전환하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 카카오톡 API 담당자 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">👤</span>
          카카오톡 API 담당자
        </h2>
        <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 안내:</strong> 알림받기 체크하여 카카오톡 API 담당자 추가하시면, 카카오톡 API 발송 시 잔여포인트 10,000 P 미만일 경우 안내해 드리고 있습니다.
            <br />
            (잔여포인트 소진 알림 금액 변경을 원하신다면 고객센터로 문의 바랍니다.)
          </p>
        </div>
        
        {/* 담당자 목록 */}
        <div className="mb-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">등록일</th>
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">담당자</th>
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">휴대폰</th>
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">관리</th>
                </tr>
              </thead>
              <tbody>
                {adminInfo?.kakaoApiManagers && adminInfo.kakaoApiManagers.length > 0 ? (
                  adminInfo.kakaoApiManagers.map((manager) => (
                    <tr key={manager.id} className="hover:bg-gray-50">
                      <td className="border-2 border-gray-300 px-4 py-2">{manager.registeredAt}</td>
                      <td className="border-2 border-gray-300 px-4 py-2">{manager.name}</td>
                      <td className="border-2 border-gray-300 px-4 py-2">
                        {manager.phone}
                        {manager.notifyEnabled && <span className="ml-2 text-xs text-blue-600">[문자알림]</span>}
                      </td>
                      <td className="border-2 border-gray-300 px-4 py-2">
                        <button
                          onClick={() => handleDeleteManager(manager.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border-2 border-gray-300 px-4 py-4 text-center text-gray-500">
                      등록된 담당자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 담당자 추가 폼 */}
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="text-lg font-semibold mb-3">담당자 추가하기</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">성명</label>
              <input
                type="text"
                value={newManagerName}
                onChange={(e) => setNewManagerName(e.target.value)}
                placeholder="담당자 이름을 입력하세요"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">전화번호</label>
              <input
                type="tel"
                value={newManagerPhone}
                onChange={(e) => setNewManagerPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="notifyEnabled"
                checked={newManagerNotify}
                onChange={(e) => setNewManagerNotify(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="notifyEnabled" className="text-sm font-semibold text-gray-700">
                알림받기
              </label>
            </div>
            <button
              onClick={handleAddManager}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <FiPlus size={18} />
              담당자 추가하기
            </button>
          </div>
        </div>
      </div>

      {/* 기존 API Key */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">🔑</span>
          기존 API Key
        </h2>
        
        {/* API Key 목록 */}
        <div className="mb-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">등록일</th>
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">Identifier</th>
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">발급키</th>
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">관리</th>
                </tr>
              </thead>
              <tbody>
                {adminInfo?.kakaoApiKeys && adminInfo.kakaoApiKeys.length > 0 ? (
                  adminInfo.kakaoApiKeys.map((apiKey) => (
                    <tr key={apiKey.id} className="hover:bg-gray-50">
                      <td className="border-2 border-gray-300 px-4 py-2">{apiKey.registeredAt}</td>
                      <td className="border-2 border-gray-300 px-4 py-2">{apiKey.identifier}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 font-mono text-sm">{apiKey.key}</td>
                      <td className="border-2 border-gray-300 px-4 py-2">
                        <button
                          onClick={() => handleDeleteApiKey(apiKey.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="border-2 border-gray-300 px-4 py-4 text-center text-gray-500">
                      등록된 API Key가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* API Key 발급신청 */}
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="text-lg font-semibold mb-3">API Key 발급신청</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Identifier</label>
              <input
                type="text"
                value={newApiKeyIdentifier}
                onChange={(e) => setNewApiKeyIdentifier(e.target.value)}
                placeholder="Identifier를 입력하세요"
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleRequestApiKey}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <FiPlus size={18} />
              API Key 발급신청
            </button>
          </div>
        </div>
      </div>

      {/* Senderkey */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">📨</span>
          Senderkey
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border-2 border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border-2 border-gray-300 px-4 py-2 text-left">등록일</th>
                <th className="border-2 border-gray-300 px-4 py-2 text-left">카카오채널ID</th>
                <th className="border-2 border-gray-300 px-4 py-2 text-left">Senderkey</th>
              </tr>
            </thead>
            <tbody>
              {adminInfo?.kakaoSenderKeys && adminInfo.kakaoSenderKeys.length > 0 ? (
                adminInfo.kakaoSenderKeys.map((senderKey) => (
                  <tr key={senderKey.id} className="hover:bg-gray-50">
                    <td className="border-2 border-gray-300 px-4 py-2">{senderKey.registeredAt}</td>
                    <td className="border-2 border-gray-300 px-4 py-2">{senderKey.channelId}</td>
                    <td className="border-2 border-gray-300 px-4 py-2 font-mono text-sm">{senderKey.senderKey}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="border-2 border-gray-300 px-4 py-4 text-center text-gray-500">
                    등록된 Senderkey가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 발송 서버 IP */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">🌐</span>
          발송 서버 IP
        </h2>
        
        {adminInfo?.currentIp && (
          <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>현재 접속한 IP:</strong> {adminInfo.currentIp} (실제 발송할 서버 IP를 확인 하신 후 입력하시기 바랍니다)
            </p>
          </div>
        )}

        {/* IP 목록 */}
        <div className="mb-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">등록일</th>
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">IP</th>
                  <th className="border-2 border-gray-300 px-4 py-2 text-left">관리</th>
                </tr>
              </thead>
              <tbody>
                {adminInfo?.serverIps && adminInfo.serverIps.length > 0 ? (
                  adminInfo.serverIps.map((ip) => (
                    <tr key={ip.id} className="hover:bg-gray-50">
                      <td className="border-2 border-gray-300 px-4 py-2">{ip.registeredAt}</td>
                      <td className="border-2 border-gray-300 px-4 py-2 font-mono">{ip.ip}</td>
                      <td className="border-2 border-gray-300 px-4 py-2">
                        <button
                          onClick={() => handleDeleteServerIp(ip.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="border-2 border-gray-300 px-4 py-4 text-center text-gray-500">
                      등록된 IP가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* IP 추가 폼 */}
        <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
          <h3 className="text-lg font-semibold mb-3">IP 추가하기</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">IP번호</label>
              <input
                type="text"
                value={newServerIp}
                onChange={(e) => setNewServerIp(e.target.value)}
                placeholder="125.132.80.142 또는 192.168.0."
                className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                * IP 대역을 추가하시려면 공란으로 비워두면 됩니다. 예: 192.168.0.
              </p>
            </div>
            <button
              onClick={handleAddServerIp}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-semibold"
            >
              <FiPlus size={18} />
              IP 추가하기
            </button>
          </div>
        </div>
      </div>

      {/* 발신번호 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">📞</span>
          발신번호
        </h2>
        <div className="space-y-4">
          <InfoRow
            label="발신번호"
            value={isEditing ? senderPhoneNumber : (adminInfo?.aligoSenderPhone || senderPhoneNumber)}
            onCopy={() => copyToClipboard(adminInfo?.aligoSenderPhone || senderPhoneNumber, 'senderPhone')}
            copied={copiedField === 'senderPhone'}
            isEditing={isEditing}
            onValueChange={(value) => {
              setSenderPhoneNumber(value);
              setEditableInfo({ ...editableInfo, aligoSenderPhone: value });
            }}
          />
          <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 안내:</strong> 문자, 카카오톡 보내는 정보로 등록되어 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* PG 결제 설정 정보 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">💳</span>
          웰컴페이먼츠 PG 결제 설정
        </h2>
        <div className="space-y-4">
          <InfoRow
            label="가맹점 상호"
            value={isEditing ? (editableInfo.pgMerchantName || '') : (adminInfo?.pgMerchantName || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.pgMerchantName || '', 'pgMerchantName')}
            copied={copiedField === 'pgMerchantName'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, pgMerchantName: value })}
          />
          <InfoRow
            label="MID (인증)"
            value={isEditing ? (editableInfo.pgMidAuth || '') : (adminInfo?.pgMidAuth || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.pgMidAuth || '', 'pgMidAuth')}
            copied={copiedField === 'pgMidAuth'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, pgMidAuth: value })}
          />
          <InfoRow
            label="MID (비인증)"
            value={isEditing ? (editableInfo.pgMidNonAuth || '') : (adminInfo?.pgMidNonAuth || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.pgMidNonAuth || '', 'pgMidNonAuth')}
            copied={copiedField === 'pgMidNonAuth'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, pgMidNonAuth: value })}
          />
          <EditablePasswordRow
            label="MID 비밀번호"
            value={isEditing ? (editableInfo.pgMidPassword || '') : (adminInfo?.pgMidPassword || '')}
            onCopy={() => copyToClipboard(adminInfo?.pgMidPassword || '', 'pgMidPassword')}
            copied={copiedField === 'pgMidPassword'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, pgMidPassword: value })}
            show={showPgMidPassword}
            onToggleShow={() => setShowPgMidPassword(!showPgMidPassword)}
          />
          {adminInfo?.pgAdminUrl && (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
              <div className="flex-1">
                <label className="text-sm font-semibold text-gray-600 mb-1 block">관리자 페이지 URL</label>
                <a
                  href={adminInfo.pgAdminUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {adminInfo.pgAdminUrl}
                </a>
              </div>
              <button
                onClick={() => copyToClipboard(adminInfo.pgAdminUrl, 'pgAdminUrl')}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                {copiedField === 'pgAdminUrl' ? <FiCheck size={18} /> : <FiCopy size={18} />}
                {copiedField === 'pgAdminUrl' ? '복사됨' : '복사'}
              </button>
            </div>
          )}
          <EditablePasswordRow
            label="웹결제 Signkey (인증)"
            value={isEditing ? (editableInfo.pgSignkey || '') : (adminInfo?.pgSignkey || '')}
            onCopy={() => copyToClipboard(adminInfo?.pgSignkey || '', 'pgSignkey')}
            copied={copiedField === 'pgSignkey'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, pgSignkey: value })}
            show={showPgSignkey}
            onToggleShow={() => setShowPgSignkey(!showPgSignkey)}
          />
          <InfoRow
            label="필드암호화 IV (인증)"
            value={isEditing ? (editableInfo.pgFieldEncryptIv || '') : (adminInfo?.pgFieldEncryptIv || 'N/A')}
            onCopy={() => copyToClipboard(adminInfo?.pgFieldEncryptIv || '', 'pgFieldEncryptIv')}
            copied={copiedField === 'pgFieldEncryptIv'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, pgFieldEncryptIv: value })}
          />
          <EditablePasswordRow
            label="필드암호화 KEY (API KEY) (인증)"
            value={isEditing ? (editableInfo.pgFieldEncryptKey || '') : (adminInfo?.pgFieldEncryptKey || '')}
            onCopy={() => copyToClipboard(adminInfo?.pgFieldEncryptKey || '', 'pgFieldEncryptKey')}
            copied={copiedField === 'pgFieldEncryptKey'}
            isEditing={isEditing}
            onValueChange={(value) => setEditableInfo({ ...editableInfo, pgFieldEncryptKey: value })}
            show={showPgFieldEncryptKey}
            onToggleShow={() => setShowPgFieldEncryptKey(!showPgFieldEncryptKey)}
          />
          <div className="mt-4 p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-3">🔐 비인증 MID (wpcrdot300) 설정</h3>
            <div className="space-y-4">
              <EditablePasswordRow
                label="웹결제 Signkey (비인증)"
                value={isEditing ? (editableInfo.pgSignkeyNonAuth || '') : (adminInfo?.pgSignkeyNonAuth || '')}
                onCopy={() => copyToClipboard(adminInfo?.pgSignkeyNonAuth || '', 'pgSignkeyNonAuth')}
                copied={copiedField === 'pgSignkeyNonAuth'}
                isEditing={isEditing}
                onValueChange={(value) => setEditableInfo({ ...editableInfo, pgSignkeyNonAuth: value })}
                show={showPgSignkeyNonAuth}
                onToggleShow={() => setShowPgSignkeyNonAuth(!showPgSignkeyNonAuth)}
              />
              <InfoRow
                label="필드암호화 IV (비인증)"
                value={isEditing ? (editableInfo.pgFieldEncryptIvNonAuth || '') : (adminInfo?.pgFieldEncryptIvNonAuth || 'N/A')}
                onCopy={() => copyToClipboard(adminInfo?.pgFieldEncryptIvNonAuth || '', 'pgFieldEncryptIvNonAuth')}
                copied={copiedField === 'pgFieldEncryptIvNonAuth'}
                isEditing={isEditing}
                onValueChange={(value) => setEditableInfo({ ...editableInfo, pgFieldEncryptIvNonAuth: value })}
              />
              <EditablePasswordRow
                label="필드암호화 KEY (API KEY) (비인증)"
                value={isEditing ? (editableInfo.pgFieldEncryptKeyNonAuth || '') : (adminInfo?.pgFieldEncryptKeyNonAuth || '')}
                onCopy={() => copyToClipboard(adminInfo?.pgFieldEncryptKeyNonAuth || '', 'pgFieldEncryptKeyNonAuth')}
                copied={copiedField === 'pgFieldEncryptKeyNonAuth'}
                isEditing={isEditing}
                onValueChange={(value) => setEditableInfo({ ...editableInfo, pgFieldEncryptKeyNonAuth: value })}
                show={showPgFieldEncryptKeyNonAuth}
                onToggleShow={() => setShowPgFieldEncryptKeyNonAuth(!showPgFieldEncryptKeyNonAuth)}
              />
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="text-lg font-bold text-blue-900 mb-3">🌐 배포 도메인 및 콜백 URL</h3>
            <div className="space-y-3">
              <InfoRow
                label="배포 도메인"
                value={isEditing ? (editableInfo.baseUrl || '') : (adminInfo?.baseUrl || 'N/A')}
                onCopy={() => copyToClipboard(adminInfo?.baseUrl || '', 'baseUrl')}
                copied={copiedField === 'baseUrl'}
                isEditing={isEditing}
                onValueChange={(value) => setEditableInfo({ ...editableInfo, baseUrl: value })}
              />
              {adminInfo?.pgCallbackUrl && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">결제 완료 리다이렉트 URL</label>
                    <a
                      href={adminInfo.pgCallbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                    >
                      {adminInfo.pgCallbackUrl}
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(adminInfo.pgCallbackUrl, 'pgCallbackUrl')}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copiedField === 'pgCallbackUrl' ? <FiCheck size={18} /> : <FiCopy size={18} />}
                    {copiedField === 'pgCallbackUrl' ? '복사됨' : '복사'}
                  </button>
                </div>
              )}
              {adminInfo?.pgNotifyUrl && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">결제수단 거래알림 URL</label>
                    <a
                      href={adminInfo.pgNotifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                    >
                      {adminInfo.pgNotifyUrl}
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(adminInfo.pgNotifyUrl, 'pgNotifyUrl')}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copiedField === 'pgNotifyUrl' ? <FiCheck size={18} /> : <FiCopy size={18} />}
                    {copiedField === 'pgNotifyUrl' ? '복사됨' : '복사'}
                  </button>
                </div>
              )}
              {adminInfo?.pgVirtualAccountUrl && (
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-600 mb-1 block">가상계좌 입금 통보 URL</label>
                    <a
                      href={adminInfo.pgVirtualAccountUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all text-sm"
                    >
                      {adminInfo.pgVirtualAccountUrl}
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(adminInfo.pgVirtualAccountUrl, 'pgVirtualAccountUrl')}
                    className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    {copiedField === 'pgVirtualAccountUrl' ? <FiCheck size={18} /> : <FiCopy size={18} />}
                    {copiedField === 'pgVirtualAccountUrl' ? '복사됨' : '복사'}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>💡 안내:</strong> 웰컴페이먼츠 PG 결제 연동을 위한 설정입니다. 
              인증 결제는 MID (인증)을, 비인증 결제는 MID (비인증)을 사용합니다.
              <br />
              <strong>⚠️ 중요:</strong> 위 콜백 URL들을 웰컴페이먼츠 관리자 페이지에 설정해야 합니다.
            </p>
          </div>
        </div>
      </div>

      {/* YouTube API 설정 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-3xl">📺</span>
          YouTube API 설정
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
            <div className="flex-1">
              <label className="text-sm font-semibold text-gray-600 mb-1 block">YouTube Data API v3 키</label>
              <div className="flex items-center gap-2">
                <span className="text-lg font-mono text-gray-800">
                  {maskSensitiveInfo(adminInfo?.youtubeApiKey || '', showYoutubeApiKey)}
                </span>
                <button
                  onClick={() => setShowYoutubeApiKey(!showYoutubeApiKey)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showYoutubeApiKey ? '숨기기' : '보기'}
                >
                  {showYoutubeApiKey ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {isEditing && (
                <input
                  type={showYoutubeApiKey ? 'text' : 'password'}
                  value={editableInfo.youtubeApiKey || ''}
                  onChange={(e) => setEditableInfo({ ...editableInfo, youtubeApiKey: e.target.value })}
                  className="mt-2 w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="YouTube API 키를 입력하세요"
                />
              )}
            </div>
            <button
              onClick={() => copyToClipboard(adminInfo?.youtubeApiKey || '', 'youtubeApiKey')}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {copiedField === 'youtubeApiKey' ? <FiCheck size={18} /> : <FiCopy size={18} />}
              {copiedField === 'youtubeApiKey' ? '복사됨' : '복사'}
            </button>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">
              <strong>💡 안내:</strong> YouTube Data API v3 키는 Google Cloud Console에서 발급받을 수 있습니다.
            </p>
            <p className="text-sm text-blue-800 mb-2">
              <strong>📝 발급 방법:</strong>
            </p>
            <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1 ml-2">
              <li>Google Cloud Console (https://console.cloud.google.com/) 접속</li>
              <li>프로젝트 선택 또는 새 프로젝트 생성</li>
              <li>API 및 서비스 → 라이브러리 → "YouTube Data API v3" 검색 및 활성화</li>
              <li>사용자 인증 정보 → API 키 만들기</li>
              <li>생성된 API 키를 위에 입력하세요</li>
            </ol>
            <p className="text-sm text-blue-800 mt-2">
              <strong>⚠️ 중요:</strong> API 키가 없으면 YouTube 영상 수집 스크립트를 실행할 수 없습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-blue-800 mb-2">💡 안내</h3>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>이 정보들은 서버의 환경 변수에서 가져옵니다.</li>
          <li>비밀번호와 API 키는 보안을 위해 마스킹되어 표시됩니다.</li>
          <li>설정을 변경하려면 서버의 .env.local 파일을 수정한 후 서버를 재시작해야 합니다.</li>
        </ul>
      </div>
    </div>
  );
}

function InfoRow({ label, value, onCopy, copied, isEditing, onValueChange }: { 
  label: string; 
  value: string; 
  onCopy: () => void; 
  copied: boolean;
  isEditing?: boolean;
  onValueChange?: (value: string) => void;
}) {
  if (isEditing && onValueChange) {
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
        <div className="flex-1">
          <label className="text-sm font-semibold text-gray-600 mb-1 block">{label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            placeholder={`${label}을(를) 입력하세요`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
      <div className="flex-1">
        <label className="text-sm font-semibold text-gray-600 mb-1 block">{label}</label>
        <span className="text-lg font-medium text-gray-800">{value}</span>
      </div>
      <button
        onClick={onCopy}
        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
        {copied ? '복사됨' : '복사'}
      </button>
    </div>
  );
}

function EditablePasswordRow({ 
  label, 
  value, 
  onCopy, 
  copied, 
  isEditing, 
  onValueChange,
  show,
  onToggleShow
}: { 
  label: string; 
  value: string; 
  onCopy: () => void; 
  copied: boolean;
  isEditing?: boolean;
  onValueChange?: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  const maskSensitiveInfo = (text: string, show: boolean) => {
    if (!text) return '';
    if (show) return text;
    if (text.length <= 8) return '•'.repeat(text.length);
    return text.substring(0, 4) + '•'.repeat(text.length - 8) + text.substring(text.length - 4);
  };

  if (isEditing && onValueChange) {
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
        <div className="flex-1">
          <label className="text-sm font-semibold text-gray-600 mb-1 block">{label}</label>
          <div className="flex items-center gap-2">
            <input
              type={show ? 'text' : 'password'}
              value={value || ''}
              onChange={(e) => onValueChange(e.target.value)}
              className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder={`${label}을(를) 입력하세요`}
            />
            <button
              onClick={onToggleShow}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={show ? '숨기기' : '보기'}
            >
              {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-gray-200">
      <div className="flex-1">
        <label className="text-sm font-semibold text-gray-600 mb-1 block">{label}</label>
        <div className="flex items-center gap-2">
          <span className="text-lg font-mono text-gray-800">
            {maskSensitiveInfo(value || '', show)}
          </span>
          <button
            onClick={onToggleShow}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={show ? '숨기기' : '보기'}
          >
            {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
          </button>
        </div>
      </div>
      <button
        onClick={onCopy}
        className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
        {copied ? '복사됨' : '복사'}
      </button>
    </div>
  );
}

