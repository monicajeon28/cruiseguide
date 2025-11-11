'use client';

import { useState, useEffect } from 'react';
import { FiSave, FiPlus, FiTrash2, FiEdit2, FiX, FiChevronUp, FiChevronDown, FiImage } from 'react-icons/fi';

interface FooterItem {
  id: string;
  name: string;
  link: string;
  icon?: string | null;
  order: number;
}

interface CompanyInfoLine {
  id: string;
  text: string;
  order: number;
}

interface FooterData {
  customerCenter: {
    title: string;
    phone: string;
    operatingHours: string;
    holidayInfo: string;
    consultButton: {
      enabled: boolean;
      text: string;
      link: string;
      icon: string | null;
    };
  };
  faqSection: {
    title: string;
    enabled: boolean;
    items: FooterItem[];
  };
  genieButton: {
    enabled: boolean;
    name: string;
    link: string;
    icon: string | null;
    gradient: string;
  };
  bottomLinks: FooterItem[];
  companyInfo: {
    lines: CompanyInfoLine[];
  };
  copyright: {
    text: string;
    poweredBy: {
      text: string;
      company: string;
      link: string;
    };
  };
}

export default function FooterEditPage() {
  const [footerData, setFooterData] = useState<FooterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  useEffect(() => {
    loadFooterData();
  }, []);

  const loadFooterData = async () => {
    try {
      const response = await fetch('/api/admin/footer', {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.ok) {
        setFooterData(data.data);
      }
    } catch (error) {
      console.error('Failed to load footer data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!footerData) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/admin/footer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ data: footerData }),
      });

      const result = await response.json();
      if (result.ok) {
        alert('푸터가 저장되었습니다.');
        setEditingItem(null);
        setEditingSection(null);
      } else {
        alert('저장 실패: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save footer:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFaqItem = () => {
    if (!footerData) return;
    const newId = `faq_${Date.now()}`;
    const newItem: FooterItem = {
      id: newId,
      name: '새 항목',
      link: '#',
      icon: null,
      order: footerData.faqSection.items.length + 1,
    };
    setFooterData({
      ...footerData,
      faqSection: {
        ...footerData.faqSection,
        items: [...footerData.faqSection.items, newItem],
      },
    });
    setEditingItem(newId);
  };

  const handleDeleteFaqItem = (id: string) => {
    if (!footerData) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setFooterData({
      ...footerData,
      faqSection: {
        ...footerData.faqSection,
        items: footerData.faqSection.items.filter((item) => item.id !== id),
      },
    });
  };

  const handleAddBottomLink = () => {
    if (!footerData) return;
    const newId = `link_${Date.now()}`;
    const newItem: FooterItem = {
      id: newId,
      name: '새 링크',
      link: '#',
      order: footerData.bottomLinks.length + 1,
    };
    setFooterData({
      ...footerData,
      bottomLinks: [...footerData.bottomLinks, newItem],
    });
    setEditingItem(newId);
  };

  const handleDeleteBottomLink = (id: string) => {
    if (!footerData) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setFooterData({
      ...footerData,
      bottomLinks: footerData.bottomLinks.filter((item) => item.id !== id),
    });
  };

  const handleAddCompanyInfoLine = () => {
    if (!footerData) return;
    const newId = `line_${Date.now()}`;
    const newLine: CompanyInfoLine = {
      id: newId,
      text: '새 정보',
      order: footerData.companyInfo.lines.length + 1,
    };
    setFooterData({
      ...footerData,
      companyInfo: {
        ...footerData.companyInfo,
        lines: [...footerData.companyInfo.lines, newLine],
      },
    });
    setEditingItem(newId);
  };

  const handleDeleteCompanyInfoLine = (id: string) => {
    if (!footerData) return;
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setFooterData({
      ...footerData,
      companyInfo: {
        ...footerData.companyInfo,
        lines: footerData.companyInfo.lines.filter((line) => line.id !== id),
      },
    });
  };

  const handleMoveItem = (items: FooterItem[], index: number, direction: 'up' | 'down') => {
    if (!footerData) return;
    const newItems = [...items];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newItems.length) return;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    newItems.forEach((item, i) => {
      item.order = i + 1;
    });
    return newItems;
  };

  const handleImageUpload = async (file: File, targetId: string, targetType: 'faq' | 'genie' | 'consult') => {
    if (!footerData) return;

    try {
      setUploadingImage(targetId);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const result = await response.json();
      if (result.ok && result.url) {
        if (targetType === 'faq') {
          const newItems = footerData.faqSection.items.map((item) =>
            item.id === targetId ? { ...item, icon: result.url } : item
          );
          setFooterData({
            ...footerData,
            faqSection: { ...footerData.faqSection, items: newItems },
          });
        } else if (targetType === 'genie') {
          setFooterData({
            ...footerData,
            genieButton: { ...footerData.genieButton, icon: result.url },
          });
        } else if (targetType === 'consult') {
          setFooterData({
            ...footerData,
            customerCenter: {
              ...footerData.customerCenter,
              consultButton: {
                ...footerData.customerCenter.consultButton,
                icon: result.url,
              },
            },
          });
        }
        alert('이미지가 업로드되었습니다.');
      } else {
        alert('이미지 업로드 실패: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploadingImage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-700">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!footerData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-red-600">푸터 데이터를 불러올 수 없습니다.</p>
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
            <span className="text-5xl">📝</span>
            푸터 수정
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            크루즈몰 하단 푸터의 모든 요소를 수정할 수 있습니다
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold ${
            isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              저장 중...
            </>
          ) : (
            <>
              <FiSave size={18} />
              저장하기
            </>
          )}
        </button>
      </div>

      {/* 고객센터 섹션 */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">고객센터</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">제목</label>
            <input
              type="text"
              value={footerData.customerCenter.title}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  customerCenter: { ...footerData.customerCenter, title: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">전화번호</label>
            <input
              type="tel"
              value={footerData.customerCenter.phone}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  customerCenter: { ...footerData.customerCenter, phone: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">운영시간</label>
            <input
              type="text"
              value={footerData.customerCenter.operatingHours}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  customerCenter: { ...footerData.customerCenter, operatingHours: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">휴무 정보</label>
            <input
              type="text"
              value={footerData.customerCenter.holidayInfo}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  customerCenter: { ...footerData.customerCenter, holidayInfo: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">상담하기 버튼</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={footerData.customerCenter.consultButton.enabled}
                  onChange={(e) =>
                    setFooterData({
                      ...footerData,
                      customerCenter: {
                        ...footerData.customerCenter,
                        consultButton: {
                          ...footerData.customerCenter.consultButton,
                          enabled: e.target.checked,
                        },
                      },
                    })
                  }
                  className="w-4 h-4"
                />
                <label className="text-sm font-semibold text-gray-700">활성화</label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">버튼 텍스트</label>
                <input
                  type="text"
                  value={footerData.customerCenter.consultButton.text}
                  onChange={(e) =>
                    setFooterData({
                      ...footerData,
                      customerCenter: {
                        ...footerData.customerCenter,
                        consultButton: {
                          ...footerData.customerCenter.consultButton,
                          text: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">링크</label>
                <input
                  type="text"
                  value={footerData.customerCenter.consultButton.link}
                  onChange={(e) =>
                    setFooterData({
                      ...footerData,
                      customerCenter: {
                        ...footerData.customerCenter,
                        consultButton: {
                          ...footerData.customerCenter.consultButton,
                          link: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">이미지/아이콘</label>
                <div className="flex items-center gap-3">
                  {footerData.customerCenter.consultButton.icon && (
                    <img src={footerData.customerCenter.consultButton.icon} alt="아이콘" className="w-12 h-12 object-contain border-2 border-gray-300 rounded" />
                  )}
                  <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
                    <FiImage size={18} />
                    {uploadingImage === 'consult' ? '업로드 중...' : '이미지 업로드'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file, 'consult', 'consult');
                        }
                      }}
                      disabled={uploadingImage === 'consult'}
                    />
                  </label>
                  {footerData.customerCenter.consultButton.icon && (
                    <button
                      onClick={() => {
                        setFooterData({
                          ...footerData,
                          customerCenter: {
                            ...footerData.customerCenter,
                            consultButton: {
                              ...footerData.customerCenter.consultButton,
                              icon: null,
                            },
                          },
                        });
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      이미지 제거
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ/문의하기 섹션 */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">FAQ/문의하기</h2>
          <button
            onClick={handleAddFaqItem}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus size={18} />
            항목 추가
          </button>
        </div>
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={footerData.faqSection.enabled}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  faqSection: { ...footerData.faqSection, enabled: e.target.checked },
                })
              }
              className="w-4 h-4"
            />
            <label className="text-sm font-semibold text-gray-700">섹션 활성화</label>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">제목</label>
            <input
              type="text"
              value={footerData.faqSection.title}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  faqSection: { ...footerData.faqSection, title: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
        </div>
        <div className="space-y-2">
          {footerData.faqSection.items
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <div
                key={item.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
              >
                {editingItem === item.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">이름</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = footerData.faqSection.items.map((i) =>
                            i.id === item.id ? { ...i, name: e.target.value } : i
                          );
                          setFooterData({
                            ...footerData,
                            faqSection: { ...footerData.faqSection, items: newItems },
                          });
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">링크</label>
                      <input
                        type="text"
                        value={item.link}
                        onChange={(e) => {
                          const newItems = footerData.faqSection.items.map((i) =>
                            i.id === item.id ? { ...i, link: e.target.value } : i
                          );
                          setFooterData({
                            ...footerData,
                            faqSection: { ...footerData.faqSection, items: newItems },
                          });
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">이미지/아이콘</label>
                      <div className="flex items-center gap-3">
                        {item.icon && (
                          <img src={item.icon} alt="아이콘" className="w-12 h-12 object-contain border-2 border-gray-300 rounded" />
                        )}
                        <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
                          <FiImage size={18} />
                          {uploadingImage === item.id ? '업로드 중...' : '이미지 업로드'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file, item.id, 'faq');
                              }
                            }}
                            disabled={uploadingImage === item.id}
                          />
                        </label>
                        {item.icon && (
                          <button
                            onClick={() => {
                              const newItems = footerData.faqSection.items.map((i) =>
                                i.id === item.id ? { ...i, icon: null } : i
                              );
                              setFooterData({
                                ...footerData,
                                faqSection: { ...footerData.faqSection, items: newItems },
                              });
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                          >
                            이미지 제거
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        완료
                      </button>
                      <button
                        onClick={() => handleDeleteFaqItem(item.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <FiTrash2 size={16} />
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{item.name}</div>
                      <div className="text-sm text-gray-600">{item.link}</div>
                      {item.icon && (
                        <div className="mt-2">
                          <img src={item.icon} alt="아이콘" className="w-8 h-8 object-contain" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newItems = handleMoveItem(footerData.faqSection.items, index, 'up');
                          if (newItems) {
                            setFooterData({
                              ...footerData,
                              faqSection: { ...footerData.faqSection, items: newItems },
                            });
                          }
                        }}
                        disabled={index === 0}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        <FiChevronUp size={18} />
                      </button>
                      <button
                        onClick={() => {
                          const newItems = handleMoveItem(footerData.faqSection.items, index, 'down');
                          if (newItems) {
                            setFooterData({
                              ...footerData,
                              faqSection: { ...footerData.faqSection, items: newItems },
                            });
                          }
                        }}
                        disabled={index === footerData.faqSection.items.length - 1}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        <FiChevronDown size={18} />
                      </button>
                      <button
                        onClick={() => setEditingItem(item.id)}
                        className="p-2 hover:bg-blue-100 rounded-lg"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteFaqItem(item.id)}
                        className="p-2 hover:bg-red-100 rounded-lg"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* 크루즈 지니 AI 버튼 */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">크루즈 지니 AI 버튼</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={footerData.genieButton.enabled}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  genieButton: { ...footerData.genieButton, enabled: e.target.checked },
                })
              }
              className="w-4 h-4"
            />
            <label className="text-sm font-semibold text-gray-700">활성화</label>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">이름</label>
            <input
              type="text"
              value={footerData.genieButton.name}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  genieButton: { ...footerData.genieButton, name: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">링크</label>
            <input
              type="text"
              value={footerData.genieButton.link}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  genieButton: { ...footerData.genieButton, link: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">이미지/아이콘</label>
            <div className="flex items-center gap-3">
              {footerData.genieButton.icon && (
                <img src={footerData.genieButton.icon} alt="아이콘" className="w-12 h-12 object-contain border-2 border-gray-300 rounded" />
              )}
              <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
                <FiImage size={18} />
                {uploadingImage === 'genie' ? '업로드 중...' : '이미지 업로드'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageUpload(file, 'genie', 'genie');
                    }
                  }}
                  disabled={uploadingImage === 'genie'}
                />
              </label>
              {footerData.genieButton.icon && (
                <button
                  onClick={() => {
                    setFooterData({
                      ...footerData,
                      genieButton: { ...footerData.genieButton, icon: null },
                    });
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  이미지 제거
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">그라디언트 색상</label>
            <input
              type="text"
              value={footerData.genieButton.gradient}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  genieButton: { ...footerData.genieButton, gradient: e.target.value },
                })
              }
              placeholder="from-purple-600 to-pink-600"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">예: from-purple-600 to-pink-600</p>
          </div>
        </div>
      </div>

      {/* 하단 링크 */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">하단 링크</h2>
          <button
            onClick={handleAddBottomLink}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus size={18} />
            링크 추가
          </button>
        </div>
        <div className="space-y-2">
          {footerData.bottomLinks
            .sort((a, b) => a.order - b.order)
            .map((link, index) => (
              <div
                key={link.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
              >
                {editingItem === link.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">이름</label>
                      <input
                        type="text"
                        value={link.name}
                        onChange={(e) => {
                          const newLinks = footerData.bottomLinks.map((l) =>
                            l.id === link.id ? { ...l, name: e.target.value } : l
                          );
                          setFooterData({
                            ...footerData,
                            bottomLinks: newLinks,
                          });
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">링크</label>
                      <input
                        type="text"
                        value={link.link}
                        onChange={(e) => {
                          const newLinks = footerData.bottomLinks.map((l) =>
                            l.id === link.id ? { ...l, link: e.target.value } : l
                          );
                          setFooterData({
                            ...footerData,
                            bottomLinks: newLinks,
                          });
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        완료
                      </button>
                      <button
                        onClick={() => handleDeleteBottomLink(link.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <FiTrash2 size={16} />
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800">{link.name}</div>
                      <div className="text-sm text-gray-600">{link.link}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newLinks = handleMoveItem(footerData.bottomLinks, index, 'up');
                          if (newLinks) {
                            setFooterData({
                              ...footerData,
                              bottomLinks: newLinks,
                            });
                          }
                        }}
                        disabled={index === 0}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        <FiChevronUp size={18} />
                      </button>
                      <button
                        onClick={() => {
                          const newLinks = handleMoveItem(footerData.bottomLinks, index, 'down');
                          if (newLinks) {
                            setFooterData({
                              ...footerData,
                              bottomLinks: newLinks,
                            });
                          }
                        }}
                        disabled={index === footerData.bottomLinks.length - 1}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        <FiChevronDown size={18} />
                      </button>
                      <button
                        onClick={() => setEditingItem(link.id)}
                        className="p-2 hover:bg-blue-100 rounded-lg"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteBottomLink(link.id)}
                        className="p-2 hover:bg-red-100 rounded-lg"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* 회사 정보 */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">회사 정보</h2>
          <button
            onClick={handleAddCompanyInfoLine}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <FiPlus size={18} />
            줄 추가
          </button>
        </div>
        <div className="space-y-2">
          {footerData.companyInfo.lines
            .sort((a, b) => a.order - b.order)
            .map((line, index) => (
              <div
                key={line.id}
                className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-colors"
              >
                {editingItem === line.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">텍스트</label>
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => {
                          const newLines = footerData.companyInfo.lines.map((l) =>
                            l.id === line.id ? { ...l, text: e.target.value } : l
                          );
                          setFooterData({
                            ...footerData,
                            companyInfo: { ...footerData.companyInfo, lines: newLines },
                          });
                        }}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(null)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        완료
                      </button>
                      <button
                        onClick={() => handleDeleteCompanyInfoLine(line.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <FiTrash2 size={16} />
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 text-gray-800">{line.text}</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const newLines = [...footerData.companyInfo.lines];
                          const newIndex = index - 1;
                          if (newIndex >= 0) {
                            [newLines[index], newLines[newIndex]] = [newLines[newIndex], newLines[index]];
                            newLines.forEach((l, i) => {
                              l.order = i + 1;
                            });
                            setFooterData({
                              ...footerData,
                              companyInfo: { ...footerData.companyInfo, lines: newLines },
                            });
                          }
                        }}
                        disabled={index === 0}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        <FiChevronUp size={18} />
                      </button>
                      <button
                        onClick={() => {
                          const newLines = [...footerData.companyInfo.lines];
                          const newIndex = index + 1;
                          if (newIndex < newLines.length) {
                            [newLines[index], newLines[newIndex]] = [newLines[newIndex], newLines[index]];
                            newLines.forEach((l, i) => {
                              l.order = i + 1;
                            });
                            setFooterData({
                              ...footerData,
                              companyInfo: { ...footerData.companyInfo, lines: newLines },
                            });
                          }
                        }}
                        disabled={index === footerData.companyInfo.lines.length - 1}
                        className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                      >
                        <FiChevronDown size={18} />
                      </button>
                      <button
                        onClick={() => setEditingItem(line.id)}
                        className="p-2 hover:bg-blue-100 rounded-lg"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteCompanyInfoLine(line.id)}
                        className="p-2 hover:bg-red-100 rounded-lg"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-white rounded-xl shadow-lg border-2 border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Copyright</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">Copyright 텍스트</label>
            <input
              type="text"
              value={footerData.copyright.text}
              onChange={(e) =>
                setFooterData({
                  ...footerData,
                  copyright: { ...footerData.copyright, text: e.target.value },
                })
              }
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
            />
          </div>
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Powered By</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">텍스트</label>
                <input
                  type="text"
                  value={footerData.copyright.poweredBy.text}
                  onChange={(e) =>
                    setFooterData({
                      ...footerData,
                      copyright: {
                        ...footerData.copyright,
                        poweredBy: {
                          ...footerData.copyright.poweredBy,
                          text: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">회사명</label>
                <input
                  type="text"
                  value={footerData.copyright.poweredBy.company}
                  onChange={(e) =>
                    setFooterData({
                      ...footerData,
                      copyright: {
                        ...footerData.copyright,
                        poweredBy: {
                          ...footerData.copyright.poweredBy,
                          company: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">링크</label>
                <input
                  type="text"
                  value={footerData.copyright.poweredBy.link}
                  onChange={(e) =>
                    setFooterData({
                      ...footerData,
                      copyright: {
                        ...footerData.copyright,
                        poweredBy: {
                          ...footerData.copyright.poweredBy,
                          link: e.target.value,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

