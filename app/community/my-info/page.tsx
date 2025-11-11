// app/community/my-info/page.tsx
// 내 정보 페이지 (커뮤니티 전용)

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiArrowLeft, FiEdit2, FiTrash2, FiEye, FiMessageCircle, FiHeart } from 'react-icons/fi';

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
  views: number;
  likes: number;
  comments: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: number;
  title: string;
  content: string;
  rating: number;
  cruiseLine: string | null;
  shipName: string | null;
  travelDate: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  Post: {
    id: number;
    title: string;
  };
}

interface Trip {
  id: number;
  cruiseName: string | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  companionType: string | null; // 동행유형 추가
  destination: string[] | null; // 목적지 추가
  nights: number | null;
  days: number | null;
  createdAt: string;
  CruiseProduct: {
    productCode: string;
    packageName: string;
    cruiseLine: string;
    shipName: string;
  } | null;
}

export default function MyInfoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{
    name: string | null;
    email: string | null;
    phone: string | null;
    genieStatus?: string | null;
    genieName?: string | null;
    geniePhone?: string | null;
  } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyInfo();
  }, []);

  const fetchMyInfo = async () => {
    try {
      const response = await fetch('/api/community/my-info', {
        credentials: 'include'
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        if (response.status === 401) {
          router.push('/community/login?next=/community/my-info');
          return;
        }
        setError(data.error || '정보를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
        return;
      }

      setUser(data.user);
      setPosts(data.posts || []);
      setReviews(data.reviews || []);
      setComments(data.comments || []);
      setTrips(data.trips || []);
    } catch (err) {
      setError('정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm('정말 이 리뷰를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/community/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        alert(data.error || '리뷰 삭제에 실패했습니다.');
        return;
      }

      // 리뷰 목록에서 제거
      setReviews(reviews.filter(r => r.id !== reviewId));
      alert('리뷰가 삭제되었습니다.');
    } catch (err) {
      alert('리뷰 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        alert(data.error || '게시글 삭제에 실패했습니다.');
        return;
      }

      // 게시글 목록에서 제거
      setPosts(posts.filter(p => p.id !== postId));
      alert('게시글이 삭제되었습니다.');
    } catch (err) {
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      'general': { label: '일반', color: 'bg-gray-100 text-gray-700' },
      'travel-tip': { label: '여행팁', color: 'bg-blue-100 text-blue-700' },
      'destination': { label: '관광지추천', color: 'bg-purple-100 text-purple-700' },
      'qna': { label: '질문 답변', color: 'bg-green-100 text-green-700' }
    };
    return labels[category] || { label: category, color: 'bg-gray-100 text-gray-700' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            메인으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* 이전으로 가기 */}
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
              <span className="font-medium">이전으로 가기</span>
            </Link>
          </div>

          {/* 헤더 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              내 정보
            </h1>
            {user && (
              <div className="flex flex-col items-center gap-6">
                <p className="text-xl text-gray-600">
                  {user.name || '사용자'}님의 활동 내역입니다.
                </p>
                <Link
                  href="/community/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiEdit2 size={18} />
                  프로필 수정
                </Link>

                {/* 지니 AI 상태 */}
                {user.genieStatus ? (
                  <div
                    className={`w-full max-w-2xl px-5 py-4 rounded-xl border text-center ${
                      user.genieStatus === 'active'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'bg-red-50 border-red-500 text-red-700'
                    }`}
                  >
                    {user.genieStatus === 'active' ? (
                      <p className="text-base md:text-lg font-semibold">
                        🟢 지니 AI 사용중입니다. 행복한 여행 되세요!
                      </p>
                    ) : (
                      <p className="text-base md:text-lg font-semibold">
                        🔴 지니AI 사용종료 되셨습니다. 다음에 또 만나요
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="w-full max-w-2xl space-y-4">
                    <div className="px-5 py-4 rounded-xl border bg-red-50 border-red-500 text-red-700 text-center">
                      <p className="text-base md:text-lg font-semibold">
                        🔴 이런! 지니 AI를 사용하지 않고 있군요? 빨리 만나길 바래요!
                      </p>
                    </div>
                    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-lg border border-gray-200">
                      <iframe
                        src="https://www.youtube.com/embed/-p_6G69MgyQ?si=3KTuC8W6n5Be1zzY"
                        title="지니 AI 소개 영상"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                        className="w-full h-full"
                      ></iframe>
                    </div>
                  </div>
                )}

                {(user.genieName || user.geniePhone) && (
                  <div className="w-full max-w-2xl p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 text-left">
                    <p className="font-semibold mb-1 text-center">현재 연동된 지니 AI 가이드</p>
                    <ul className="space-y-1">
                      {user.genieName && (
                        <li>
                          <span className="font-medium">로그인 이름:</span> {user.genieName}
                        </li>
                      )}
                      {user.geniePhone && (
                        <li>
                          <span className="font-medium">로그인 연락처:</span> {user.geniePhone}
                        </li>
                      )}
                      <li>
                        <span className="font-medium">로그인 비밀번호:</span> 3800
                      </li>
                    </ul>
                    <p className="mt-3 text-xs text-blue-700 text-center">* 여행이 종료되면 지니 AI는 자동으로 연결이 중지됩니다.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 여행 배정 섹션 (관리자가 배정한 여행 정보) */}
          <div className="mb-12 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              여행 배정 정보 ({trips.length}건)
            </h2>
            {trips.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 배정된 여행이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          {trip.CruiseProduct?.packageName || trip.cruiseName || '여행 정보'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                          {trip.CruiseProduct && (
                            <>
                              <div>
                                <span className="font-medium text-gray-700">크루즈선:</span> {trip.CruiseProduct.cruiseLine} {trip.CruiseProduct.shipName}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">상품코드:</span> {trip.CruiseProduct.productCode}
                              </div>
                            </>
                          )}
                          {trip.startDate && trip.endDate && (
                            <>
                              <div>
                                <span className="font-medium text-gray-700">출발일:</span> {new Date(trip.startDate).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">종료일:</span> {new Date(trip.endDate).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </>
                          )}
                          {trip.nights && trip.days && (
                            <div>
                              <span className="font-medium text-gray-700">일정:</span> {trip.nights}박 {trip.days}일
                            </div>
                          )}
                          {trip.companionType && (
                            <div>
                              <span className="font-medium text-gray-700">동행유형:</span> {trip.companionType}
                            </div>
                          )}
                          {trip.destination && trip.destination.length > 0 && (
                            <div className="md:col-span-2">
                              <span className="font-medium text-gray-700">목적지:</span> {Array.isArray(trip.destination) ? trip.destination.join(', ') : trip.destination}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">상태:</span> {trip.status === 'Upcoming' ? '예정' : trip.status === 'InProgress' ? '진행중' : trip.status === 'Completed' ? '완료' : trip.status}
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">배정일:</span> {new Date(trip.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 내 게시글 섹션 */}
          <div className="mb-12 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              내가 올린 게시글 ({posts.length}개)
            </h2>
            {posts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 작성한 게시글이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const categoryInfo = getCategoryLabel(post.category);
                  return (
                    <div
                      key={post.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryInfo.color}`}>
                              {categoryInfo.label}
                            </span>
                            <Link
                              href={`/community/posts/${post.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {post.title}
                            </Link>
                          </div>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FiEye size={16} />
                              {post.views}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiHeart size={16} />
                              {post.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <FiMessageCircle size={16} />
                              {post.commentCount || post.comments}
                            </span>
                            <span>
                              {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 내 리뷰 섹션 */}
          <div className="mb-12 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              내가 올린 리뷰 ({reviews.length}개)
            </h2>
            {reviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 작성한 리뷰가 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <Link
                            href={`/community/reviews/${review.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {review.title}
                          </Link>
                        </div>
                        {(review.cruiseLine || review.shipName) && (
                          <p className="text-sm text-gray-600 mb-2">
                            {review.cruiseLine} {review.shipName}
                          </p>
                        )}
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{review.content}</p>
                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {review.images.slice(0, 3).map((img, idx) => (
                              <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={img}
                                  alt={`리뷰 이미지 ${idx + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                />
                              </div>
                            ))}
                            {review.images.length > 3 && (
                              <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-600">
                                +{review.images.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={`/community/reviews/${review.id}/edit`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="수정"
                        >
                          <FiEdit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteReview(review.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 내 댓글 섹션 */}
          <div className="mb-12 bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              내가 쓴 댓글 ({comments.length}개)
            </h2>
            {comments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">아직 작성한 댓글이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="mb-3">
                      <Link
                        href={`/community/posts/${comment.Post.id}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        {comment.Post.title}
                      </Link>
                    </div>
                    <p className="text-gray-700 mb-3">{comment.content}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

