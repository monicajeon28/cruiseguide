import { google } from 'googleapis';
import { Readable } from 'stream';

type UploadOptions = {
  folderId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  driveId?: string | null;
  makePublic?: boolean;
};

const SHARED_DRIVE_ID = process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID || null;

let driveClientPromise: ReturnType<typeof getDriveClient> | null = null;

async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || 'id-657@cruisedot.iam.gserviceaccount.com',
      private_key: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

export async function uploadFileToDrive({
  folderId,
  fileName,
  mimeType,
  buffer,
  driveId = SHARED_DRIVE_ID,
  makePublic = true,
}: UploadOptions): Promise<{
  ok: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}> {
  try {
    console.log('[GoogleDrive] Starting upload:', { fileName, mimeType, bufferSize: buffer.length, folderId });

    if (!driveClientPromise) {
      driveClientPromise = getDriveClient();
    }

    const drive = await driveClientPromise;

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType,
      body: Readable.from(buffer),
    };

    console.log('[GoogleDrive] Uploading file to Drive...');
    const response = await drive.files.create({
      requestBody: { ...fileMetadata, driveId: driveId ?? undefined },
      media,
      fields: 'id, webViewLink, webContentLink',
      supportsAllDrives: true,
    });

    const fileId = response.data.id;

    if (!fileId) {
      console.error('[GoogleDrive] No fileId in response:', response.data);
      throw new Error('Failed to retrieve uploaded file ID');
    }

    console.log('[GoogleDrive] File uploaded successfully, fileId:', fileId);

    if (makePublic) {
      console.log('[GoogleDrive] Setting file permissions to public...');
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      });
      console.log('[GoogleDrive] File permissions set successfully');
    }

    const url = makePublic ? `https://drive.google.com/file/d/${fileId}/view` : response.data.webViewLink;

    console.log('[GoogleDrive] Upload complete:', { fileId, url });

    return {
      ok: true,
      url: url ?? undefined,
      fileId,
    };
  } catch (error: any) {
    console.error('[GoogleDrive] upload error:', error);
    console.error('[GoogleDrive] error details:', {
      message: error?.message,
      code: error?.code,
      errors: error?.errors,
      stack: error?.stack,
    });
    return {
      ok: false,
      error: error?.message || 'Google Drive upload failed',
    };
  }
}


