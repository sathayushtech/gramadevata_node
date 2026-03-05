import { ConfigService } from '@nestjs/config';
import { BlobServiceClient } from '@azure/storage-blob';
import * as nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export function coerceStringList(value: unknown): string[] {
  if (value === null || value === undefined) {
    return [];
  }
  if (Array.isArray(value)) {
    return value
      .filter((v): v is string => typeof v === 'string')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  return [];
}

export function stripBase64Prefix(value: string): string {
  const idx = value.indexOf('base64,');
  if (idx === -1) {
    return value;
  }
  return value.slice(idx + 'base64,'.length);
}

export function looksLikeStoredPath(value: string, entityType?: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true;
  }

  if (entityType && trimmed.startsWith(`${entityType}/`)) {
    return true;
  }

  // Generic "path-like" values.
  if (/((\.|\/).+\.(png|jpe?g|webp|gif|bmp|mp4|mov|avi|mkv|mp3|wav|ogg|m4a)(\?.*)?$)/i.test(trimmed)) {
    return true;
  }

  return false;
}

type AzureUploadOpts = {
  configService: ConfigService;
  base64: string;
  id: string;
  name: string;
  entityType: string;
  extension: string;
  contentType?: string;
};

async function uploadToAzure(opts: AzureUploadOpts): Promise<string> {
  const { configService, base64, id, name, entityType, extension, contentType } = opts;

  const connectionString = configService.get<string>('AZURE_STORAGE_CONNECTION_STRING');
  if (!connectionString) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
  }

  const containerName = configService.get<string>('AZURE_CONTAINER_NAME') || 'sathayush';

  const decoded = Buffer.from(stripBase64Prefix(base64), 'base64');
  const safeName = name.replace(/\//g, '_');
  const fileName = `${safeName}_${randomBytes(4).toString('hex')}.${extension}`;
  const folderPath = `${entityType}/${id}/`;
  const blobName = `${folderPath}${fileName}`;

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobClient = containerClient.getBlockBlobClient(blobName);

  await blobClient.deleteIfExists();
  await blobClient.uploadData(decoded, {
    blobHTTPHeaders: contentType ? { blobContentType: contentType } : undefined,
  });

  // Django returns the blob path (not full URL)
  return blobName;
}

type SaveImageOpts = Omit<AzureUploadOpts, 'extension' | 'contentType'> & {
  extension?: string;
  contentType?: string;
};

function resolveImageContentType(extension?: string) {
  const normalized = (extension || 'jpg').toLowerCase();
  if (normalized === 'webp') {
    return 'image/webp';
  }
  if (normalized === 'png') {
    return 'image/png';
  }
  return 'image/jpeg';
}

function resolveAudioExtensionAndType(base64: string): { extension: string; contentType: string } {
  const head = base64.slice(0, 64).toLowerCase();
  if (head.includes('data:audio/wav')) {
    return { extension: 'wav', contentType: 'audio/wav' };
  }
  if (head.includes('data:audio/ogg')) {
    return { extension: 'ogg', contentType: 'audio/ogg' };
  }
  if (head.includes('data:audio/mp4') || head.includes('data:audio/m4a')) {
    return { extension: 'm4a', contentType: 'audio/mp4' };
  }
  // Default: mp3
  return { extension: 'mp3', contentType: 'audio/mpeg' };
}

export async function saveImageToAzure(opts: SaveImageOpts): Promise<string> {
  const extension = (opts.extension || 'jpg').toLowerCase();
  const contentType = opts.contentType || resolveImageContentType(extension);
  return uploadToAzure({ ...opts, extension, contentType });
}

export async function saveVideoToAzure(opts: Omit<AzureUploadOpts, 'extension'>): Promise<string> {
  return uploadToAzure({ ...opts, extension: 'mp4', contentType: opts.contentType ?? 'video/mp4' });
}

export async function saveAudioToAzure(opts: Omit<AzureUploadOpts, 'extension' | 'contentType'> & { contentType?: string }): Promise<string> {
  const resolved = resolveAudioExtensionAndType(opts.base64);
  return uploadToAzure({
    ...opts,
    extension: resolved.extension,
    contentType: opts.contentType ?? resolved.contentType,
  });
}

