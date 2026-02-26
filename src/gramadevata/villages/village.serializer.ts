import { ConfigService } from '@nestjs/config';

const DEFAULT_VILLAGE_IMAGE_BASE_URL = 'https://sathayushstorage.blob.core.windows.net/sathayush/';

function camelToSnake(input: string): string {
	return input.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/__/g, '_').toLowerCase();
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

			// Python-ish list string: ['a','b']
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

function resolveFileBaseUrl(configService: ConfigService): string {
	const base = configService.get<string>('FILE_URL') || configService.get<string>('File_path') || '';
	if (!base) return '';
	return base.endsWith('/') ? base : `${base}/`;
}

export function toFileUrlList(configService: ConfigService, raw: unknown): string[] {
	const base = resolveFileBaseUrl(configService);
	const paths = coerceList(raw).filter((p) => p && p.toLowerCase() !== 'null');

	return paths.map((p) => {
		if (/^https?:\/\//i.test(p)) return p;
		return `${base}${p}`;
	});
}

export function toFirstImageFileUrl(configService: ConfigService, raw: unknown): string | null {
	const base = resolveFileBaseUrl(configService);
	const paths = coerceList(raw).filter((p) => p && p.toLowerCase() !== 'null');
	if (!paths.length) return null;

	let filename = paths[0];
	// Django formats with backslashes.
	filename = filename.replace(/\//g, '\\').replace(/\\\\/g, '\\');

	if (/^https?:\/\//i.test(filename)) return filename;
	return `${base}${filename}`;
}

export function toVillageImageUrlList(raw: unknown, baseUrl?: string): string[] {
	const baseCandidate = baseUrl || DEFAULT_VILLAGE_IMAGE_BASE_URL;
	const base = baseCandidate.endsWith('/') ? baseCandidate : `${baseCandidate}/`;

	const list = coerceList(raw).filter((p) => p && p.toLowerCase() !== 'null');
	return list.map((url) => {
		let cleaned = url.trim();
		cleaned = cleaned.replace(/^\["/, '').replace(/"\]$/, '');
		cleaned = cleaned.replace(/\\/g, '/');
		if (/^https?:\/\//i.test(cleaned)) return cleaned;
		return `${base}${cleaned}`;
	});
}

export function toMapUrlList(raw: unknown): string[] {
	if (Array.isArray(raw)) {
		return raw.map((v) => String(v).trim()).filter(Boolean);
	}

	if (!raw) return [];
	if (typeof raw !== 'string') return [];
	const trimmed = raw.trim();
	if (!trimmed) return [];

	if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
		try {
			const parsed = JSON.parse(trimmed);
			if (Array.isArray(parsed)) {
				return parsed.map((v) => String(v).trim()).filter(Boolean);
			}
		} catch {
			return trimmed
				.replace(/^\[/, '')
				.replace(/\]$/, '')
				.replace(/["']/g, '')
				.split(',')
				.map((p) => p.trim())
				.filter(Boolean);
		}
	}

	return [trimmed];
}

export function formatTimesinceAgo(createdAt?: Date | null): string | null {
	if (!createdAt) return null;
	const now = Date.now();
	const then = createdAt.getTime();
	const seconds = Math.max(0, Math.floor((now - then) / 1000));

	const units: Array<[string, number]> = [
		['year', 365 * 24 * 3600],
		['month', 30 * 24 * 3600],
		['week', 7 * 24 * 3600],
		['day', 24 * 3600],
		['hour', 3600],
		['minute', 60],
	];

	const parts: string[] = [];
	let remaining = seconds;
	for (const [name, size] of units) {
		if (parts.length >= 2) break;
		const count = Math.floor(remaining / size);
		if (count <= 0) continue;
		remaining -= count * size;
		parts.push(`${count} ${name}${count === 1 ? '' : 's'}`);
	}

	if (!parts.length) {
		parts.push('0 minutes');
	}

	return `${parts.join(', ')} ago`;
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
