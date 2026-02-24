import { ConfigService } from '@nestjs/config';
import { BlobServiceClient } from '@azure/storage-blob';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

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
  if (/(\.|\/).+\.(png|jpe?g|webp|gif|bmp|mp4|mov|avi|mkv)(\?.*)?$/i.test(trimmed)) {
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

export async function saveImageToAzure(opts: Omit<AzureUploadOpts, 'extension'>): Promise<string> {
  return uploadToAzure({ ...opts, extension: 'jpg', contentType: opts.contentType ?? 'image/jpeg' });
}

export async function saveVideoToAzure(opts: Omit<AzureUploadOpts, 'extension'>): Promise<string> {
  return uploadToAzure({ ...opts, extension: 'mp4', contentType: opts.contentType ?? 'video/mp4' });
}

export async function saveEntityImagesToAzure(opts: {
  configService: ConfigService;
  images: string[];
  id: string;
  name: string;
  entityType: string;
}): Promise<string[]> {
  const { configService, images, id, name, entityType } = opts;

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
  const host = configService.get<string>('SMTP_HOST');
  const port = Number(configService.get<string>('SMTP_PORT') || 465);
  const user = configService.get<string>('SMTP_USER');
  const pass = configService.get<string>('SMTP_PASS');

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendAdminEmail(configService: ConfigService, opts: { subject: string; text: string }): Promise<void> {
  const transport = getMailTransport(configService);
  const from = configService.get<string>('SMTP_FROM') || configService.get<string>('SMTP_USER') || '';
  const to = configService.get<string>('ADMIN_EMAIL') || from;

  if (!transport || !to) {
    console.log(`${opts.subject}: ${opts.text}`);
    return;
  }

  await transport.sendMail({
    from,
    to,
    subject: opts.subject,
    text: opts.text,
  });
}
