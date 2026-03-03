import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GlobalTemplesService } from './global-temples.service';

@ApiTags('GlobalTemples')
@Controller('gramadevata/globaltemples')
export class GlobalTemplesController {
	constructor(private readonly globalTemplesService: GlobalTemplesService) {}

	@Get()
	async list(
		@Query() query: Record<string, string | undefined>,
		@Req() req: { protocol?: string; get?: (name: string) => string | undefined; path?: string; originalUrl?: string }
	) {
		const basePath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path ?? '';
		const host = req.get?.('host');
		const protocol = req.protocol ?? 'http';
		const baseUrl = host ? `${protocol}://${host}${basePath}` : basePath;

		return this.globalTemplesService.list(query, baseUrl);
	}
}
