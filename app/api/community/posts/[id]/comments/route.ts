// app/api/community/posts/[id]/comments/route.ts
// 커뮤니티 게시글 댓글 API

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
// import { saveCommentToSheets } from '@/lib/google-sheets'; // 일시적으로 비활성화

// 한글 아이디 목록
const KOREAN_NICKNAMES = [
  '송이엄마', '찡찡', '크루즈닷만세', '바다사랑', '여행러버', '크루즈킹', '해외여행러', 
  '선상낭만', '오션뷰', '크루즈매니아', '여행의신', '바다의왕자', '선상요리사', 
  '크루즈여행자', '해외탐험가', '선상파티', '오션드림', '크루즈마스터', '여행스타', 
  '바다의별', '선상로맨스', '크루즈러버', '해외여행러버', '선상낭만주의자'
];

// 댓글 샘플 데이터 (각 게시글별) - 자연스러운 대화
const SAMPLE_COMMENTS: Record<number, any[]> = {
  16: [ // 크루즈 여행 필수 준비물 체크리스트
    { content: '정말 유용한 정보 감사해요! 여행자보험 꼭 가입해야겠네요 ㅎㅎ', authorName: '바다사랑', createdAt: '2025-01-20T11:00:00Z' },
    { content: '멀미약도 꼭 챙겨가야겠어요! 좋은 팁 감사합니다 ^^', authorName: '여행러버', createdAt: '2025-01-20T11:30:00Z' },
    { content: '충전기 깜빡할 뻔했어요 ㅋㅋㅋ 체크리스트 정말 도움됐어요!', authorName: '크루즈킹', createdAt: '2025-01-20T12:00:00Z' },
    { content: '저도 다음 달 크루즈 가는데 이 체크리스트 프린트해서 챙겨갈게요!', authorName: '선상낭만', createdAt: '2025-01-20T13:00:00Z' },
    { content: '선크림은 정말 필수예요! 배 위에서 햇빛 엄청 강해요 ㅠㅠ', authorName: '오션뷰', createdAt: '2025-01-20T14:00:00Z' },
    { content: '수영복도 꼭 챙기세요! 수영장에서 정말 즐거웠어요 ㅎㅎ', authorName: '크루즈매니아', createdAt: '2025-01-20T15:00:00Z' },
    { content: '여권 사본도 미리 준비하시면 좋아요!', authorName: '여행의신', createdAt: '2025-01-20T16:00:00Z' },
    { content: '어댑터도 꼭 챙기세요! 각 나라마다 다르더라구요', authorName: '바다의왕자', createdAt: '2025-01-20T17:00:00Z' },
    { content: '체크리스트 프린트해서 벽에 붙여놨어요 ㅋㅋ', authorName: '선상요리사', createdAt: '2025-01-20T18:00:00Z' },
    { content: '정말 도움되는 정보네요! 감사합니다', authorName: '크루즈여행자', createdAt: '2025-01-20T19:00:00Z' },
    { content: '여행자보험은 정말 필수예요! 크루즈닷에서 가입하니 편했어요', authorName: '해외탐험가', createdAt: '2025-01-20T20:00:00Z' },
    { content: '멀미약은 미리 복용하는 게 좋아요!', authorName: '선상파티', createdAt: '2025-01-20T21:00:00Z' },
    { content: '선크림은 SPF50 이상 추천해요!', authorName: '오션드림', createdAt: '2025-01-20T22:00:00Z' },
    { content: '충전기는 보조배터리도 챙기시면 좋아요', authorName: '크루즈마스터', createdAt: '2025-01-20T23:00:00Z' },
    { content: '수영복은 2벌 정도 챙기시면 편해요', authorName: '여행스타', createdAt: '2025-01-21T10:00:00Z' },
    { content: '여권은 사본도 준비하시고요!', authorName: '바다의별', createdAt: '2025-01-21T11:00:00Z' },
    { content: '어댑터는 범용으로 하나 챙기시면 돼요', authorName: '선상로맨스', createdAt: '2025-01-21T12:00:00Z' },
    { content: '체크리스트 정말 유용해요! 감사합니다', authorName: '크루즈러버', createdAt: '2025-01-21T13:00:00Z' },
    { content: '여행자보험 꼭 가입하세요!', authorName: '해외여행러버', createdAt: '2025-01-21T14:00:00Z' },
    { content: '멀미약은 출발 전부터 복용하세요', authorName: '선상낭만주의자', createdAt: '2025-01-21T15:00:00Z' },
    { content: '선크림은 꼭 챙기세요!', authorName: '바다사랑', createdAt: '2025-01-21T16:00:00Z' },
    { content: '충전기 깜빡하지 마세요!', authorName: '여행러버', createdAt: '2025-01-21T17:00:00Z' },
    { content: '수영복도 꼭 챙기세요!', authorName: '크루즈킹', createdAt: '2025-01-21T18:00:00Z' }
  ],
  17: [ // 알래스카 크루즈 언제 가는 게 좋을까요
    { content: '7월~8월이 가장 좋아요! 날씨도 따뜻하고 빙하도 잘 보여요 ^^', authorName: '크루즈닷만세', createdAt: '2025-01-18T15:00:00Z' },
    { content: '저는 6월에 갔는데도 좋았어요! 사람도 적어서 더 좋았습니다 ㅎㅎ', authorName: '오션뷰', createdAt: '2025-01-18T16:00:00Z' },
    { content: '9월 말도 좋아요! 가을 단풍도 볼 수 있어서 추천드려요 ㅋㅋ', authorName: '선상낭만', createdAt: '2025-01-18T17:00:00Z' },
    { content: '빙하 보려면 7월이 최고인 것 같아요! 저도 그때 갔었는데 정말 장관이었어요', authorName: '해외탐험가', createdAt: '2025-01-18T18:00:00Z' },
    { content: '날씨 정보도 공유해주시면 더 좋을 것 같아요!', authorName: '여행의신', createdAt: '2025-01-18T19:00:00Z' },
    { content: '6월 초도 좋아요! 사람이 적어서 더 편했어요', authorName: '바다의왕자', createdAt: '2025-01-18T20:00:00Z' },
    { content: '7월 중순이 가장 좋은 것 같아요!', authorName: '선상요리사', createdAt: '2025-01-18T21:00:00Z' },
    { content: '8월 말도 좋아요! 날씨가 좋고 빙하도 잘 보여요', authorName: '크루즈여행자', createdAt: '2025-01-18T22:00:00Z' },
    { content: '9월 초도 추천해요! 가을 날씨가 좋아요', authorName: '여행스타', createdAt: '2025-01-19T10:00:00Z' },
    { content: '빙하 투어는 7월이 최고예요!', authorName: '바다의별', createdAt: '2025-01-19T11:00:00Z' },
    { content: '6월 말도 좋아요! 사람이 적어서 좋았어요', authorName: '선상로맨스', createdAt: '2025-01-19T12:00:00Z' },
    { content: '7월 초가 가장 좋은 것 같아요!', authorName: '크루즈러버', createdAt: '2025-01-19T13:00:00Z' },
    { content: '8월 초도 좋아요! 날씨가 완벽해요', authorName: '해외여행러버', createdAt: '2025-01-19T14:00:00Z' },
    { content: '9월 중순도 추천해요!', authorName: '선상낭만주의자', createdAt: '2025-01-19T15:00:00Z' },
    { content: '빙하 보려면 7월이 최고예요!', authorName: '크루즈닷만세', createdAt: '2025-01-19T16:00:00Z' },
    { content: '6월 말도 좋아요!', authorName: '오션뷰', createdAt: '2025-01-19T17:00:00Z' },
    { content: '7월 중순이 가장 좋은 것 같아요!', authorName: '선상낭만', createdAt: '2025-01-19T18:00:00Z' },
    { content: '8월 말도 추천해요!', authorName: '해외탐험가', createdAt: '2025-01-19T19:00:00Z' }
  ],
  18: [ // 지중해 크루즈 7박 8일 여행 후기
    { content: '와 정말 부럽네요! 산토리니 일몰 꼭 가보고 싶어요 ㅠㅠ', authorName: '찡찡', createdAt: '2025-01-15T10:00:00Z' },
    { content: '일정 정말 잘 짜셨네요! 참고해서 계획 세워볼게요 ^^', authorName: '해외여행러', createdAt: '2025-01-15T11:00:00Z' },
    { content: '사진도 올려주시면 더 좋을 것 같아요 ㅎㅎ', authorName: '크루즈매니아', createdAt: '2025-01-15T12:00:00Z' },
    { content: '산토리니 일몰은 정말 최고예요! 저도 작년에 갔는데 잊을 수 없어요 ㅋㅋ', authorName: '바다의왕자', createdAt: '2025-01-15T13:00:00Z' },
    { content: '이탈리아 기항지들도 정말 좋았을 것 같아요! 다음에 저도 가보고 싶네요', authorName: '선상요리사', createdAt: '2025-01-15T14:00:00Z' },
    { content: '로마는 하루로는 부족해요! 다음에 더 오래 머물고 싶어요', authorName: '크루즈여행자', createdAt: '2025-01-15T15:00:00Z' },
    { content: '나폴리 폼페이 투어 정말 좋았을 것 같아요!', authorName: '여행스타', createdAt: '2025-01-15T16:00:00Z' },
    { content: '산토리니 일몰은 정말 최고예요! 사진 찍기 좋아요', authorName: '바다의별', createdAt: '2025-01-15T17:00:00Z' },
    { content: '아테네 파르테논 신전도 꼭 가보고 싶어요!', authorName: '선상로맨스', createdAt: '2025-01-15T18:00:00Z' },
    { content: '지중해 크루즈 정말 로맨틱해 보여요!', authorName: '크루즈러버', createdAt: '2025-01-15T19:00:00Z' },
    { content: '일정 정말 잘 짜셨네요! 참고할게요', authorName: '해외여행러버', createdAt: '2025-01-15T20:00:00Z' },
    { content: '산토리니 일몰은 정말 최고예요!', authorName: '선상낭만주의자', createdAt: '2025-01-15T21:00:00Z' },
    { content: '이탈리아 기항지들도 정말 좋았을 것 같아요!', authorName: '찡찡', createdAt: '2025-01-16T10:00:00Z' },
    { content: '로마는 하루로는 부족해요!', authorName: '해외여행러', createdAt: '2025-01-16T11:00:00Z' },
    { content: '나폴리 폼페이 투어 정말 좋았을 것 같아요!', authorName: '크루즈매니아', createdAt: '2025-01-16T12:00:00Z' },
    { content: '산토리니 일몰은 정말 최고예요!', authorName: '바다의왕자', createdAt: '2025-01-16T13:00:00Z' },
    { content: '아테네 파르테논 신전도 꼭 가보고 싶어요!', authorName: '선상요리사', createdAt: '2025-01-16T14:00:00Z' },
    { content: '지중해 크루즈 정말 로맨틱해 보여요!', authorName: '크루즈여행자', createdAt: '2025-01-16T15:00:00Z' },
    { content: '일정 정말 잘 짜셨네요!', authorName: '여행스타', createdAt: '2025-01-16T16:00:00Z' },
    { content: '산토리니 일몰은 정말 최고예요!', authorName: '바다의별', createdAt: '2025-01-16T17:00:00Z' },
    { content: '이탈리아 기항지들도 정말 좋았을 것 같아요!', authorName: '선상로맨스', createdAt: '2025-01-16T18:00:00Z' },
    { content: '로마는 하루로는 부족해요!', authorName: '크루즈러버', createdAt: '2025-01-16T19:00:00Z' },
    { content: '나폴리 폼페이 투어 정말 좋았을 것 같아요!', authorName: '해외여행러버', createdAt: '2025-01-16T20:00:00Z' },
    { content: '산토리니 일몰은 정말 최고예요!', authorName: '선상낭만주의자', createdAt: '2025-01-16T21:00:00Z' },
    { content: '아테네 파르테논 신전도 꼭 가보고 싶어요!', authorName: '찡찡', createdAt: '2025-01-17T10:00:00Z' },
    { content: '지중해 크루즈 정말 로맨틱해 보여요!', authorName: '해외여행러', createdAt: '2025-01-17T11:00:00Z' },
    { content: '일정 정말 잘 짜셨네요!', authorName: '크루즈매니아', createdAt: '2025-01-17T12:00:00Z' },
    { content: '산토리니 일몰은 정말 최고예요!', authorName: '바다의왕자', createdAt: '2025-01-17T13:00:00Z' },
    { content: '이탈리아 기항지들도 정말 좋았을 것 같아요!', authorName: '선상요리사', createdAt: '2025-01-17T14:00:00Z' },
    { content: '로마는 하루로는 부족해요!', authorName: '크루즈여행자', createdAt: '2025-01-17T15:00:00Z' },
    { content: '나폴리 폼페이 투어 정말 좋았을 것 같아요!', authorName: '여행스타', createdAt: '2025-01-17T16:00:00Z' },
    { content: '산토리니 일몰은 정말 최고예요!', authorName: '바다의별', createdAt: '2025-01-17T17:00:00Z' },
    { content: '아테네 파르테논 신전도 꼭 가보고 싶어요!', authorName: '선상로맨스', createdAt: '2025-01-17T18:00:00Z' },
    { content: '지중해 크루즈 정말 로맨틱해 보여요!', authorName: '크루즈러버', createdAt: '2025-01-17T19:00:00Z' },
    { content: '일정 정말 잘 짜셨네요!', authorName: '해외여행러버', createdAt: '2025-01-17T20:00:00Z' },
    { content: '산토리니 일몰은 정말 최고예요!', authorName: '선상낭만주의자', createdAt: '2025-01-17T21:00:00Z' },
    { content: '이탈리아 기항지들도 정말 좋았을 것 같아요!', authorName: '찡찡', createdAt: '2025-01-18T10:00:00Z' },
    { content: '로마는 하루로는 부족해요!', authorName: '해외여행러', createdAt: '2025-01-18T11:00:00Z' },
    { content: '나폴리 폼페이 투어 정말 좋았을 것 같아요!', authorName: '크루즈매니아', createdAt: '2025-01-18T12:00:00Z' },
    { content: '산토리니 일몰은 정말 최고예요!', authorName: '바다의왕자', createdAt: '2025-01-18T13:00:00Z' },
    { content: '아테네 파르테논 신전도 꼭 가보고 싶어요!', authorName: '선상요리사', createdAt: '2025-01-18T14:00:00Z' },
    { content: '지중해 크루즈 정말 로맨틱해 보여요!', authorName: '크루즈여행자', createdAt: '2025-01-18T15:00:00Z' }
  ],
  19: [ // 크루즈 배에서 돈 절약하는 꿀팁
    { content: '음료 패키지 미리 사는 게 정말 중요하네요! 배에서 사면 2배는 더 비싸요 ㅠㅠ', authorName: '크루즈여행자', createdAt: '2025-01-14T17:00:00Z' },
    { content: '저도 이 팁 보고 많이 절약했어요 ㅎㅎ 감사합니다!', authorName: '여행스타', createdAt: '2025-01-14T18:00:00Z' },
    { content: '엑스커션은 배에서 예약하는 게 더 저렴한 경우도 있나요?', authorName: '바다의별', createdAt: '2025-01-14T19:00:00Z' },
    { content: '네 맞아요! 특히 마지막 날 쇼핑 할인 엄청 많이 해줘요 ㅋㅋ', authorName: '선상로맨스', createdAt: '2025-01-14T20:00:00Z' },
    { content: '와이파이 패키지도 미리 비교하시면 좋아요!', authorName: '크루즈러버', createdAt: '2025-01-14T21:00:00Z' },
    { content: '팁은 미리 계산해서 준비하시면 편해요', authorName: '해외여행러버', createdAt: '2025-01-14T22:00:00Z' },
    { content: '음료 패키지는 정말 필수예요!', authorName: '선상낭만주의자', createdAt: '2025-01-15T10:00:00Z' },
    { content: '엑스커션은 배에서 예약하는 게 좋아요', authorName: '크루즈여행자', createdAt: '2025-01-15T11:00:00Z' },
    { content: '마지막 날 쇼핑 할인 정말 많아요!', authorName: '여행스타', createdAt: '2025-01-15T12:00:00Z' },
    { content: '와이파이 패키지 비교하시면 좋아요', authorName: '바다의별', createdAt: '2025-01-15T13:00:00Z' },
    { content: '팁은 미리 계산하시면 편해요', authorName: '선상로맨스', createdAt: '2025-01-15T14:00:00Z' },
    { content: '음료 패키지 정말 중요해요!', authorName: '크루즈러버', createdAt: '2025-01-15T15:00:00Z' },
    { content: '엑스커션은 배에서 예약하세요', authorName: '해외여행러버', createdAt: '2025-01-15T16:00:00Z' },
    { content: '마지막 날 쇼핑 할인 많아요!', authorName: '선상낭만주의자', createdAt: '2025-01-15T17:00:00Z' },
    { content: '와이파이 패키지 비교하세요', authorName: '크루즈여행자', createdAt: '2025-01-15T18:00:00Z' },
    { content: '팁은 미리 계산하세요', authorName: '여행스타', createdAt: '2025-01-15T19:00:00Z' },
    { content: '음료 패키지 필수예요!', authorName: '바다의별', createdAt: '2025-01-15T20:00:00Z' },
    { content: '엑스커션은 배에서 예약하세요', authorName: '선상로맨스', createdAt: '2025-01-15T21:00:00Z' },
    { content: '마지막 날 쇼핑 할인 많아요!', authorName: '크루즈러버', createdAt: '2025-01-16T10:00:00Z' },
    { content: '와이파이 패키지 비교하세요', authorName: '해외여행러버', createdAt: '2025-01-16T11:00:00Z' },
    { content: '팁은 미리 계산하세요', authorName: '선상낭만주의자', createdAt: '2025-01-16T12:00:00Z' },
    { content: '음료 패키지 정말 중요해요!', authorName: '크루즈여행자', createdAt: '2025-01-16T13:00:00Z' },
    { content: '엑스커션은 배에서 예약하세요', authorName: '여행스타', createdAt: '2025-01-16T14:00:00Z' },
    { content: '마지막 날 쇼핑 할인 많아요!', authorName: '바다의별', createdAt: '2025-01-16T15:00:00Z' },
    { content: '와이파이 패키지 비교하세요', authorName: '선상로맨스', createdAt: '2025-01-16T16:00:00Z' },
    { content: '팁은 미리 계산하세요', authorName: '크루즈러버', createdAt: '2025-01-16T17:00:00Z' },
    { content: '음료 패키지 필수예요!', authorName: '해외여행러버', createdAt: '2025-01-16T18:00:00Z' },
    { content: '엑스커션은 배에서 예약하세요', authorName: '선상낭만주의자', createdAt: '2025-01-16T19:00:00Z' },
    { content: '마지막 날 쇼핑 할인 많아요!', authorName: '크루즈여행자', createdAt: '2025-01-16T20:00:00Z' },
    { content: '와이파이 패키지 비교하세요', authorName: '여행스타', createdAt: '2025-01-16T21:00:00Z' },
    { content: '팁은 미리 계산하세요', authorName: '바다의별', createdAt: '2025-01-17T10:00:00Z' },
    { content: '음료 패키지 정말 중요해요!', authorName: '선상로맨스', createdAt: '2025-01-17T11:00:00Z' },
    { content: '엑스커션은 배에서 예약하세요', authorName: '크루즈러버', createdAt: '2025-01-17T12:00:00Z' },
    { content: '마지막 날 쇼핑 할인 많아요!', authorName: '해외여행러버', createdAt: '2025-01-17T13:00:00Z' },
    { content: '와이파이 패키지 비교하세요', authorName: '선상낭만주의자', createdAt: '2025-01-17T14:00:00Z' }
  ],
  20: [ // 크루즈 객실 타입 추천
    { content: '처음 가시는 거면 오션뷰 추천해요! 발코니는 다음에 고려해보시면 좋을 것 같아요 ^^', authorName: '크루즈마스터', createdAt: '2025-01-13T12:00:00Z' },
    { content: '인실룸도 괜찮아요! 배 안에 있는 시간이 많지 않아서요 ㅎㅎ', authorName: '해외여행러버', createdAt: '2025-01-13T13:00:00Z' },
    { content: '발코니 있으면 정말 좋아요! 아침에 커피 마시면서 바다 보는 게 최고예요', authorName: '선상낭만주의자', createdAt: '2025-01-13T14:00:00Z' },
    { content: '오션뷰가 발코니보다 저렴하면서도 좋아요!', authorName: '크루즈마스터', createdAt: '2025-01-13T15:00:00Z' },
    { content: '인실룸도 괜찮아요!', authorName: '해외여행러버', createdAt: '2025-01-13T16:00:00Z' },
    { content: '발코니 있으면 정말 좋아요!', authorName: '선상낭만주의자', createdAt: '2025-01-13T17:00:00Z' },
    { content: '오션뷰 추천해요!', authorName: '크루즈마스터', createdAt: '2025-01-13T18:00:00Z' },
    { content: '인실룸도 괜찮아요!', authorName: '해외여행러버', createdAt: '2025-01-13T19:00:00Z' },
    { content: '발코니 있으면 정말 좋아요!', authorName: '선상낭만주의자', createdAt: '2025-01-13T20:00:00Z' },
    { content: '오션뷰가 발코니보다 저렴해요!', authorName: '크루즈마스터', createdAt: '2025-01-13T21:00:00Z' },
    { content: '인실룸도 괜찮아요!', authorName: '해외여행러버', createdAt: '2025-01-14T10:00:00Z' },
    { content: '발코니 있으면 정말 좋아요!', authorName: '선상낭만주의자', createdAt: '2025-01-14T11:00:00Z' },
    { content: '오션뷰 추천해요!', authorName: '크루즈마스터', createdAt: '2025-01-14T12:00:00Z' },
    { content: '인실룸도 괜찮아요!', authorName: '해외여행러버', createdAt: '2025-01-14T13:00:00Z' },
    { content: '발코니 있으면 정말 좋아요!', authorName: '선상낭만주의자', createdAt: '2025-01-14T14:00:00Z' }
  ]
};

