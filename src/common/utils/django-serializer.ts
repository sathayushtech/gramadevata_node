import { ConfigService } from '@nestjs/config';

function camelToSnake(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/__/g, '_').toLowerCase();
}

function snakeToCamel(input: string): string {
  return input.replace(/_([a-z])/g, (_, c) => String(c).toUpperCase());
}

export function coerceList(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v : String(v)))
      .map((v) => v.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.toLowerCase() === 'null') return ['null'];

    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => String(v).trim()).filter(Boolean);
        }
      } catch {
        // fall through
      }

      return trimmed
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .replace(/["']/g, '')
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    }

    if (trimmed.includes(',')) {
      return trimmed
        .split(',')
        .map((p) => p.replace(/["']/g, '').trim())
        .filter(Boolean);
    }

    return [trimmed.replace(/["']/g, '').trim()].filter(Boolean);
  }

  return [String(value)].map((v) => v.trim()).filter(Boolean);
}

export function normalizeSnakePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload || {})) {
    if (key === '_id' || key === 'id') continue;
    out[snakeToCamel(key)] = value;
  }
  return out;
}

export function toDjangoKeys<T extends Record<string, any>>(
  plain: T,
  opts?: {
    keep?: Set<string>;
    rename?: Record<string, string>;
    drop?: Set<string>;
  },
): Record<string, any> {
  const keep = opts?.keep || new Set<string>();
  const rename = opts?.rename || {};
  const drop = opts?.drop || new Set<string>();

  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(plain)) {
    if (drop.has(key)) continue;

    if (key === 'id') {
      out['_id'] = value;
      continue;
    }

    if (rename[key]) {
      out[rename[key]] = value;
      continue;
    }

    if (keep.has(key)) {
      out[key] = value;
      continue;
    }

    out[camelToSnake(key)] = value;
  }
  return out;
}

function resolveFileBaseUrl(configService: ConfigService): string {
  const raw =
    configService.get<string>('File_path') ||
    configService.get<string>('FILE_URL') ||
    configService.get<string>('FILE_URL_BASE') ||
    '';
  if (!raw) return '';
  return raw.endsWith('/') ? raw : `${raw}/`;
}

export function toFileUrlList(configService: ConfigService, raw: unknown): string[] {
  const base = resolveFileBaseUrl(configService);
  const paths = coerceList(raw).filter((p) => p && p.toLowerCase() !== 'null');

  return paths.map((p) => {
    if (/^https?:\/\//i.test(p)) return p;
    return `${base}${p.replace(/\\/g, '/').replace(/^\//, '')}`;
  });
}

export function toFileUrlString(configService: ConfigService, raw: unknown): string | null {
  const list = toFileUrlList(configService, raw);
  return list.length ? list[0] : null;
}

export function extractLatLongFromUrl(url?: string | null): { latitude: number | null; longitude: number | null } {
  if (!url) return { latitude: null, longitude: null };
  const match = url.match(/[-+]?\d{1,3}\.\d+\s*,\s*[-+]?\d{1,3}\.\d+/);
  if (!match) return { latitude: null, longitude: null };
  const [latRaw, longRaw] = match[0].split(',');
  const latitude = Number.parseFloat(latRaw.trim());
  const longitude = Number.parseFloat(longRaw.trim());
  return {
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
  };
}
