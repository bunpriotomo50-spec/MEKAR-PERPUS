/**
 * Google Drive Backup & Synchronization Utilities
 * Target Folder ID: 1fTbLPY6P0GnSf9M6Rp8NTHw8olI5AACj
 * Target Folder Link: https://drive.google.com/drive/folders/1fTbLPY6P0GnSf9M6Rp8NTHw8olI5AACj?usp=sharing
 */

export const DRIVE_BACKUP_FOLDER_ID = '1fTbLPY6P0GnSf9M6Rp8NTHw8olI5AACj';
export const DRIVE_BACKUP_FOLDER_URL =
  'https://drive.google.com/drive/folders/1fTbLPY6P0GnSf9M6Rp8NTHw8olI5AACj?usp=sharing';

export interface DriveUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  webViewLink?: string;
  folderId: string;
  folderUrl: string;
  message: string;
  sizeBytes?: number;
}

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string;
  size?: string;
  webViewLink?: string;
}

/**
 * Uploads library backup JSON to Google Drive folder using multipart upload.
 */
export async function uploadBackupToGoogleDrive(
  accessToken: string,
  backupData: any,
  customFileName?: string
): Promise<DriveUploadResult> {
  const timestamp = new Date()
    .toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .slice(0, 19);

  const fileName =
    customFileName || `Backup_Perpustakaan_SMPN2_Pemalang_${timestamp}.json`;

  const fileContent = JSON.stringify(backupData, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  // Attempt 1: Upload directly to the designated folder
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    description: `Cadangan Lengkap Data Sistem Perpustakaan Mekar SMPN 2 Pemalang pada ${new Date().toLocaleString(
      'id-ID'
    )}`,
    parents: [DRIVE_BACKUP_FOLDER_ID],
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  let res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,createdTime,size,parents',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  // If specific folder returns 404 or 403 (e.g. shared drive permissions), fallback to user's root Drive with description
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.warn('Folder upload returned error:', errorData);

    if (res.status === 404 || res.status === 403) {
      const fallbackMetadata = {
        name: fileName,
        mimeType: 'application/json',
        description: `Cadangan Data Perpustakaan Mekar SMPN 2 Pemalang (Target Folder: ${DRIVE_BACKUP_FOLDER_ID})`,
      };

      const fallbackBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        JSON.stringify(fallbackMetadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        fileContent +
        closeDelimiter;

      const fallbackRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,createdTime,size',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: fallbackBody,
        }
      );

      if (fallbackRes.ok) {
        const fileInfo = await fallbackRes.json();
        return {
          success: true,
          fileId: fileInfo.id,
          fileName: fileInfo.name,
          webViewLink: fileInfo.webViewLink,
          folderId: DRIVE_BACKUP_FOLDER_ID,
          folderUrl: DRIVE_BACKUP_FOLDER_URL,
          message: `Berkas cadangan "${fileInfo.name}" berhasil diunggah ke Google Drive Anda!`,
          sizeBytes: fileContent.length,
        };
      }
    }

    throw new Error(
      errorData.error?.message ||
        `Gagal mengunggah berkas cadangan ke Google Drive (Kode respon: ${res.status}).`
    );
  }

  const fileInfo = await res.json();
  return {
    success: true,
    fileId: fileInfo.id,
    fileName: fileInfo.name,
    webViewLink: fileInfo.webViewLink,
    folderId: DRIVE_BACKUP_FOLDER_ID,
    folderUrl: DRIVE_BACKUP_FOLDER_URL,
    message: `Berkas cadangan "${fileInfo.name}" berhasil diunggah langsung ke folder Google Drive tujuan!`,
    sizeBytes: fileContent.length,
  };
}

/**
 * Lists backup files previously saved to Google Drive.
 */
export async function listDriveBackups(accessToken: string): Promise<DriveBackupFile[]> {
  try {
    const query = `name contains 'Backup_Perpustakaan_SMPN2_Pemalang' and trashed=false`;
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        query
      )}&fields=files(id,name,createdTime,size,webViewLink,parents)&orderBy=createdTime desc&pageSize=15`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.warn('Gagal memuat daftar backup dari Google Drive:', err);
    return [];
  }
}

/**
 * Helper to download backup payload as local JSON file
 */
export function downloadLocalBackupFile(data: any, customFilename?: string) {
  const timestamp = new Date()
    .toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .slice(0, 19);

  const filename =
    customFilename || `Backup_Perpustakaan_SMPN2_Pemalang_${timestamp}.json`;

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