export async function saveEntityImagesToAzure(opts: {
  configService: ConfigService;
  images: string[];
  id: string;
  name: string;
  entityType: string;
  extension?: string;
  contentType?: string;
}): Promise<string[]> {
  const { configService, images, id, name, entityType, extension, contentType } = opts;

  const saved: string[] = [];
  for (const image of images) {
    const raw = image?.trim();
    if (!raw || raw.toLowerCase() === 'null') {
      continue;
    }

    if (looksLikeStoredPath(raw, entityType)) {
      saved.push(raw);
      continue;
    }

    saved.push(
      await saveImageToAzure({
        configService,
        base64: raw,
        id,
        name,
        entityType,
        extension,
        contentType,
      }),
    );
  }

  return saved;
}

export async function saveEntityVideosToAzure(opts: {
  configService: ConfigService;
  videos: string[];
  id: string;
  name: string;
  entityType: string;
}): Promise<string[]> {
  const { configService, videos, id, name, entityType } = opts;

  const saved: string[] = [];
  for (const video of videos) {
    const raw = video?.trim();
    if (!raw || raw.toLowerCase() === 'null') {
      continue;
    }

    if (looksLikeStoredPath(raw, entityType)) {
      saved.push(raw);
      continue;
    }

    saved.push(
      await saveVideoToAzure({
        configService,
        base64: raw,
        id,
        name,
        entityType,
      }),
    );
  }

  return saved;
}

export async function saveEntityAudiosToAzure(opts: {
  configService: ConfigService;
  audios: string[];
  id: string;
  name: string;
  entityType: string;
  contentType?: string;
}): Promise<string[]> {
  const { configService, audios, id, name, entityType, contentType } = opts;

  const saved: string[] = [];
  for (const audio of audios) {
    const raw = audio?.trim();
    if (!raw || raw.toLowerCase() === 'null') {
      continue;
    }

    if (looksLikeStoredPath(raw, entityType)) {
      saved.push(raw);
      continue;
    }

    saved.push(
      await saveAudioToAzure({
        configService,
        base64: raw,
        id,
        name,
        entityType,
        contentType,
      }),
    );
  }

  return saved;
}

export function formatDjangoDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getMailTransport(configService: ConfigService) {
  const host = configService.get<string>('EMAIL_HOST');
  const port = Number(configService.get<string>('EMAIL_PORT'));
  const user = configService.get<string>('EMAIL_HOST_USER');
  const pass = configService.get<string>('EMAIL_HOST_PASSWORD');

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: configService.get<boolean>('EMAIL_USE_TLS'),
    auth: { user, pass },
  });
}

export async function sendAdminEmail(configService: ConfigService, opts: { subject: string; text: string, recipients: string[] }): Promise<void> {
  const transport = getMailTransport(configService);
  const from = configService.get<string>('DEFAULT_FROM_EMAIL');

  if (!transport || !opts.recipients || !opts.recipients.length) {
    console.log(`${opts.subject}: ${opts.text}`);
    return;
  }

  await transport.sendMail({
    from,
    to: opts.recipients,
    subject: opts.subject,
    text: opts.text,
  });
}

export async function saveImageToFolder(opts: {
  baseDir: string;
  base64: string;
  id: string;
  name: string;
  entityType: string;
  extension?: string;
}): Promise<string | null> {
  const { baseDir, base64, id, name, entityType, extension } = opts;
  if (!baseDir) {
    return null;
  }

  const decoded = Buffer.from(stripBase64Prefix(base64), 'base64');
  const ext = (extension || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
  const fileName = `${name}_${randomBytes(4).toString('hex')}.${ext}`;
  const folderPath = path.join(baseDir, entityType, id);
  await fs.mkdir(folderPath, { recursive: true });

  const filePath = path.join(folderPath, fileName);
  await fs.writeFile(filePath, decoded);

  return path.posix.join(entityType, id, fileName);
}