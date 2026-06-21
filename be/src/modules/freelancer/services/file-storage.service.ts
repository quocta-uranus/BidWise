import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join, extname, basename } from 'path';
import { randomUUID } from 'crypto';
import type { Response } from 'express';
import type { UploadedFilePayload } from '../types/upload.types';
import {
  CERTIFICATE_EXTENSIONS,
  CERTIFICATE_MIME_TYPES,
  CV_EXTENSIONS,
  CV_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  PORTFOLIO_EXTENSIONS,
  PORTFOLIO_MIME_TYPES,
  UPLOAD_ROOT,
} from '../constants/upload.constants';

export interface StoredFileMeta {
  fileName: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
  storagePath: string;
}

@Injectable()
export class FileStorageService {
  private ensureDir(dir: string) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  private validateFile(
    file: UploadedFilePayload,
    allowedMimes: Set<string>,
    allowedExts: Set<string>,
    maxBytes: number,
  ) {
    if (!file) throw new BadRequestException('FILE_REQUIRED');
    if (file.size > maxBytes) throw new BadRequestException('FILE_TOO_LARGE');

    const ext = extname(file.originalname).toLowerCase();
    if (!allowedMimes.has(file.mimetype) && !allowedExts.has(ext)) {
      throw new BadRequestException('FILE_TYPE_NOT_ALLOWED');
    }
  }

  savePortfolioFile(userId: string, file: UploadedFilePayload): StoredFileMeta {
    this.validateFile(file, PORTFOLIO_MIME_TYPES, PORTFOLIO_EXTENSIONS, MAX_UPLOAD_BYTES);
    return this.save(userId, 'portfolio', file);
  }

  saveCvFile(userId: string, file: UploadedFilePayload): StoredFileMeta {
    this.validateFile(file, CV_MIME_TYPES, CV_EXTENSIONS, MAX_UPLOAD_BYTES);
    return this.save(userId, 'cv', file);
  }

  saveCertificateImage(userId: string, file: UploadedFilePayload): StoredFileMeta {
    this.validateFile(file, CERTIFICATE_MIME_TYPES, CERTIFICATE_EXTENSIONS, MAX_UPLOAD_BYTES);
    return this.save(userId, 'certificates', file);
  }

  private save(userId: string, category: string, file: UploadedFilePayload): StoredFileMeta {
    const dir = join(UPLOAD_ROOT, 'freelancers', userId, category);
    this.ensureDir(dir);

    const ext = extname(file.originalname).toLowerCase() || '.bin';
    const storedName = `${randomUUID()}${ext}`;
    const storagePath = join(dir, storedName);
    writeFileSync(storagePath, file.buffer);

    const fileUrl = `/api/v1/freelancer/files/${category}/${storedName}`;
    return {
      fileName: basename(file.originalname),
      fileUrl,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      mimeType: file.mimetype,
      storagePath,
    };
  }

  resolvePath(userId: string, category: string, storedName: string): string {
    const safeName = basename(storedName);
    const fullPath = join(UPLOAD_ROOT, 'freelancers', userId, category, safeName);
    if (!existsSync(fullPath)) throw new NotFoundException('FILE_NOT_FOUND');
    return fullPath;
  }

  streamFile(fullPath: string, res: Response, downloadName?: string) {
    if (downloadName) {
      res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    }
    createReadStream(fullPath).pipe(res);
  }

  deleteByUrl(userId: string, fileUrl: string | null | undefined) {
    if (!fileUrl) return;
    const match = fileUrl.match(/\/freelancer\/files\/([^/]+)\/([^/]+)$/);
    if (!match) return;
    const [, category, storedName] = match;
    try {
      const path = this.resolvePath(userId, category, storedName);
      unlinkSync(path);
    } catch {
      // ignore missing files
    }
  }
}
