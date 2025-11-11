'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiUser, FiCalendar, FiStar, FiEdit, FiTrash2, FiClock, FiCheckCircle } from 'react-icons/fi';
import Image from 'next/image'; // Added missing import for Image

interface Review {
  id: number;
  customerName: string;
  customerPhone: string;
  cruiseName: string;
  destination: string;
  reviewText: string;
  photos: string[];
  rating: number;
  isApproved: boolean;
  createdAt: string;
  adminNotes: string;
}

export default function AdminFeedback() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadReviews();
  }, []); // 컴포넌트 마운트 시 한 번만 로드

  const loadReviews = async () => {
    try {
      const response = await fetch(`/api/admin/feedback`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 승인 기능 제거 - 모든 후기 자동 승인

  const handleSaveNotes = async (reviewId: number) => {
    // CruiseReview 모델에는 adminNotes 필드가 없으므로 로컬 상태만 업데이트
    setReviews(prev => prev.map(review =>
      review.id === reviewId
        ? { ...review, adminNotes }
        : review
    ));
    
    if (selectedReview?.id === reviewId) {
      setSelectedReview(prev => prev ? { ...prev, adminNotes } : null);
    }
    
    setAdminNotes('');
    alert('메모는 로컬에만 저장됩니다. (DB에 adminNotes 필드가 없습니다)');
  };

  const handleExportCSV = () => {
    const csvData = reviews.map(review => ({
      '고객명': review.customerName,
      '전화번호': review.customerPhone,
      '크루즈선': review.cruiseName,
      '여행지': review.destination,
      '평점': review.rating,
      '등록일': review.createdAt,
      '관리자메모': review.adminNotes
    }));
    
    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reviews_export.csv';
    link.click();
  };

  const handleDownloadPhoto = (photoUrl: string, customerName: string) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `${customerName}_photo.jpg`;
    link.click();
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('정말 이 후기를 삭제하시겠습니까? 삭제된 후기는 복구할 수 없습니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/feedback?id=${reviewId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '후기 삭제에 실패했습니다');
      }

      // 목록에서 삭제된 후기 제거
      setReviews(prev => prev.filter(review => review.id !== reviewId));
      
      // 선택된 후기가 삭제된 경우 선택 해제
      if (selectedReview?.id === reviewId) {
        setSelectedReview(null);
      }

      alert('후기가 삭제되었습니다');
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert(error instanceof Error ? error.message : '후기 삭제 중 오류가 발생했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2 flex items-center gap-3">
            <span className="text-5xl">💬</span>
            후기 관리
          </h1>
          <p className="text-lg text-gray-600 font-medium">고객 후기를 검토하세요</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:scale-105 transition-all"
        >
          CSV 내보내기
        </button>
      </div>

      {/* 필터 제거 - 모든 후기 자동 승인 */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 후기 목록 */}
        <div className="lg:col-span-2">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-800">후기 목록</h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  onClick={() => setSelectedReview(review)}
                  className={`p-4 border-b-2 cursor-pointer transition-all ${
                    selectedReview?.id === review.id
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <p className={`font-medium ${selectedReview?.id === review.id ? 'text-white' : 'text-gray-800'}`}>
                          {review.customerName}
                        </p>
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          승인됨
                        </span>
                      </div>
                      <p className={`text-sm ${selectedReview?.id === review.id ? 'text-gray-200' : 'text-gray-600'}`}>
                        {review.cruiseName}
                        {review.destination && ` - ${review.destination}`}
                      </p>
                      <p className={`text-sm mt-1 line-clamp-2 ${selectedReview?.id === review.id ? 'text-gray-200' : 'text-gray-700'}`}>
                        {review.reviewText}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className={`text-xs ${selectedReview?.id === review.id ? 'text-gray-200' : 'text-gray-500'}`}>
                          ⭐ {review.rating}/5
                        </span>
                        <span className={`text-xs ${selectedReview?.id === review.id ? 'text-gray-200' : 'text-gray-500'}`}>
                          📷 {review.photos.length}장
                        </span>
                        <span className={`text-xs ${selectedReview?.id === review.id ? 'text-gray-200' : 'text-gray-500'}`}>
                          {review.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 후기 상세 정보 */}
        <div className="lg:col-span-1">
          {selectedReview ? (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border-2 border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">후기 상세 정보</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">고객 정보</label>
                  <p className="mt-1 font-semibold text-gray-900">{selectedReview.customerName}</p>
                  <p className="text-sm text-gray-600">{selectedReview.customerPhone}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">여행 정보</label>
                  <p className="mt-1 text-gray-900">{selectedReview.cruiseName}</p>
                  {selectedReview.destination && (
                    <p className="text-sm text-gray-600">{selectedReview.destination}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">평점</label>
                  <div className="mt-1 flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-lg ${i < selectedReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                        ⭐
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">{selectedReview.rating}/5</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">후기 내용</label>
                  <p className="mt-1 text-gray-900 text-sm leading-relaxed">{selectedReview.reviewText}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">사진</label>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    {selectedReview.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <Image
                          src={photo}
                          alt={`후기 사진 ${index + 1}`}
                          width={80}
                          height={80}
                          className="w-full h-20 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => handleDownloadPhoto(photo, selectedReview.customerName)}
                          className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded text-xs hover:bg-opacity-70"
                        >
                          ⬇️
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">관리자 메모</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="관리자 메모를 입력하세요..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent text-sm"
                    rows={3}
                  />
                  <button
                    onClick={() => handleSaveNotes(selectedReview.id)}
                    className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    메모 저장
                  </button>
                </div>
                
                {/* 승인 기능 제거 - 모든 후기 자동 승인 */}
                
                {selectedReview.adminNotes && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-1">저장된 메모</label>
                    <p className="text-sm text-gray-600">{selectedReview.adminNotes}</p>
                  </div>
                )}
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleDeleteReview(selectedReview.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    후기 삭제
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center text-gray-500">
                <p className="text-lg">후기를 선택하세요</p>
                <p className="text-sm mt-2">왼쪽 목록에서 후기를 클릭하면 상세 정보를 확인할 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
