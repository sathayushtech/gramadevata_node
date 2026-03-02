import {
	Controller,
	Get,
	Query,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GlobalSearchService } from './global-search.service';

@Controller('gramadevata/global_search')
@ApiTags('Global Search')
export class GlobalSearchController {
	constructor(private readonly globalSearchService: GlobalSearchService) {}

	@Get()
	async search(@Query() query: Record<string, string | undefined>) {
		const result = await this.globalSearchService.search(query);

		if (result.status !== 200) {
			throw new HttpException(result.body, 
				result.status === 400 ? HttpStatus.BAD_REQUEST : HttpStatus.NOT_FOUND);
		}

		return result.body;
	}
}
