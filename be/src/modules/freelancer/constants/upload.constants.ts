import { join } from 'path';

export const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50MB

export const PORTFOLIO_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/zip',
  'application/x-zip-compressed',
]);

export const PORTFOLIO_EXTENSIONS = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.zip']);

export const CV_MIME_TYPES = new Set(['application/pdf']);
export const CV_EXTENSIONS = new Set(['.pdf']);

export const CERTIFICATE_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
]);

export const CERTIFICATE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.pdf']);

export const LINK_TYPES = ['github', 'behance', 'other'] as const;
export type LinkType = (typeof LINK_TYPES)[number];
