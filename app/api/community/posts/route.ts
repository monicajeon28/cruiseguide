// app/api/community/posts/route.ts
// 커뮤니티 게시글 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
// Google Sheets 저장은 배치 작업으로 처리되므로 import 제거

// 한글 아이디 목록
const KOREAN_NICKNAMES = [
  '송이엄마', '찡찡', '크루즈닷만세', '바다사랑', '여행러버', '크루즈킹', '해외여행러', 
  '선상낭만', '오션뷰', '크루즈매니아', '여행의신', '바다의왕자', '선상요리사', 
  '크루즈여행자', '해외탐험가', '선상파티', '오션드림', '크루즈마스터', '여행스타', 
  '바다의별', '선상로맨스', '크루즈러버', '해외여행러버', '선상낭만주의자'
];

// 실제 고객이 쓴 것처럼 보이는 커뮤니티 게시글 샘플 데이터
const SAMPLE_POSTS = [
  {
    id: 1,
    title: '크루즈 여행 필수 준비물 체크리스트 꿀팁!',
    content: `크루즈 여행을 떠나기 전에 꼭 챙겨야 할 준비물들을 정리해봤어요! 
    
✅ 여권 & 비자 (6개월 이상 유효기간)
✅ 여행자보험 (꼭 가입하세요!)
✅ 편한 옷 (데크에서 바람 많이 불어요)
✅ 선크림 (선상에서 햇빛 강해요)
✅ 멀미약 (혹시 모르니 준비!)
✅ 현금 & 카드 (각 나라 통화 확인)
✅ 충전기 & 어댑터
✅ 수영복 & 수건

특히 여행자보험은 꼭 가입하시길 추천드려요! 크루즈닷에서 가입하시면 편리하게 처리할 수 있어요 ㅎㅎ`,
    category: 'travel-tip',
    authorName: '송이엄마',
    images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나 정찬 사진.jpg'],
    views: 1234,
    likes: 89,
    comments: 23,
    createdAt: '2025-01-20T10:30:00Z'
  },
  {
    id: 2,
    title: '알래스카 크루즈 언제 가는 게 좋을까요? 빙하 보기 좋은 시기 궁금해요!',
    content: `알래스카 크루즈 여행을 계획 중인데, 가장 좋은 시기는 언제인지 궁금합니다. 
    
빙하를 보기 좋은 시기와 날씨 정보를 알고 싶어요! 
5월~9월이 시즌이라고 하는데, 그 중에서도 언제가 최고일까요? 
혹시 다녀오신 분들 조언 부탁드려요 ^^`,
    category: 'qna',
    authorName: '찡찡',
    images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나 공연 후기.jpg'],
    views: 856,
    likes: 45,
    comments: 18,
    createdAt: '2025-01-18T14:20:00Z'
  },
  {
    id: 3,
    title: '지중해 크루즈 7박 8일 여행 후기 - 이탈리아, 그리스, 스페인 완전 정복!',
    content: `지중해 크루즈 여행을 다녀왔습니다! 이탈리아, 그리스, 스페인을 돌아보며 정말 아름다운 추억을 만들었어요.
    
📍 일정:
1일차: 로마 출발
2일차: 나폴리 (폼페이 투어)
3일차: 시칠리아 (에트나 화산)
4일차: 그리스 산토리니 (일몰 명소!)
5일차: 아테네 (파르테논 신전)
6일차: 크레타 (고대 유적)
7일차: 스페인 발렌시아
8일차: 바르셀로나 도착

특히 산토리니 일몰이 정말 장관이었어요! 사진 찍느라 바빴습니다 ㅋㅋㅋ
음식도 다 맛있고, 배도 편안했어요. 다음에도 또 가고 싶네요!`,
    category: 'schedule',
    authorName: '크루즈닷만세',
    images: [
      '/크루즈정보사진/고객 후기 자료/코스타 세레나호 사세보 후기 사진.jpg',
      '/크루즈정보사진/고객 후기 자료/코스타 세레나호 사세보 발코니 후기 사진 오션뷰.jpg'
    ],
    views: 2156,
    likes: 156,
    comments: 42,
    createdAt: '2025-01-15T09:15:00Z'
  },
  {
    id: 4,
    title: '크루즈 배에서 돈 절약하는 꿀팁 공유해요!',
    content: `크루즈 여행 비용 절약하는 방법 알려드릴게요!
    
💰 팁:
1. 음료 패키지 미리 구매 (배에서 사면 비싸요)
2. 와이파이 패키지 비교 (필요한 것만!)
3. 쇼핑은 마지막 날 (할인 많이 해요)
4. 엑스커션은 배에서 예약 (더 저렴할 수도)
5. 팁은 미리 계산해서 준비

특히 음료 패키지는 꼭 미리 구매하세요! 배에서 사면 2배는 더 비싸요 ㅠㅠ
저는 이렇게 절약해서 다음 여행 자금 마련했어요 ㅎㅎ`,
    category: 'travel-tip',
    authorName: '바다사랑',
    images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나 샴페인 후기.jpg'],
    views: 1890,
    likes: 112,
    comments: 35,
    createdAt: '2025-01-14T16:45:00Z'
  },
  {
    id: 5,
    title: '첫 크루즈 여행인데 방 선택 어떻게 해야 할까요?',
    content: `크루즈 여행 처음 가는데 방 선택이 너무 어려워요 ㅠㅠ
    
인실룸 vs 오션뷰 vs 발코니 중에 뭘 선택해야 할지 모르겠어요.
가격 차이가 많이 나는데, 발코니가 정말 필요한가요?
혹시 경험 있으신 분들 조언 부탁드려요! ^^`,
    category: 'qna',
    authorName: '여행러버',
    images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나호 발코니 후기 아이 사진.jpg'],
    views: 678,
    likes: 34,
    comments: 15,
    createdAt: '2025-01-13T11:30:00Z'
  },
  {
    id: 6,
    title: 'MSC 벨리시마 선상 레스토랑 추천 메뉴!',
    content: `MSC 벨리시마에서 먹은 맛있는 메뉴들 공유해요!
    
🍽️ 추천 메뉴:
- 랍스터 테일 (추천!)
- 스테이크 (완벽한 조리)
- 파스타 (이탈리아 본고장 맛)
- 디저트 (매일 바뀌는데 다 맛있어요)

특히 랍스터는 꼭 드셔보세요! 정말 맛있었어요 ㅋㅋㅋ
저녁 식사 시간에 가시면 더 좋은 자리 잡을 수 있어요 ^^`,
    category: 'travel-tip',
    authorName: '크루즈킹',
    images: ['/크루즈정보사진/고객 후기 자료/MSC벨리시마 식사 후기.jpg'],
    views: 1456,
    likes: 98,
    comments: 28,
    createdAt: '2025-01-12T13:20:00Z'
  },
  {
    id: 7,
    title: '코스타 세레나 공연 후기 - 정말 재밌었어요!',
    content: `코스타 세레나에서 본 공연들 후기 남겨요!
    
공연 스케줄:
- 저녁 쇼 (매일 다른 테마)
- 뮤지컬 (퀄리티 높아요!)
- 마술쇼 (아이들도 좋아해요)
- 댄스 파티 (밤늦게까지!)

특히 뮤지컬이 정말 퀄리티가 높았어요. 브로드웨이 못지않네요 ㅎㅎ
아이들도 너무 좋아했고, 가족 모두 만족했습니다!`,
    category: 'schedule',
    authorName: '해외여행러',
    images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나 공연 후기.jpg'],
    views: 987,
    likes: 67,
    comments: 19,
    createdAt: '2025-01-11T10:15:00Z'
  },
  {
    id: 8,
    title: '크루즈 여행 시 멀미 대처법 알려드려요!',
    content: `멀미 잘 하시는 분들 걱정 안 하셔도 돼요!
    
💊 대처법:
1. 멀미약 미리 복용 (출발 전부터!)
2. 배 중앙 쪽 방 선택 (덜 흔들려요)
3. 데크에서 바람 쐬기
4. 생강차 마시기
5. 레몬 냄새 맡기

저도 멀미 잘 하는데 이렇게 하니까 괜찮았어요!
특히 배 중앙 쪽 방이 정말 덜 흔들려서 좋았습니다 ^^`,
    category: 'travel-tip',
    authorName: '선상낭만',
    images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나 수영장 행사 후기 사진.jpg'],
    views: 1123,
    likes: 78,
    comments: 22,
    createdAt: '2025-01-10T15:30:00Z'
  },
  {
    id: 9,
    title: '카리브해 크루즈 일정 공유 - 완벽한 휴양지!',
    content: `카리브해 크루즈 다녀왔어요! 정말 완벽한 휴양이었습니다.
    
🏝️ 기항지:
- 자메이카 (레게 음악의 고향)
- 케이맨 제도 (수영하기 좋아요)
- 코스타 마야 (마야 유적)
- 코줄멜 (쇼핑 천국!)

특히 케이맨 제도에서 수영한 게 정말 좋았어요.
물이 너무 맑고 파랗고... 사진으로는 표현이 안 될 정도예요 ㅋㅋㅋ`,
    category: 'schedule',
    authorName: '오션뷰',
    images: ['/크루즈정보사진/고객 후기 자료/오션뷰 아침 조식 사진 후기.jpg'],
    views: 1678,
    likes: 134,
    comments: 38,
    createdAt: '2025-01-09T09:45:00Z'
  },
  {
    id: 10,
    title: '크루즈 여행 시 팁은 어떻게 주나요?',
    content: `팁 문화가 생소해서 어떻게 해야 할지 모르겠어요.
    
팁은 보통:
- 객실 서비스: 객실 요금의 일정 비율
- 레스토랑: 서비스에 따라
- 바텐더: 음료 주문 시

미리 계산해서 준비하시면 편해요!
아니면 배에서 자동으로 청구되는 팁 시스템도 있어요.
어떤 게 나은지 경험 있으신 분들 알려주세요 ^^`,
    category: 'qna',
    authorName: '크루즈매니아',
    images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나 칵테일 후기 2잔  레몬.jpg'],
    views: 756,
    likes: 42,
    comments: 16,
    createdAt: '2025-01-08T14:20:00Z'
  },
  {
    id: 11,
    title: '발코니 룸 vs 인실룸 차이점과 추천!',
    content: `방 선택 고민되시는 분들 참고하세요!
    
🏠 비교:
인실룸:
- 가격 저렴
- 창문 없음 (조금 답답할 수 있어요)
- 조명으로 낮/밤 구분

발코니:
- 바다 보면서 쉴 수 있어요
- 공기 순환 좋음
- 가격 비쌈

처음 가시는 분들은 오션뷰 추천해요!
발코니는 다음에 가실 때 고려해보시면 좋을 것 같아요 ㅎㅎ`,
    category: 'travel-tip',
    authorName: '여행의신',
    images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나호 사세보 발코니 후기 사진 오션뷰.jpg'],
    views: 2034,
    likes: 145,
    comments: 41,
    createdAt: '2025-01-07T11:10:00Z'
  },
  {
    id: 12,
    title: '로얄캐리비안 스펙트럼 가족 여행 후기',
    content: `가족 여행으로 스펙트럼 다녀왔어요!
    
👨‍👩‍👧‍👦 가족 여행 추천 이유:
- 아이들 놀이터 넓고 안전해요
- 수영장 여러 개 (어른/아이 분리)
- 식당 다양 (아이들 입맛에 맞춰)
- 공연도 아이들 좋아해요

아이들이 너무 좋아해서 다음에도 또 가고 싶다고 해요 ㅋㅋㅋ
부모님들도 편하게 쉬실 수 있어서 만족하셨어요!`,
    category: 'schedule',
    authorName: '바다의왕자',
    images: ['/크루즈정보사진/고객 후기 자료/코스타 세레나호 사세보 커플 후기 사진.jpg'],
    views: 1890,
    likes: 123,
    comments: 33,
    createdAt: '2025-01-06T16:30:00Z'
  },
  {
    id: 13,
    title: '크루즈 여행 시 옷차림 어떻게 해야 할까요?',
    content: `옷차림 고민되시는 분들 많으실 거예요!
    
👗 추천:
- 캐주얼: 평소 입는 옷 (데크 산책용)
- 세미포멀: 저녁 식사용 (드레스코드 확인!)
- 수영복: 수영장/해변용
- 운동복: 체육관/조깅용
- 겉옷: 바람 많이 불어요

특히 저녁 식사는 드레스코드 확인하세요!
일부 레스토랑은 정장 필수예요 ㅎㅎ`,
    category: 'travel-tip',
    authorName: '선상요리사',
    images: ['/크루즈정보사진/고객 후기 자료/MSC벨리시마 도쿄 가족이랑 여행 후기.jpg'],
    views: 1345,
    likes: 89,
    comments: 26,
    createdAt: '2025-01-05T10:45:00Z'
  },
  {
    id: 14,
    title: '크루즈 여행 중 인터넷 사용 꿀팁!',
    content: `와이파이 패키지 고민되시죠? 제 경험 공유해요!
    
📶 팁:
- 기본 패키지: 카톡/이메일 정도만 (저렴)
- 프리미엄: 영상 시청 가능 (비쌈)
- 기항지에서: 현지 와이파이 사용 (가장 저렴!)

저는 기본 패키지 + 기항지에서 와이파이 사용했어요.
충분했고 비용도 절약했어요 ㅋㅋㅋ
영상 보실 거 아니면 기본 패키지 추천드려요!`,
    category: 'travel-tip',
    authorName: '크루즈여행자',
    images: ['/크루즈정보사진/고객 후기 자료/로얄캐리비안 싱가포르 후기 3.jpg'],
    views: 1567,
    likes: 98,
    comments: 29,
    createdAt: '2025-01-04T13:15:00Z'
  },
  {
    id: 15,
    title: '지중해 크루즈 기항지별 추천 관광지!',
    content: `지중해 크루즈 기항지별 추천 장소 알려드려요!
    
📍 추천지:
- 로마: 콜로세움, 바티칸 (하루로는 부족해요!)
- 나폴리: 폼페이, 아말피 해안
- 산토리니: 일몰 명소, 화산섬 투어
- 아테네: 파르테논 신전, 아크로폴리스
- 발렌시아: 예술 과학 도시

특히 산토리니 일몰은 꼭 보세요!
사진으로는 표현 안 될 정도로 아름다워요 ㅎㅎ`,
    category: 'travel-tip',
    authorName: '해외탐험가',
    images: ['/크루즈정보사진/고객 후기 자료/싱가포르 로얄캐리비안 후기.png'],
    views: 2234,
    likes: 167,
    comments: 45,
    createdAt: '2025-01-03T09:30:00Z'
  }
];

