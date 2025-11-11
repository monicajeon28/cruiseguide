// app/api/batch/sync-to-google/route.ts
// 1시간마다 실행되는 배치 작업: 최근 1시간 동안 작성된 데이터를 Google Sheets/Drive에 저장

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { 
  saveReviewToSheets, 
  savePostToSheets, 
  saveCommentToSheets,
  uploadReviewImageToDrive,
  uploadPostImageToDrive,
  uploadCommentImageToDrive
} from '@/lib/google-sheets';
import { readFile } from 'fs/promises';
import { join } from 'path';

// 배치 작업 실행 (1시간마다 호출)
export async function POST(req: Request) {
  try {
    // 보안: API 키 또는 환경 변수로 인증 (선택사항)
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.BATCH_SYNC_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 쿼리 파라미터로 전체 동기화 옵션 확인
    const url = new URL(req.url);
    const syncAll = url.searchParams.get('all') === 'true';
    
    let oneHourAgo: Date;
    let now = new Date();
    
    if (syncAll) {
      // 전체 데이터 동기화: 10년 전부터 현재까지
      oneHourAgo = new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000);
      console.log('[BATCH SYNC] Starting FULL sync to Google Sheets/Drive (all data)');
    } else {
      // 최근 1시간 데이터만 동기화
      oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      console.log('[BATCH SYNC] Starting sync to Google Sheets/Drive (last 1 hour)');
    }
    
    console.log('[BATCH SYNC] Time range:', oneHourAgo.toISOString(), 'to', now.toISOString());

    let syncedCount = {
      reviews: 0,
      posts: 0,
      comments: 0,
      images: 0,
      errors: 0
    };

    // 1. 최근 1시간 동안 작성된 리뷰 동기화
    try {
      const recentReviews = await prisma.cruiseReview.findMany({
        where: {
          createdAt: {
            gte: oneHourAgo,
            lte: now
          },
          isDeleted: false
        },
        orderBy: { createdAt: 'asc' }
      });

      console.log(`[BATCH SYNC] Found ${recentReviews.length} reviews to sync`);

      for (const review of recentReviews) {
        try {
          // 이미지 URL 배열 파싱
          let imageUrls: string[] = [];
          if (review.images) {
            if (typeof review.images === 'string') {
              try {
                imageUrls = JSON.parse(review.images);
              } catch {
                imageUrls = [review.images];
              }
            } else if (Array.isArray(review.images)) {
              imageUrls = review.images;
            }
          }

          // Google Sheets에 저장
          await saveReviewToSheets({
            id: review.id,
            title: review.title || '',
            content: review.content || '',
            rating: review.rating || 5,
            cruiseLine: review.cruiseLine || null,
            shipName: review.shipName || null,
            authorName: review.authorName || null,
            travelDate: review.travelDate ? review.travelDate.toISOString().split('T')[0] : null,
            createdAt: review.createdAt.toISOString(),
            imageUrls: imageUrls
          });

          // 이미지를 Google Drive에 업로드 (로컬 파일인 경우)
          for (const imageUrl of imageUrls) {
            // /uploads/ 또는 /크루즈정보사진/ 경로 체크
            if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/크루즈정보사진/')) {
              try {
                const filePath = join(process.cwd(), 'public', imageUrl);
                const buffer = await readFile(filePath);
                const filename = imageUrl.split('/').pop() || 'image.jpg';
                const result = await uploadReviewImageToDrive(buffer, filename, 'image/jpeg');
                if (result.ok) {
                  syncedCount.images++;
                  console.log(`[BATCH SYNC] Review image uploaded to Drive: ${result.url}`);
                } else {
                  console.warn(`[BATCH SYNC] Review image upload failed: ${result.error}`);
                }
              } catch (error: any) {
                console.error(`[BATCH SYNC] Error uploading review image ${imageUrl}:`, error?.message || error);
              }
            } else {
              console.log(`[BATCH SYNC] Skipping non-local image URL: ${imageUrl}`);
            }
          }

          syncedCount.reviews++;
        } catch (error) {
          console.error(`[BATCH SYNC] Error syncing review ${review.id}:`, error);
          syncedCount.errors++;
        }
      }
    } catch (error) {
      console.error('[BATCH SYNC] Error fetching reviews:', error);
      syncedCount.errors++;
    }

    // 2. 최근 1시간 동안 작성된 게시글 동기화
    try {
      const recentPosts = await prisma.communityPost.findMany({
        where: {
          createdAt: {
            gte: oneHourAgo,
            lte: now
          },
          isDeleted: false
        },
        orderBy: { createdAt: 'asc' }
      });

      console.log(`[BATCH SYNC] Found ${recentPosts.length} posts to sync`);

      for (const post of recentPosts) {
        try {
          // 이미지 URL 배열 파싱
          let imageUrls: string[] = [];
          if (post.images) {
            if (typeof post.images === 'string') {
              try {
                imageUrls = JSON.parse(post.images);
              } catch {
                imageUrls = [post.images];
              }
            } else if (Array.isArray(post.images)) {
              imageUrls = post.images;
            }
          }

          // Google Sheets에 저장
          await savePostToSheets({
            id: post.id,
            title: post.title || '',
            content: post.content || '',
            category: post.category || 'general',
            authorName: post.authorName || null,
            createdAt: post.createdAt.toISOString(),
            imageUrls: imageUrls
          });

          // 이미지를 Google Drive에 업로드 (로컬 파일인 경우)
          for (const imageUrl of imageUrls) {
            // /uploads/ 또는 /크루즈정보사진/ 경로 체크
            if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/크루즈정보사진/')) {
              try {
                const filePath = join(process.cwd(), 'public', imageUrl);
                const buffer = await readFile(filePath);
                const filename = imageUrl.split('/').pop() || 'image.jpg';
                const result = await uploadPostImageToDrive(buffer, filename, 'image/jpeg');
                if (result.ok) {
                  syncedCount.images++;
                  console.log(`[BATCH SYNC] Post image uploaded to Drive: ${result.url}`);
                } else {
                  console.warn(`[BATCH SYNC] Post image upload failed: ${result.error}`);
                }
              } catch (error: any) {
                console.error(`[BATCH SYNC] Error uploading post image ${imageUrl}:`, error?.message || error);
              }
            } else {
              console.log(`[BATCH SYNC] Skipping non-local image URL: ${imageUrl}`);
            }
          }

          syncedCount.posts++;
        } catch (error) {
          console.error(`[BATCH SYNC] Error syncing post ${post.id}:`, error);
          syncedCount.errors++;
        }
      }
    } catch (error) {
      console.error('[BATCH SYNC] Error fetching posts:', error);
      syncedCount.errors++;
    }

    // 3. 최근 1시간 동안 작성된 댓글 동기화
    try {
      const recentComments = await prisma.communityComment.findMany({
        where: {
          createdAt: {
            gte: oneHourAgo,
            lte: now
          }
        },
        include: {
          Post: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      console.log(`[BATCH SYNC] Found ${recentComments.length} comments to sync`);

      for (const comment of recentComments) {
        try {
          // 이미지 URL 배열 파싱
          let imageUrls: string[] = [];
          if (comment.images) {
            if (typeof comment.images === 'string') {
              try {
                imageUrls = JSON.parse(comment.images);
              } catch {
                imageUrls = [comment.images];
              }
            } else if (Array.isArray(comment.images)) {
              imageUrls = comment.images;
            }
          }

          // Google Sheets에 저장
          await saveCommentToSheets({
            id: comment.id,
            postId: comment.postId,
            content: comment.content || '',
            authorName: comment.authorName || null,
            createdAt: comment.createdAt.toISOString(),
            imageUrls: imageUrls
          });

          // 이미지를 Google Drive에 업로드 (로컬 파일인 경우)
          for (const imageUrl of imageUrls) {
            // /uploads/ 또는 /크루즈정보사진/ 경로 체크
            if (imageUrl.startsWith('/uploads/') || imageUrl.startsWith('/크루즈정보사진/')) {
              try {
                const filePath = join(process.cwd(), 'public', imageUrl);
                const buffer = await readFile(filePath);
                const filename = imageUrl.split('/').pop() || 'image.jpg';
                const result = await uploadCommentImageToDrive(buffer, filename, 'image/jpeg');
                if (result.ok) {
                  syncedCount.images++;
                  console.log(`[BATCH SYNC] Comment image uploaded to Drive: ${result.url}`);
                } else {
                  console.warn(`[BATCH SYNC] Comment image upload failed: ${result.error}`);
                }
              } catch (error: any) {
                console.error(`[BATCH SYNC] Error uploading comment image ${imageUrl}:`, error?.message || error);
              }
            } else {
              console.log(`[BATCH SYNC] Skipping non-local image URL: ${imageUrl}`);
            }
          }

          syncedCount.comments++;
        } catch (error) {
          console.error(`[BATCH SYNC] Error syncing comment ${comment.id}:`, error);
          syncedCount.errors++;
        }
      }
    } catch (error) {
      console.error('[BATCH SYNC] Error fetching comments:', error);
      syncedCount.errors++;
    }

    console.log('[BATCH SYNC] Sync completed:', syncedCount);

    return NextResponse.json({
      ok: true,
      message: 'Batch sync completed',
      synced: syncedCount,
      timeRange: {
        from: oneHourAgo.toISOString(),
        to: now.toISOString()
      }
    });
  } catch (error: any) {
    console.error('[BATCH SYNC] Fatal error:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Batch sync failed',
        details: error?.message 
      },
      { status: 500 }
    );
  }
}

// GET: 배치 작업 상태 확인
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Batch sync endpoint is active',
    instructions: 'POST to this endpoint to sync recent data to Google Sheets/Drive',
    schedule: 'Should be called every hour (e.g., via cron job)'
  });
}

