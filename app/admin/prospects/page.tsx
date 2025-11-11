'use client';

import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiTrash2, FiUpload, FiDownload, FiSearch, FiX, FiEdit } from 'react-icons/fi';
import * as XLSX from 'xlsx';

type Prospect = {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  source: string | null;
  notes: string | null;
  tags: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: '',
    notes: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/prospects', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setProspects(data.prospects || []);
      }
    } catch (error) {
      console.error('Failed to load prospects:', error);
      alert('잠재고객 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = e.target?.result;
        if (!data) return;

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        // 엑셀 데이터를 API 형식으로 변환 (A열: 이름, B열: 연락처, C열: 이메일)
        const prospectsData = jsonData.map((row: any) => {
          // A열: 이름
          const name = row['이름'] || row['name'] || row['Name'] || '';
          // B열: 연락처 (전화번호) - 하이픈 제거
          const phoneRaw = row['연락처'] || row['전화번호'] || row['phone'] || row['Phone'] || '';
          const phone = phoneRaw ? phoneRaw.toString().replace(/[-\s]/g, '') : '';
          // C열: 이메일
          const email = row['이메일'] || row['email'] || row['Email'] || '';
          
          return {
            name,
            email: email || '',
            phone: phone || '',
            source: '엑셀 업로드',
            notes: row['메모'] || row['notes'] || row['Notes'] || '',
            tags: row['태그'] || row['tags'] || row['Tags'] ? String(row['태그'] || row['tags'] || row['Tags']).split(',').map((t: string) => t.trim()) : [],
          };
        }).filter((p: any) => p.name && (p.email || p.phone)); // 이름과 연락처(이메일 또는 전화번호)가 있는 것만

        // API로 전송
        const response = await fetch('/api/admin/prospects/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ prospects: prospectsData }),
        });

        const result = await response.json();
        if (result.ok) {
          alert(`${result.created}명의 잠재고객이 추가되었습니다. (중복: ${result.duplicates}명)`);
          setShowUploadModal(false);
          loadProspects();
        } else {
          alert('업로드 실패: ' + (result.error || 'Unknown error'));
        }
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      console.error('Failed to process file:', error);
      alert('파일 처리 중 오류가 발생했습니다.');
    }
  };

  const handleAddProspect = async () => {
    // 모든 필드가 선택사항이므로 검증 제거
    try {
      const url = editingProspect 
        ? `/api/admin/prospects/${editingProspect.id}`
        : '/api/admin/prospects';
      const method = editingProspect ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.ok) {
        alert(editingProspect ? '잠재고객이 수정되었습니다.' : '잠재고객이 추가되었습니다.');
        setShowAddModal(false);
        setEditingProspect(null);
        setFormData({ name: '', email: '', phone: '', source: '', notes: '', tags: [] });
        loadProspects();
      } else {
        alert('실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save prospect:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말 이 잠재고객을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/prospects/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await response.json();
      if (data.ok) {
        alert('잠재고객이 삭제되었습니다.');
        loadProspects();
      } else {
        alert('삭제 실패: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to delete prospect:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (prospect: Prospect) => {
    setEditingProspect(prospect);
    setFormData({
      name: prospect.name || '',
      email: prospect.email,
      phone: prospect.phone || '',
      source: prospect.source || '',
      notes: prospect.notes || '',
      tags: (prospect.tags as string[]) || [],
    });
    setShowAddModal(true);
  };

  const handleDownloadSample = () => {
    // A열: 이름, B열: 연락처, C열: 이메일 형식으로 샘플 데이터 생성
    const sampleData = [
      {
        이름: '홍길동',
        연락처: '01012345678',
        이메일: 'hong@example.com',
      },
      {
        이름: '김철수',
        연락처: '01098765432',
        이메일: 'kim@example.com',
      },
      {
        이름: '이영희',
        연락처: '01024958013',
        이메일: 'lee@example.com',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '잠재고객');
    XLSX.writeFile(wb, '잠재고객_샘플.xlsx');
  };


  const filteredProspects = prospects.filter((p) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.email && p.email.toLowerCase().includes(query)) ||
        (p.phone && p.phone.includes(query))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-5xl">📋</span>
            잠재고객 관리
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            엑셀 파일로 잠재고객을 업로드하고 관리하세요
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleDownloadSample}
            className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <FiDownload size={20} />
            샘플 다운로드
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <FiUpload size={20} />
            엑셀 업로드
          </button>
          <button
            onClick={() => {
              setEditingProspect(null);
              setFormData({ name: '', email: '', phone: '', source: '', notes: '', tags: [] });
              setShowAddModal(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
          >
            <FiPlus size={20} />
            수동 추가
          </button>
        </div>
      </div>

      {/* 검색 */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="이름, 이메일, 전화번호로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-medium"
          />
        </div>
      </div>

      {/* 잠재고객 목록 */}
      {isLoading ? (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-700">로딩 중...</p>
        </div>
      ) : filteredProspects.length === 0 ? (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-16 text-center">
          <span className="text-6xl mb-4 block">📭</span>
          <p className="text-xl font-bold text-gray-700">등록된 잠재고객이 없습니다.</p>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">이름</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">연락처</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">출처</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">태그</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">상태</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">등록일</th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProspects.map((prospect) => (
                  <tr key={prospect.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {prospect.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {prospect.email && <span className="block">✉️ {prospect.email}</span>}
                      {prospect.phone && <span className="block">📞 {prospect.phone}</span>}
                      {!prospect.email && !prospect.phone && <span>-</span>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{prospect.source || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {Array.isArray(prospect.tags) && prospect.tags.length > 0
                        ? prospect.tags.join(', ')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          prospect.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {prospect.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(prospect.createdAt).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(prospect)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(prospect.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 엑셀 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-md w-full p-8 border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <span className="text-3xl">📤</span>
                엑셀 업로드
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:scale-110 transition-transform"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-semibold mb-2">📋 엑셀 파일 형식:</p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>A열: 이름 (필수)</li>
                  <li>B열: 연락처 (전화번호, 선택)</li>
                  <li>C열: 이메일 (선택)</li>
                  <li>이름과 연락처(전화번호 또는 이메일) 중 하나는 필수입니다.</li>
                </ul>
                <button
                  onClick={handleDownloadSample}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline font-semibold"
                >
                  샘플 파일 다운로드
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-all"
              >
                <FiUpload size={20} />
                파일 선택
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 추가/수정 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto border-2 border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                <span className="text-3xl">{editingProspect ? '✏️' : '➕'}</span>
                {editingProspect ? '잠재고객 수정' : '잠재고객 추가'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProspect(null);
                  setFormData({ name: '', email: '', phone: '', source: '', notes: '', tags: [] });
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold hover:scale-110 transition-transform"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="이름을 입력하세요"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  연락처 (전화번호)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => {
                    // 전화번호인 경우 하이픈과 공백 제거 (숫자만 허용)
                    const phoneOnly = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, phone: phoneOnly });
                  }}
                  placeholder="전화번호를 입력하세요 (예: 01024958013)"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">숫자만 입력하세요 (하이픈 제외)</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  이메일
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="이메일을 입력하세요"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  출처
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="예: 엑셀 업로드, 수동 입력"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  메모
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProspect(null);
                    setFormData({ name: '', email: '', phone: '', source: '', notes: '', tags: [] });
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleAddProspect}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  {editingProspect ? '수정' : '추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