const CRUISEDOT_NEWS_ALLOWED_MALL_IDS = new Set(
  Array.from({ length: 10 }, (_, index) => `user${index + 1}`)
);

// 게시글 목록 조회 (비회원도 가능)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const postIdParam = searchParams.get('postId');

    if (postIdParam) {
      const postId = parseInt(postIdParam);
      if (isNaN(postId)) {
        return NextResponse.json(
          { ok: false, error: '잘못된 게시글 ID입니다.' },
          { status: 400 }
        );
      }

      const post = await prisma.communityPost.findUnique({
        where: { id: postId, isDeleted: false },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          authorName: true,
          images: true,
          views: true,
          likes: true,
          comments: true,
          createdAt: true
        }
      });

      if (!post) {
        return NextResponse.json(
          { ok: false, error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        post: {
          ...post,
          createdAt:
            post.createdAt instanceof Date
              ? post.createdAt.toISOString()
              : (typeof post.createdAt === 'string' ? post.createdAt : new Date(post.createdAt).toISOString())
        }
      });
    }

    const limit = parseInt(searchParams.get('limit') || '15');
    const category = searchParams.get('category') || null;
    const search = searchParams.get('search') || null;

    // 카테고리 필터 조건
    const whereCondition: any = {
      isDeleted: false
    };

    // 카테고리 필터 추가
    if (category && category !== 'all') {
      // 기존 카테고리 매핑 (호환성)
      if (category === 'travel-prep' || category === 'schedule') {
        whereCondition.category = 'destination'; // 일정 공유는 여행지추천으로 매핑
      } else {
        whereCondition.category = category;
      }
    }

    // 검색 키워드 필터 추가
    let postsWithKeywordInComments: number[] = [];
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // SQLite 호환성을 위해 contains 사용 (대소문자 구분)
      // 실제로는 클라이언트에서 대소문자 구분 없이 검색하도록 처리
      whereCondition.OR = [
        {
          title: {
            contains: searchTerm
          }
        },
        {
          content: {
            contains: searchTerm
          }
        }
      ];

      // 댓글에서도 키워드 검색
      const commentsWithKeyword = await prisma.communityComment.findMany({
        where: {
          content: {
            contains: searchTerm
          }
        },
        select: {
          postId: true
        }
      });

      // 댓글에 키워드가 있는 게시글 ID 수집
      postsWithKeywordInComments = [...new Set(commentsWithKeyword.map(c => c.postId))] as number[];
    }

    // DB에서 게시글 조회
    let posts = await prisma.communityPost.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        authorName: true,
        images: true,
        views: true,
        likes: true,
        comments: true,
        createdAt: true
      }
    });

    // 댓글에 키워드가 있지만 검색 결과에 없는 게시글도 추가
    if (postsWithKeywordInComments.length > 0) {
      const additionalPosts = await prisma.communityPost.findMany({
        where: {
          id: {
            in: postsWithKeywordInComments
          },
          isDeleted: false,
          ...(category && category !== 'all' ? {
            category: category === 'travel-prep' || category === 'schedule' ? 'destination' : category
          } : {})
        },
        select: {
          id: true,
          title: true,
          content: true,
          category: true,
          authorName: true,
          images: true,
          views: true,
          likes: true,
          comments: true,
          createdAt: true
        }
      });

      // 중복 제거 (이미 검색 결과에 있는 게시글 제외)
      const existingIds = new Set(posts.map(p => p.id));
      const newPosts = additionalPosts.filter(p => !existingIds.has(p.id));
      posts = [...posts, ...newPosts];
    }

    // 실제 DB에 있는 포스트만 반환 (샘플 데이터 제거)

    // 날짜 형식 변환 및 이미지 처리
    const formattedPosts = posts.map(post => {
      let images: any[] = [];
      try {
        if (post.images) {
          if (Array.isArray(post.images)) {
            images = post.images;
          } else if (typeof post.images === 'string') {
            images = JSON.parse(post.images);
          } else if (typeof post.images === 'object') {
            images = [post.images];
          }
        }
      } catch (e) {
        console.error('[COMMUNITY POSTS] Error parsing images:', e);
        images = [];
      }
      
      return {
        ...post,
        images: images,
        createdAt: post.createdAt instanceof Date 
          ? post.createdAt.toISOString() 
          : (typeof post.createdAt === 'string' ? post.createdAt : new Date(post.createdAt).toISOString())
      };
    });

    return NextResponse.json({
      ok: true,
      posts: formattedPosts,
      postsWithKeywordInComments: postsWithKeywordInComments || []
    });
  } catch (error: any) {
    console.error('[COMMUNITY POSTS] Error:', error);
    // 에러 발생 시 빈 배열 반환 (샘플 데이터 제거)
    return NextResponse.json({
      ok: true,
      posts: [],
      postsWithKeywordInComments: []
    });
  }
}

