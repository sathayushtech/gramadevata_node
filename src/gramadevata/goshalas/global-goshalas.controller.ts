import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiTags} from '@nestjs/swagger';
import { GlobalGoshalasService } from './global-goshalas.service';

@ApiTags('GlobalGoshalas')
@Controller('gramadevata/globalgoshala')
export class GlobalGoshalasController {
	constructor(private readonly globalGoshalasService: GlobalGoshalasService) {}

	@Get()
	async list(
		@Query() query: Record<string, string | undefined>,
		@Req() req: { protocol?: string; get?: (name: string) => string | undefined; path?: string; originalUrl?: string }
	) {
		const basePath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path ?? '';
		const host = req.get?.('host');
		const protocol = req.protocol ?? 'http';
		const baseUrl = host ? `${protocol}://${host}${basePath}` : basePath;

		return this.globalGoshalasService.list(query, baseUrl);
	}
}
