// app/admin/mall/community/page.tsx
// 커뮤니티 관리 페이지

'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiTrash2, FiPlus, FiX, FiSave, FiSearch, FiFilter } from 'react-icons/fi';
import { showSuccess, showError } from '@/components/ui/Toast';

interface CommunityPost {
  id: number;
  title: string;
  content: string;
  category: string;
  authorName?: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
}

interface Category {
  id: string;
  label: string;
  value: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'travel-tip', label: '여행팁', value: 'travel-tip' },
  { id: 'destination', label: '관광지추천', value: 'destination' },
  { id: 'qna', label: '질문 답변', value: 'qna' },
  { id: 'general', label: '일반', value: 'general' },
];

export default function CommunityManagementPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const [newCategoryLabel, setNewCategoryLabel] = useState('');

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const categoryParam = selectedCategory === 'all' ? '' : `&category=${selectedCategory}`;
      const searchParam = searchKeyword ? `&search=${encodeURIComponent(searchKeyword)}` : '';
      const response = await fetch(`/api/community/posts?limit=100${categoryParam}${searchParam}`);
      const data = await response.json();
      
      if (data.ok) {
        setPosts(data.posts || []);
      } else {
        showError('게시글을 불러오는데 실패했습니다.');
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      showError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchKeyword]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/mall/community/categories');
      const data = await response.json();
      
      if (data.ok && data.categories) {
        setCategories(data.categories);
      } else {
        // 기본 카테고리 사용
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(DEFAULT_CATEGORIES);
    }
  }, []);

  const handleDeletePost = async (postId: number) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/mall/community/posts/${postId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.ok) {
        showSuccess('게시글이 삭제되었습니다.');
        loadPosts();
      } else {
        showError(data.error || '게시글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryValue.trim() || !newCategoryLabel.trim()) {
      showError('카테고리 값과 라벨을 모두 입력해주세요.');
      return;
    }

    // 중복 확인
    if (categories.some(c => c.value === newCategoryValue || c.label === newCategoryLabel)) {
      showError('이미 존재하는 카테고리입니다.');
      return;
    }

    try {
      const response = await fetch('/api/admin/mall/community/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          value: newCategoryValue.trim(),
          label: newCategoryLabel.trim(),
        }),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        showSuccess('카테고리가 추가되었습니다.');
        setNewCategoryValue('');
        setNewCategoryLabel('');
        setIsAddingCategory(false);
        loadCategories();
      } else {
        showError(data.error || '카테고리 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      showError('카테고리 추가 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('정말 이 카테고리를 삭제하시겠습니까? 해당 카테고리의 게시글은 "일반" 카테고리로 이동됩니다.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/mall/community/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.ok) {
        showSuccess('카테고리가 삭제되었습니다.');
        loadCategories();
        if (selectedCategory === categoryId) {
          setSelectedCategory('all');
        }
      } else {
        showError(data.error || '카테고리 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      showError('카테고리 삭제 중 오류가 발생했습니다.');
    }
  };

  const getCategoryLabel = (categoryValue: string) => {
    const category = categories.find(c => c.value === categoryValue);
    return category?.label || categoryValue;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredPosts = posts.filter(post => {
    if (selectedCategory !== 'all' && post.category !== selectedCategory) {
      return false;
    }
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        post.title.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword) ||
        post.authorName?.toLowerCase().includes(keyword)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          💬 커뮤니티 관리
        </h1>
        <p className="text-gray-600">
          크루즈몰 커뮤니티 게시글과 카테고리를 관리합니다.
        </p>
      </div>

      {/* 카테고리 관리 섹션 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">카테고리 관리</h2>
          <button
            onClick={() => setIsAddingCategory(!isAddingCategory)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            카테고리 추가
          </button>
        </div>

        {isAddingCategory && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 값 (영문)
                </label>
                <input
                  type="text"
                  value={newCategoryValue}
                  onChange={(e) => setNewCategoryValue(e.target.value)}
                  placeholder="예: travel-review"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리 라벨 (한글)
                </label>
                <input
                  type="text"
                  value={newCategoryLabel}
                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                  placeholder="예: 여행 후기"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FiSave className="w-4 h-4" />
                저장
              </button>
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryValue('');
                  setNewCategoryLabel('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                <FiX className="w-4 h-4" />
                취소
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg border border-gray-200"
            >
              <span className="font-semibold text-gray-800">{category.label}</span>
              <span className="text-xs text-gray-500">({category.value})</span>
              {category.value !== 'general' && (
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  title="카테고리 삭제"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="게시글 제목, 내용, 작성자로 검색..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="w-5 h-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체 카테고리</option>
              {categories.map((category) => (
                <option key={category.id} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          게시글 목록 ({filteredPosts.length}개)
        </h2>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">게시글을 불러오는 중...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchKeyword || selectedCategory !== 'all'
              ? '검색 결과가 없습니다.'
              : '게시글이 없습니다.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">{post.title}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {getCategoryLabel(post.category)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>작성자: {post.authorName || '익명'}</span>
                      <span>조회수: {post.views}</span>
                      <span>좋아요: {post.likes}</span>
                      <span>댓글: {post.comments}</span>
                      <span>작성일: {formatDate(post.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePost(post.id)}
                    className="ml-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="게시글 삭제"
                  >
                    <FiTrash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