// 게시글 작성
export async function POST(req: Request) {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { title, content, category, images } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: '제목과 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 외부 링크 차단
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
    if (urlPattern.test(title) || urlPattern.test(content)) {
      return NextResponse.json(
        { ok: false, error: '외부 링크는 업로드할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 사용자 정보 가져오기
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.userId) },
      select: {
        name: true,
        role: true,
        mallUserId: true
      }
    });

    const normalizedRole = (user?.role || '').toLowerCase();
    const mallUserId = (user?.mallUserId || '').toLowerCase();
    const isAdmin = normalizedRole === 'admin';
    const isAllowedNewsWriter = CRUISEDOT_NEWS_ALLOWED_MALL_IDS.has(mallUserId);
    const canWriteCruisedotNews = isAdmin || isAllowedNewsWriter;

    if (category === 'cruisedot-news' && !canWriteCruisedotNews) {
      return NextResponse.json(
        { ok: false, error: '크루즈닷늬우스는 지정된 본사 계정만 작성할 수 있습니다.' },
        { status: 403 }
      );
    }

    const post = await prisma.communityPost.create({
      data: {
        userId: parseInt(session.userId),
        title: title.trim(),
        content: content.trim(),
        category: category || 'travel-tip',
        images:
          category === 'cruisedot-news'
            ? ['/images/ai-cruise-logo.png']
            : images && Array.isArray(images) && images.length > 0
              ? images
              : null,
        authorName:
          category === 'cruisedot-news'
            ? '크루즈닷'
            : user?.name || KOREAN_NICKNAMES[Math.floor(Math.random() * KOREAN_NICKNAMES.length)]
      }
    });

    // Google Sheets 저장은 배치 작업으로 처리 (1시간마다)
    // 실시간 저장 제거 - /api/batch/sync-to-google에서 처리

    return NextResponse.json({
      ok: true,
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        authorName: post.authorName
      }
    });
  } catch (error: any) {
    console.error('[COMMUNITY POST CREATE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '게시글 작성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 수정
export async function PATCH(req: Request) {
  try {
    const session = await getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, title, content, images } = body ?? {};

    const postId = parseInt(id);
    if (isNaN(postId)) {
      return NextResponse.json(
        { ok: false, error: '수정할 게시글 ID가 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    if (!title || !content) {
      return NextResponse.json(
        { ok: false, error: '제목과 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const existingPost = await prisma.communityPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        userId: true,
        category: true,
        isDeleted: true
      }
    });

    if (!existingPost || existingPost.isDeleted) {
      return NextResponse.json(
        { ok: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.userId) },
      select: {
        role: true,
        mallUserId: true
      }
    });

    const normalizedRole = (user?.role || '').toLowerCase();
    const normalizedMallUserId = (user?.mallUserId || '').toLowerCase();
    const isAdmin = normalizedRole === 'admin';
    const isAllowedNewsWriter = CRUISEDOT_NEWS_ALLOWED_MALL_IDS.has(normalizedMallUserId);
    const isAuthor = existingPost.userId === parseInt(session.userId);

    if (existingPost.category === 'cruisedot-news') {
      if (!(isAdmin || isAllowedNewsWriter)) {
        return NextResponse.json(
          { ok: false, error: '크루즈닷늬우스는 지정된 본사 계정만 수정할 수 있습니다.' },
          { status: 403 }
        );
      }
    } else {
      if (!(isAdmin || isAuthor)) {
        return NextResponse.json(
          { ok: false, error: '게시글을 수정할 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    const updatedPost = await prisma.communityPost.update({
      where: { id: postId },
      data: {
        title: title.trim(),
        content: content.trim(),
        images:
          existingPost.category === 'cruisedot-news'
            ? ['/images/ai-cruise-logo.png']
            : images && Array.isArray(images) && images.length > 0
              ? images
              : undefined
      },
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        authorName: true,
        images: true,
        views: true,
        likes: true,
        comments: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      ok: true,
      post: {
        ...updatedPost,
        createdAt:
          updatedPost.createdAt instanceof Date
            ? updatedPost.createdAt.toISOString()
            : (typeof updatedPost.createdAt === 'string' ? updatedPost.createdAt : new Date(updatedPost.createdAt).toISOString())
      }
    });
  } catch (error: any) {
    console.error('[COMMUNITY POST UPDATE] Error:', error);
    return NextResponse.json(
      { ok: false, error: '게시글 수정에 실패했습니다.' },
      { status: 500 }
    );
  }
}





