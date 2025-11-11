import type { ChatMessage } from '@/lib/chat-types';
import { searchPhotos, getSubfolders } from '@/lib/photos-search';

export async function handleShowPhotos(text: string): Promise<ChatMessage[]> {
  // 크루즈 사진 검색
  const result = await searchPhotos(text);

  // 크루즈 사진이 없어도 구글 이미지 검색 결과를 표시
  if (!result.items || result.items.length === 0) {
    console.log('[handleShowPhotos] No cruise photos found, showing Google Images');

    return [{
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      role: 'assistant',
      type: 'show-me',
      text: `"${text}" 구글 이미지 검색 결과`,
      googleImageUrl: `https://www.google.com/search?q=${encodeURIComponent(text)}&tbm=isch`,
      cruisePhotos: [], // 크루즈 사진 없음
      subfolders: [],
      categories: [],
      // 구글 이미지 검색만 표시
      googleImagesOnly: true
    }];
  }

  // 하위 폴더 검색 (크루즈 선박명 등)
  const subfolders = await getSubfolders(text);
  console.log('[handleShowPhotos] Subfolders found:', {
    query: text,
    subfoldersCount: subfolders.length,
    subfolders: subfolders.slice(0, 5)
  });

  // 검색된 이미지 URL 수집
  const images = result.items.map(item => item.url);

  return [{
    id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    role: 'assistant',
    type: 'show-me',
    text: `${text} 사진 (${images.length}장)`,
    googleImageUrl: `https://www.google.com/search?q=${encodeURIComponent(text)}&tbm=isch`,
    cruisePhotos: result.items.map(item => ({
      url: item.url,
      title: item.title,
    })),
    subfolders: subfolders.map(folder => ({
      name: folder.name,
      displayName: folder.displayName,
      icon: folder.icon,
      photoCount: folder.photoCount,
    })),
    categories: [],
    googleImagesOnly: false
  }];
} 