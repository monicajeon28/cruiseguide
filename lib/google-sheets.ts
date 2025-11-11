// lib/google-sheets.ts
// Google Sheets 및 Drive API 유틸리티

import { google } from 'googleapis';

// Google Sheets API 클라이언트 초기화 (크루즈몰 뮤니티 소팅용)
async function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL || 'id-463@cruisedot.iam.gserviceaccount.com',
      private_key: process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  return google.sheets({ version: 'v4', auth });
}

// Google Drive API 클라이언트 초기화 (크루즈몰 이미지와 댓글이미지용)
async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || 'id-657@cruisedot.iam.gserviceaccount.com',
      private_key: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  return google.drive({ version: 'v3', auth });
}

// 리뷰를 Google Sheets에 저장
export async function saveReviewToSheets(reviewData: {
  id: number;
  title: string;
  content: string;
  rating: number;
  cruiseLine?: string | null;
  shipName?: string | null;
  authorName?: string | null;
  travelDate?: string | null;
  createdAt: string;
  imageUrls: string[];
}) {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = '1FJa84qNoy25gC3sn6jvbfGwvcrHDJAWvTcLk-xPUkz0';

    const row = [
      new Date().toISOString(), // 작성일시
      reviewData.id.toString(),
      reviewData.title,
      reviewData.content,
      reviewData.rating.toString(),
      reviewData.cruiseLine || '',
      reviewData.shipName || '',
      reviewData.authorName || '',
      reviewData.travelDate || '',
      reviewData.imageUrls.join(', '), // 이미지 URL들을 쉼표로 구분
      reviewData.createdAt,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:K', // A열부터 K열까지
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return { ok: true };
  } catch (error: any) {
    console.error('[Google Sheets] Review save error:', error);
    return { ok: false, error: error.message };
  }
}

// 리뷰 이미지를 Google Drive에 업로드
export async function uploadReviewImageToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const drive = await getDriveClient();
    const folderId = '1aqb5KeEAK0vJJJ9IVeTXC9iLDXPLgBau';

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: Buffer.from(fileBuffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    // 공개 링크 생성
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const fileUrl = `https://drive.google.com/file/d/${response.data.id}/view`;

    return {
      ok: true,
      url: fileUrl,
    };
  } catch (error: any) {
    console.error('[Google Drive] Image upload error:', error);
    return { ok: false, error: error.message };
  }
}

// 커뮤니티 질문을 Google Sheets에 저장 (카테고리별 시트)
export async function savePostToSheets(postData: {
  id: number;
  title: string;
  content: string;
  category: string;
  authorName?: string | null;
  createdAt: string;
  imageUrls: string[];
}) {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = '1QnELfkOfECm27yTx6WW2qmR6IOlvwWpuHzJkUb5nTsE';

    // 카테고리별 시트 매핑
    const sheetMap: Record<string, string> = {
      'travel-tip': '시트1',
      'destination': '시트2',
      'qna': '시트3',
      'general': '시트1',
    };

    const sheetName = sheetMap[postData.category] || '시트1';

    const row = [
      new Date().toISOString(), // 작성일시
      postData.id.toString(),
      postData.title,
      postData.content,
      postData.category,
      postData.authorName || '',
      postData.imageUrls.join(', '), // 이미지 URL들을 쉼표로 구분
      postData.createdAt,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:H`, // A열부터 H열까지
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return { ok: true };
  } catch (error: any) {
    console.error('[Google Sheets] Post save error:', error);
    return { ok: false, error: error.message };
  }
}

// 커뮤니티 질문 이미지를 Google Drive에 업로드
export async function uploadPostImageToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const drive = await getDriveClient();
    const folderId = '1aqb5KeEAK0vJJJ9IVeTXC9iLDXPLgBau';

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: Buffer.from(fileBuffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    // 공개 링크 생성
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const fileUrl = `https://drive.google.com/file/d/${response.data.id}/view`;

    return {
      ok: true,
      url: fileUrl,
    };
  } catch (error: any) {
    console.error('[Google Drive] Post image upload error:', error);
    return { ok: false, error: error.message };
  }
}

// 댓글을 Google Sheets에 저장
export async function saveCommentToSheets(commentData: {
  id: number;
  postId: number;
  content: string;
  authorName?: string | null;
  createdAt: string;
  imageUrls: string[];
}) {
  try {
    // 환경 변수 확인
    if (!process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL && !process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PRIVATE_KEY) {
      console.warn('[Google Sheets] Service account credentials not configured, skipping comment save');
      return { ok: false, error: 'Service account not configured' };
    }

    const sheets = await getSheetsClient();
    const spreadsheetId = '1QnELfkOfECm27yTx6WW2qmR6IOlvwWpuHzJkUb5nTsE'; // 게시글과 같은 스프레드시트

    const row = [
      new Date().toISOString(), // 작성일시
      commentData.id.toString(),
      commentData.postId.toString(),
      commentData.content,
      commentData.authorName || '',
      commentData.imageUrls.join(', '), // 이미지 URL들을 쉼표로 구분
      commentData.createdAt,
    ];

    // 댓글 시트가 없을 수 있으므로 에러 처리
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: '댓글!A:G', // 댓글 시트에 A열부터 G열까지
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [row],
        },
      });
      console.log('[Google Sheets] Comment saved successfully to 댓글 sheet');
    } catch (sheetError: any) {
      // 댓글 시트가 없으면 시트1에 저장 시도
      if (sheetError.message?.includes('Unable to parse range') || 
          sheetError.message?.includes('not found') ||
          sheetError.message?.includes('does not exist')) {
        console.log('[Google Sheets] 댓글 시트가 없어 시트1에 저장 시도');
        try {
          await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: '시트1!A:G',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [row],
            },
          });
          console.log('[Google Sheets] Comment saved successfully to 시트1');
        } catch (fallbackError: any) {
          console.error('[Google Sheets] Fallback save also failed:', fallbackError.message);
          throw fallbackError;
        }
      } else {
        console.error('[Google Sheets] Sheet error:', sheetError.message);
        throw sheetError;
      }
    }

    return { ok: true };
  } catch (error: any) {
    console.error('[Google Sheets] Comment save error:', error);
    console.error('[Google Sheets] Error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack
    });
    // 에러를 던지지 않고 반환하여 댓글 작성에 영향 없도록
    return { ok: false, error: error?.message || 'Unknown error' };
  }
}

// 댓글 이미지를 Google Drive에 업로드
export async function uploadCommentImageToDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ ok: boolean; url?: string; error?: string }> {
  try {
    const drive = await getDriveClient();
    const folderId = '1aqb5KeEAK0vJJJ9IVeTXC9iLDXPLgBau'; // 같은 폴더 사용

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: Buffer.from(fileBuffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    // 공개 링크 생성
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    const fileUrl = `https://drive.google.com/file/d/${response.data.id}/view`;

    return {
      ok: true,
      url: fileUrl,
    };
  } catch (error: any) {
    console.error('[Google Drive] Comment image upload error:', error);
    return { ok: false, error: error.message };
  }
}