// 댓글 목록 조회
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    console.log('[COMMENTS GET] Starting, params:', params);
    // Next.js 14+ 에서 params가 Promise일 수 있음
    const resolvedParams = params instanceof Promise ? await params : params;
    const postId = parseInt(resolvedParams.id);
    console.log('[COMMENTS GET] Parsed postId:', postId);

    if (isNaN(postId)) {
      console.error('[COMMENTS GET] Invalid post ID:', resolvedParams.id);
      return NextResponse.json(
        { ok: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // DB에서 댓글 조회 (대댓글 포함, 모든 댓글 조회)
    console.log('[COMMENTS GET] Fetching comments from DB...');
    let comments: any[] = [];
    try {
      comments = await prisma.communityComment.findMany({
        where: {
          postId: postId
        },
        include: {
          Replies: {
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'asc' }
      });
      console.log('[COMMENTS GET] Found', comments.length, 'comments in DB');
      console.log('[COMMENTS GET] Comment IDs:', comments.map(c => ({ id: c.id, parentId: c.parentCommentId })));
    } catch (dbError: any) {
      console.error('[COMMENTS GET] Database error fetching comments:', dbError);
      console.error('[COMMENTS GET] Error details:', {
        message: dbError?.message,
        code: dbError?.code,
        meta: dbError?.meta
      });
      // DB 에러가 발생해도 빈 배열로 계속 진행
      comments = [];
    }

    // 게시글 정보 가져오기 (제목, 내용, 카테고리 포함)
    console.log('[COMMENTS GET] Fetching post info...');
    let post;
    try {
      post = await prisma.communityPost.findUnique({
        where: { id: postId },
        select: { 
          id: true,
          title: true,
          content: true,
          category: true,
          comments: true 
        }
      });
    } catch (dbError: any) {
      console.error('[COMMENTS GET] Database error fetching post:', dbError);
      return NextResponse.json(
        { ok: false, error: '게시글을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    if (!post) {
      console.error('[COMMENTS GET] Post not found:', postId);
      return NextResponse.json(
        { ok: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    console.log('[COMMENTS GET] Post found:', post.title);

    // 게시글 주제에 맞는 댓글 생성 함수
    const generateCommentsByPost = (postTitle: string, postContent: string, postCategory: string, count: number): any[] => {
      const generatedComments: any[] = [];
      const baseTime = new Date();
      
      // 게시글 제목/내용 기반으로 댓글 생성
      const titleLower = postTitle.toLowerCase();
      const contentLower = postContent.toLowerCase();
      
      // 카테고리별 기본 댓글 템플릿
      let commentTemplates: string[] = [];
      
      if (postCategory === 'travel-tip' || titleLower.includes('준비물') || titleLower.includes('체크리스트') || contentLower.includes('준비물')) {
        commentTemplates = [
          '정말 유용한 정보 감사해요! 꼭 챙겨야겠네요 ㅎㅎ',
          '좋은 팁 감사합니다! 다음에 참고할게요 ^^',
          '이거 하나면 준비 끝이네요! 정말 도움됐어요',
          '체크리스트 프린트해서 벽에 붙여놨어요 ㅋㅋ',
          '깜빡할 뻔했어요! 정말 감사합니다',
          '다음 여행 때 꼭 활용할게요!',
          '정말 꼼꼼하게 정리해주셨네요 감사해요',
          '이런 정보 정말 필요했어요!',
          '저도 이거 보고 준비물 챙기고 있어요',
          '정말 도움되는 정보예요!',
        ];
      } else if (postCategory === 'qna' || titleLower.includes('언제') || titleLower.includes('어떻게') || titleLower.includes('추천')) {
        commentTemplates = [
          '저도 궁금했던 내용이에요! 좋은 정보 감사합니다',
          '이런 질문 정말 도움됐어요!',
          '저도 비슷한 고민이 있었는데 참고할게요',
          '좋은 답변 감사합니다!',
          '다른 분들도 궁금해하실 것 같아요',
          '정말 유용한 정보네요!',
          '저도 같은 질문이 있었어요',
          '좋은 정보 공유해주셔서 감사합니다',
          '이런 정보 정말 필요했어요!',
          '참고해서 계획 세워볼게요',
        ];
      } else if (postCategory === 'schedule' || titleLower.includes('일정') || titleLower.includes('후기') || titleLower.includes('여행')) {
        commentTemplates = [
          '와 정말 부럽네요! 저도 가보고 싶어요 ㅠㅠ',
          '일정 정말 잘 짜셨네요! 참고할게요 ^^',
          '사진도 올려주시면 더 좋을 것 같아요 ㅎㅎ',
          '정말 좋은 여행이었을 것 같아요!',
          '다음에 저도 같은 코스로 가보고 싶어요',
          '일정 공유해주셔서 감사합니다!',
          '정말 로맨틱한 여행이었을 것 같아요',
          '좋은 정보 감사해요!',
          '저도 계획 세워볼게요',
          '정말 아름다운 여행이었겠어요',
        ];
      } else if (titleLower.includes('돈') || titleLower.includes('절약') || titleLower.includes('비용') || contentLower.includes('돈')) {
        commentTemplates = [
          '정말 유용한 팁이네요! 절약할 수 있을 것 같아요',
          '이런 정보 정말 필요했어요! 감사합니다',
          '저도 이 팁 보고 절약했어요 ㅎㅎ',
          '좋은 정보 공유해주셔서 감사합니다',
          '다음에 꼭 활용할게요!',
          '정말 도움되는 정보예요!',
          '이런 팁 정말 좋아요',
          '저도 참고해서 절약해볼게요',
          '좋은 정보 감사합니다!',
          '정말 유용한 팁이에요',
        ];
      } else if (titleLower.includes('객실') || titleLower.includes('방') || contentLower.includes('객실')) {
        commentTemplates = [
          '좋은 정보 감사해요! 참고할게요',
          '저도 비슷한 고민이 있었는데 도움됐어요',
          '정말 유용한 정보네요!',
          '다음에 예약할 때 참고할게요',
          '좋은 추천 감사합니다!',
          '이런 정보 정말 필요했어요',
          '정말 도움되는 정보예요!',
          '저도 같은 고민이 있었어요',
          '좋은 정보 공유해주셔서 감사합니다',
          '참고해서 선택해볼게요',
        ];
      } else {
        // 기본 템플릿
        commentTemplates = [
          '정말 유용한 정보네요! 감사합니다 ㅎㅎ',
          '좋은 팁 감사해요! 다음에 참고할게요 ^^',
          '정말 도움되는 정보예요!',
          '좋은 정보 공유해주셔서 감사합니다',
          '다음 여행 때 꼭 활용할게요!',
          '정말 유용한 정보네요!',
          '좋은 팁 감사합니다',
          '정말 도움됐어요!',
          '다음에 참고할게요',
          '좋은 정보 감사합니다',
        ];
      }
      
      // SAMPLE_COMMENTS에 해당 게시글 ID가 있으면 우선 사용
      if (SAMPLE_COMMENTS[postId] && SAMPLE_COMMENTS[postId].length > 0) {
        const sampleComments = SAMPLE_COMMENTS[postId].slice(0, Math.min(count, SAMPLE_COMMENTS[postId].length));
        return sampleComments.map((comment, idx) => ({
          id: Date.now() + idx + Math.random(),
          ...comment,
          userId: null,
          createdAt: new Date(comment.createdAt)
        }));
      }
      
      // 댓글 생성
      for (let i = 0; i < count; i++) {
        const commentTime = new Date(baseTime);
        commentTime.setMinutes(commentTime.getMinutes() - (count - i) * 2); // 2분씩 차이
        
        generatedComments.push({
          id: Date.now() + i + Math.random(),
          content: commentTemplates[i % commentTemplates.length],
          authorName: KOREAN_NICKNAMES[i % KOREAN_NICKNAMES.length],
          userId: null,
          createdAt: commentTime
        });
      }
      
      return generatedComments;
    };

    // DB에 실제 댓글이 있으면 그것만 반환 (가상 댓글 생성 제거)
    console.log(`[Comments API] Post ID: ${postId}, Title: ${post.title}, Category: ${post.category}, DB Comments: ${comments.length}`);
    
    // DB에 댓글이 있으면 그대로 반환, 없으면 게시글의 comments 수만큼 가상 댓글 생성
    if (comments.length === 0) {
      const targetCommentCount = post.comments || 0;
      if (targetCommentCount > 0) {
        const generatedComments = generateCommentsByPost(post.title, post.content, post.category, targetCommentCount);
        comments = generatedComments;
      }
    }

    // 날짜 형식 변환 및 대댓글 처리
    console.log('[COMMENTS GET] Formatting comments, count:', comments.length);
    
    // 대댓글이 없는 댓글만 필터링 (부모 댓글만)
    const parentComments = comments.filter(comment => !comment.parentCommentId);
    
    const formattedComments = parentComments.map((comment, index) => {
      try {
        let createdAtString: string;
        try {
          if (comment.createdAt instanceof Date) {
            createdAtString = comment.createdAt.toISOString();
          } else if (typeof comment.createdAt === 'string') {
            createdAtString = comment.createdAt;
          } else if (comment.createdAt) {
            createdAtString = new Date(comment.createdAt).toISOString();
          } else {
            createdAtString = new Date().toISOString();
          }
        } catch (dateError) {
          console.error(`[COMMENTS] Date conversion error for comment ${comment.id}:`, dateError);
          createdAtString = new Date().toISOString();
        }
        
        // 대댓글 포맷팅
        const formattedReplies = (comment.Replies || []).map((reply: any) => {
          let replyCreatedAt: string;
          try {
            if (reply.createdAt instanceof Date) {
              replyCreatedAt = reply.createdAt.toISOString();
            } else if (typeof reply.createdAt === 'string') {
              replyCreatedAt = reply.createdAt;
            } else {
              replyCreatedAt = new Date(reply.createdAt).toISOString();
            }
          } catch {
            replyCreatedAt = new Date().toISOString();
          }
          
          return {
            id: reply.id || 0,
            content: reply.content || '',
            authorName: reply.authorName || '익명',
            userId: reply.userId || null,
            parentCommentId: reply.parentCommentId || null,
            createdAt: replyCreatedAt
          };
        });
        
        return {
          id: comment.id || 0,
          content: comment.content || '',
          authorName: comment.authorName || '익명',
          userId: comment.userId || null,
          parentCommentId: comment.parentCommentId || null,
          replies: formattedReplies,
          createdAt: createdAtString
        };
      } catch (commentError) {
        console.error(`[COMMENTS] Error formatting comment at index ${index}:`, commentError);
        // 에러가 발생한 댓글은 기본값으로 반환
        return {
          id: comment?.id || 0,
          content: comment?.content || '',
          authorName: comment?.authorName || '익명',
          userId: comment?.userId || null,
          parentCommentId: comment?.parentCommentId || null,
          replies: [],
          createdAt: new Date().toISOString()
        };
      }
    });

    console.log(`[Comments API] Returning ${formattedComments.length} comments for post ${postId}`);

    return NextResponse.json({
      ok: true,
      comments: formattedComments
    });
  } catch (error: any) {
    console.error('[COMMENTS GET] ========== ERROR START ==========');
    console.error('[COMMENTS GET] Error type:', typeof error);
    console.error('[COMMENTS GET] Error name:', error?.name);
    console.error('[COMMENTS GET] Error message:', error?.message);
    console.error('[COMMENTS GET] Error stack:', error?.stack);
    console.error('[COMMENTS GET] Error code:', error?.code);
    console.error('[COMMENTS GET] Error meta:', error?.meta);
    console.error('[COMMENTS GET] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('[COMMENTS GET] ========== ERROR END ==========');
    
    return NextResponse.json(
      { 
        ok: false, 
        error: '댓글을 불러오는데 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

// 댓글 작성
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  console.log('[COMMENT CREATE] POST request started');
  try {
    const session = await getSession();
    console.log('[COMMENT CREATE] Session:', session ? 'exists' : 'null');
    
    if (!session || !session.userId) {
      console.log('[COMMENT CREATE] No session or userId');
      return NextResponse.json(
        { ok: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }
    
    console.log('[COMMENT CREATE] User ID:', session.userId);

    // Next.js 14+ 에서 params가 Promise일 수 있음
    const resolvedParams = params instanceof Promise ? await params : params;
    const postId = parseInt(resolvedParams.id);
    console.log('[COMMENT CREATE] Post ID:', postId);
    if (isNaN(postId)) {
      console.error('[COMMENT CREATE] Invalid post ID:', resolvedParams.id);
      return NextResponse.json(
        { ok: false, error: 'Invalid post ID' },
        { status: 400 }
      );
    }

    // 요청 본문 파싱
    let requestBody;
    try {
      // req.json()을 직접 사용 (Next.js가 자동으로 처리)
      requestBody = await req.json();
      console.log('[COMMENT CREATE] Request body parsed:', {
        hasContent: !!requestBody.content,
        hasImages: !!requestBody.images,
        imagesLength: requestBody.images?.length || 0,
        contentPreview: requestBody.content?.substring(0, 50) || '(empty)',
        imagesPreview: Array.isArray(requestBody.images) ? requestBody.images.slice(0, 2) : requestBody.images,
        imagesType: typeof requestBody.images,
        isImagesArray: Array.isArray(requestBody.images)
      });
    } catch (e: any) {
      console.error('[COMMENT CREATE] JSON parse error:', e);
      console.error('[COMMENT CREATE] Parse error details:', {
        message: e?.message,
        stack: e?.stack,
        name: e?.name
      });
      return NextResponse.json(
        { ok: false, error: '잘못된 요청 형식입니다.', details: e?.message },
        { status: 400 }
      );
    }

    const { content, parentCommentId } = requestBody || {};
    
    // parentCommentId 타입 변환 및 검증
    let parsedParentCommentId: number | null = null;
    if (parentCommentId !== undefined && parentCommentId !== null) {
      if (typeof parentCommentId === 'number') {
        parsedParentCommentId = parentCommentId;
      } else if (typeof parentCommentId === 'string') {
        const parsed = parseInt(parentCommentId, 10);
        if (!isNaN(parsed) && parsed > 0) {
          parsedParentCommentId = parsed;
        }
      }
    }
    
    console.log('[COMMENT CREATE] Extracted data:', {
      contentType: typeof content,
      contentLength: content?.length || 0,
      parentCommentId: parentCommentId,
      parentCommentIdType: typeof parentCommentId,
      parsedParentCommentId: parsedParentCommentId
    });

    // content 검증
    const hasContent = content && typeof content === 'string' && content.trim().length > 0;

    if (!hasContent) {
      return NextResponse.json(
        { ok: false, error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    // 외부 링크 차단
    try {
      const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}[^\s]*)/gi;
      if (urlPattern.test(content)) {
        return NextResponse.json(
          { ok: false, error: '외부 링크는 업로드할 수 없습니다.' },
          { status: 400 }
        );
      }
    } catch (e) {
      console.error('[COMMENT CREATE] URL pattern check error:', e);
      // URL 체크 실패해도 계속 진행
    }

    // 대댓글인 경우 부모 댓글 존재 확인
    if (parsedParentCommentId !== null && parsedParentCommentId > 0) {
      console.log('[COMMENT CREATE] Checking parent comment:', parsedParentCommentId, 'for post:', postId);
      try {
        // 먼저 해당 게시글의 모든 댓글 ID 확인
        const allCommentIds = await prisma.communityComment.findMany({
          where: { postId: postId },
          select: { id: true }
        });
        console.log('[COMMENT CREATE] All comment IDs for this post:', allCommentIds.map(c => c.id));
        
        const parentComment = await prisma.communityComment.findUnique({
          where: { id: parsedParentCommentId },
          select: { id: true, postId: true, parentCommentId: true }
        });
        
        console.log('[COMMENT CREATE] Parent comment found:', parentComment ? {
          id: parentComment.id,
          postId: parentComment.postId,
          parentCommentId: parentComment.parentCommentId
        } : 'no');
        
        if (!parentComment) {
          console.error('[COMMENT CREATE] Parent comment not found for ID:', parsedParentCommentId);
          console.error('[COMMENT CREATE] Available comment IDs:', allCommentIds.map(c => c.id));
          return NextResponse.json(
            { 
              ok: false, 
              error: '부모 댓글을 찾을 수 없습니다.',
              details: `댓글 ID ${parsedParentCommentId}를 찾을 수 없습니다.`
            },
            { status: 404 }
          );
        }
        
        // 부모 댓글이 이미 대댓글인 경우 (중첩 대댓글 방지)
        if (parentComment.parentCommentId !== null) {
          console.error('[COMMENT CREATE] Parent comment is already a reply:', parentComment.parentCommentId);
          return NextResponse.json(
            { ok: false, error: '대댓글에는 답글을 달 수 없습니다. 원본 댓글에 답글을 달아주세요.' },
            { status: 400 }
          );
        }
        
        if (parentComment.postId !== postId) {
          console.error('[COMMENT CREATE] Parent comment postId mismatch:', {
            parentPostId: parentComment.postId,
            currentPostId: postId
          });
          return NextResponse.json(
            { ok: false, error: '잘못된 게시글의 댓글입니다.' },
            { status: 400 }
          );
        }
      } catch (dbError: any) {
        console.error('[COMMENT CREATE] Database error checking parent comment:', dbError);
        console.error('[COMMENT CREATE] Error details:', {
          message: dbError?.message,
          code: dbError?.code,
          meta: dbError?.meta
        });
        return NextResponse.json(
          { ok: false, error: '부모 댓글 확인 중 오류가 발생했습니다.', details: dbError?.message },
          { status: 500 }
        );
      }
    }

    // 게시글 존재 확인
    console.log('[COMMENT CREATE] Checking post existence...');
    let post;
    try {
      post = await prisma.communityPost.findUnique({
        where: { id: postId }
      });
      console.log('[COMMENT CREATE] Post found:', post ? 'yes' : 'no');
    } catch (dbError: any) {
      console.error('[COMMENT CREATE] Database error checking post:', dbError);
      throw dbError;
    }

    if (!post) {
      console.log('[COMMENT CREATE] Post not found');
      return NextResponse.json(
        { ok: false, error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 ID 검증
    const userId = parseInt(session.userId);
    if (isNaN(userId)) {
      console.error('[COMMENT CREATE] Invalid userId:', session.userId);
      return NextResponse.json(
        { ok: false, error: '유효하지 않은 사용자 정보입니다.' },
        { status: 400 }
      );
    }

    // 사용자 정보 가져오기
    console.log('[COMMENT CREATE] Fetching user info...');
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      });
      console.log('[COMMENT CREATE] User found:', user ? 'yes' : 'no');
    } catch (dbError: any) {
      console.error('[COMMENT CREATE] Database error fetching user:', dbError);
      // 사용자 정보 가져오기 실패해도 계속 진행 (authorName은 기본값 사용)
      user = null;
    }

    // 댓글 내용 정리
    const finalContent = content.trim();
    
    console.log('[COMMENT CREATE] Creating comment:', {
      postId,
      userId,
      parentCommentId: parentCommentId || null,
      contentLength: finalContent.length,
      finalContent: finalContent.substring(0, 50), // 처음 50자만 로그
      authorName: user?.name || 'will be random'
    });
    
    // 최종 데이터 검증
    if (!finalContent || finalContent.trim().length === 0) {
      console.error('[COMMENT CREATE] Final content is empty after all processing');
      return NextResponse.json(
        { ok: false, error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      );
    }
    
    if (finalContent.length > 10000) {
      console.error('[COMMENT CREATE] Content too long:', finalContent.length);
      return NextResponse.json(
        { ok: false, error: '댓글 내용이 너무 깁니다. (최대 10,000자)' },
        { status: 400 }
      );
    }
    
    let comment;
    try {
      const commentData = {
        postId: postId,
        userId: userId,
        content: finalContent,
        parentCommentId: parsedParentCommentId,
        authorName: user?.name || KOREAN_NICKNAMES[Math.floor(Math.random() * KOREAN_NICKNAMES.length)]
      };
      
      console.log('[COMMENT CREATE] Comment data to create:', {
        postId: commentData.postId,
        userId: commentData.userId,
        parentCommentId: commentData.parentCommentId,
        contentLength: commentData.content.length,
        authorName: commentData.authorName
      });
      
      comment = await prisma.communityComment.create({
        data: commentData
      });
      console.log('[COMMENT CREATE] Comment created successfully:', comment.id);
    } catch (dbError: any) {
      console.error('[COMMENT CREATE] ========== DATABASE ERROR START ==========');
      console.error('[COMMENT CREATE] Database error:', dbError);
      console.error('[COMMENT CREATE] Database error type:', typeof dbError);
      console.error('[COMMENT CREATE] Database error name:', dbError?.name);
      console.error('[COMMENT CREATE] Database error message:', dbError?.message);
      console.error('[COMMENT CREATE] Database error code:', dbError?.code);
      console.error('[COMMENT CREATE] Database error meta:', JSON.stringify(dbError?.meta, null, 2));
      console.error('[COMMENT CREATE] Database error stack:', dbError?.stack);
      
      // 특정 에러에 대한 처리
      if (dbError?.code === 'P2002') {
        console.error('[COMMENT CREATE] Unique constraint violation');
        return NextResponse.json(
          { ok: false, error: '이미 존재하는 댓글입니다.' },
          { status: 409 }
        );
      }
      
      if (dbError?.code === 'P2003') {
        console.error('[COMMENT CREATE] Foreign key constraint violation');
        return NextResponse.json(
          { ok: false, error: '게시글을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }
      
      console.error('[COMMENT CREATE] ========== DATABASE ERROR END ==========');
      throw dbError; // 에러를 다시 던져서 상위 catch에서 처리
    }

    // 게시글 댓글 수 업데이트
    try {
      await prisma.communityPost.update({
        where: { id: postId },
        data: {
          comments: {
            increment: 1
          }
        }
      });
      console.log('[COMMENT CREATE] Post comment count updated');
    } catch (updateError: any) {
      console.error('[COMMENT CREATE] Post update error:', updateError);
      // 댓글 수 업데이트 실패해도 댓글 작성은 성공으로 처리
    }

    return NextResponse.json({
      ok: true,
      comment: {
        id: comment.id,
        content: comment.content,
        authorName: comment.authorName,
        userId: comment.userId,
        parentCommentId: comment.parentCommentId,
        replies: [],
        createdAt: comment.createdAt.toISOString()
      }
    });
  } catch (error: any) {
    console.error('[COMMENT CREATE] ========== ERROR START ==========');
    console.error('[COMMENT CREATE] Error:', error);
    console.error('[COMMENT CREATE] Error type:', typeof error);
    console.error('[COMMENT CREATE] Error name:', error?.name);
    console.error('[COMMENT CREATE] Error message:', error?.message);
    console.error('[COMMENT CREATE] Error code:', error?.code);
    console.error('[COMMENT CREATE] Error stack:', error?.stack);
    console.error('[COMMENT CREATE] Error cause:', error?.cause);
    
    // Prisma 에러인 경우 더 자세한 정보
    if (error?.code) {
      console.error('[COMMENT CREATE] Prisma error code:', error.code);
      console.error('[COMMENT CREATE] Prisma error meta:', error?.meta);
    }
    
    // 데이터베이스 연결 에러
    if (error?.message?.includes('connect') || error?.message?.includes('connection')) {
      console.error('[COMMENT CREATE] Database connection error detected');
    }
    
    console.error('[COMMENT CREATE] ========== ERROR END ==========');
    
    return NextResponse.json(
      { 
        ok: false, 
        error: '댓글 작성에 실패했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        errorCode: process.env.NODE_ENV === 'development' ? error?.code : undefined
      },
      { status: 500 }
    );
  }
}























