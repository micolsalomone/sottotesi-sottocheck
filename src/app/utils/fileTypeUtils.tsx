import { 
  FileText, 
  File, 
  FileSpreadsheet, 
  Presentation, 
  Image, 
  Video, 
  Music, 
  Archive,
  Code,
  type LucideIcon
} from 'lucide-react';

export type FileType = 
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'code'
  | 'pdf'
  | 'unknown';

export interface FileTypeInfo {
  type: FileType;
  icon: LucideIcon;
  color: string;
}

export function getFileTypeFromName(fileName: string): FileTypeInfo {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  // Documents
  if (['doc', 'docx', 'odt', 'rtf', 'txt'].includes(extension)) {
    return {
      type: 'document',
      icon: FileText,
      color: 'text-blue-600'
    };
  }

  // PDF
  if (extension === 'pdf') {
    return {
      type: 'pdf',
      icon: FileText,
      color: 'text-red-600'
    };
  }

  // Spreadsheets
  if (['xls', 'xlsx', 'ods', 'csv'].includes(extension)) {
    return {
      type: 'spreadsheet',
      icon: FileSpreadsheet,
      color: 'text-green-600'
    };
  }

  // Presentations
  if (['ppt', 'pptx', 'odp', 'key'].includes(extension)) {
    return {
      type: 'presentation',
      icon: Presentation,
      color: 'text-orange-600'
    };
  }

  // Images
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico'].includes(extension)) {
    return {
      type: 'image',
      icon: Image,
      color: 'text-purple-600'
    };
  }

  // Videos
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm', 'm4v'].includes(extension)) {
    return {
      type: 'video',
      icon: Video,
      color: 'text-pink-600'
    };
  }

  // Audio
  if (['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(extension)) {
    return {
      type: 'audio',
      icon: Music,
      color: 'text-indigo-600'
    };
  }

  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
    return {
      type: 'archive',
      icon: Archive,
      color: 'text-yellow-600'
    };
  }

  // Code
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'sh'].includes(extension)) {
    return {
      type: 'code',
      icon: Code,
      color: 'text-cyan-600'
    };
  }

  // Unknown/Generic
  return {
    type: 'unknown',
    icon: File,
    color: 'text-muted-foreground'
  };
}

/** Human-readable label for each file type */
export const FILE_TYPE_LABELS: Record<FileType, string> = {
  document: 'Documento',
  spreadsheet: 'Foglio di calcolo',
  presentation: 'Presentazione',
  image: 'Immagine',
  video: 'Video',
  audio: 'Audio',
  archive: 'Archivio',
  code: 'Codice',
  pdf: 'PDF',
  unknown: 'File',
};

/** Extract extension from file name (uppercase, e.g. "PDF", "DOCX") */
export function getFileExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toUpperCase() || '';
  return ext;
}

/** Format file size to human-readable string */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}