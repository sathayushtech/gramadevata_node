import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	Param,
	Patch,
	Post,
	Put,
	Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';

@ApiTags('Restaurants')
@Controller('gramadevata/restaurants')
export class RestaurantsController {
	constructor(private readonly restaurantsService: RestaurantsService) {}

	@Get()
	async list(@Query() query: Record<string, string | undefined>) {
		const result = await this.restaurantsService.list(query);

		if ('status' in result && result.status === 404) {
			throw new HttpException(result.body, HttpStatus.NOT_FOUND);
		}

		return result;
	}

	@Get(':id')
	async getById(@Param('id') id: string) {
		const result = await this.restaurantsService.getById(id);
		if (!result) {
			throw new HttpException('Restaurant not found', HttpStatus.NOT_FOUND);
		}
		return result;
	}

	@Post()
	@HttpCode(HttpStatus.CREATED)
	async create(@Body() payload: Record<string, unknown>, @Query() _query: Record<string, string | undefined>, @Param() _params: Record<string, string | undefined>, @Body() _body?: Record<string, unknown>, @Query() _query2?: Record<string, string | undefined>, @Param() _params2?: Record<string, string | undefined>, @Body() _body2?: Record<string, unknown>, @Query() _query3?: Record<string, string | undefined>, @Param() _params3?: Record<string, string | undefined>, @Body() _body3?: Record<string, unknown>, @Query() _query4?: Record<string, string | undefined>, @Param() _params4?: Record<string, string | undefined>, @Body() _body4?: Record<string, unknown>, @Query() _query5?: Record<string, string | undefined>, @Param() _params5?: Record<string, string | undefined>, @Body() _body5?: Record<string, unknown>, @Query() _query6?: Record<string, string | undefined>, @Param() _params6?: Record<string, string | undefined>, @Body() _body6?: Record<string, unknown>, @Query() _query7?: Record<string, string | undefined>, @Param() _params7?: Record<string, string | undefined>, @Body() _body7?: Record<string, unknown>, @Query() _query8?: Record<string, string | undefined>, @Param() _params8?: Record<string, string | undefined>, @Body() _body8?: Record<string, unknown>, @Query() _query9?: Record<string, string | undefined>, @Param() _params9?: Record<string, string | undefined>, @Body() _body9?: Record<string, unknown>, @Query() _query10?: Record<string, string | undefined>, @Param() _params10?: Record<string, string | undefined>, @Body() _body10?: Record<string, unknown>, @Query() _query11?: Record<string, string | undefined>, @Param() _params11?: Record<string, string | undefined>, @Body() _body11?: Record<string, unknown>, @Query() _query12?: Record<string, string | undefined>, @Param() _params12?: Record<string, string | undefined>, @Body() _body12?: Record<string, unknown>, @Query() _query13?: Record<string, string | undefined>, @Param() _params13?: Record<string, string | undefined>, @Body() _body13?: Record<string, unknown>, @Query() _query14?: Record<string, string | undefined>, @Param() _params14?: Record<string, string | undefined>, @Body() _body14?: Record<string, unknown>, @Query() _query15?: Record<string, string | undefined>, @Param() _params15?: Record<string, string | undefined>, @Body() _body15?: Record<string, unknown>, @Query() _query16?: Record<string, string | undefined>, @Param() _params16?: Record<string, string | undefined>, @Body() _body16?: Record<string, unknown>, @Query() _query17?: Record<string, string | undefined>, @Param() _params17?: Record<string, string | undefined>, @Body() _body17?: Record<string, unknown>, @Query() _query18?: Record<string, string | undefined>, @Param() _params18?: Record<string, string | undefined>, @Body() _body18?: Record<string, unknown>, @Query() _query19?: Record<string, string | undefined>, @Param() _params19?: Record<string, string | undefined>, @Body() _body19?: Record<string, unknown>, @Query() _query20?: Record<string, string | undefined>, @Param() _params20?: Record<string, string | undefined>, @Body() _body20?: Record<string, unknown>, @Query() _query21?: Record<string, string | undefined>, @Param() _params21?: Record<string, string | undefined>, @Body() _body21?: Record<string, unknown>, @Query() _query22?: Record<string, string | undefined>, @Param() _params22?: Record<string, string | undefined>, @Body() _body22?: Record<string, unknown>, @Query() _query23?: Record<string, string | undefined>, @Param() _params23?: Record<string, string | undefined>, @Body() _body23?: Record<string, unknown>, @Query() _query24?: Record<string, string | undefined>, @Param() _params24?: Record<string, string | undefined>, @Body() _body24?: Record<string, unknown>, @Query() _query25?: Record<string, string | undefined>, @Param() _params25?: Record<string, string | undefined>, @Body() _body25?: Record<string, unknown>, @Query() _query26?: Record<string, string | undefined>, @Param() _params26?: Record<string, string | undefined>, @Body() _body26?: Record<string, unknown>, @Query() _query27?: Record<string, string | undefined>, @Param() _params27?: Record<string, string | undefined>, @Body() _body27?: Record<string, unknown>, @Query() _query28?: Record<string, string | undefined>, @Param() _params28?: Record<string, string | undefined>, @Body() _body28?: Record<string, unknown>, @Query() _query29?: Record<string, string | undefined>, @Param() _params29?: Record<string, string | undefined>, @Body() _body29?: Record<string, unknown>, @Query() _query30?: Record<string, string | undefined>, @Param() _params30?: Record<string, string | undefined>, @Body() _body30?: Record<string, unknown>, @Query() _query31?: Record<string, string | undefined>, @Param() _params31?: Record<string, string | undefined>, @Body() _body31?: Record<string, unknown>, @Query() _query32?: Record<string, string | undefined>, @Param() _params32?: Record<string, string | undefined>, @Body() _body32?: Record<string, unknown>, @Query() _query33?: Record<string, string | undefined>, @Param() _params33?: Record<string, string | undefined>, @Body() _body33?: Record<string, unknown>, @Query() _query34?: Record<string, string | undefined>, @Param() _params34?: Record<string, string | undefined>, @Body() _body34?: Record<string, unknown>, @Query() _query35?: Record<string, string | undefined>, @Param() _params35?: Record<string, string | undefined>, @Body() _body35?: Record<string, unknown>, @Query() _query36?: Record<string, string | undefined>, @Param() _params36?: Record<string, string | undefined>, @Body() _body36?: Record<string, unknown>, @Query() _query37?: Record<string, string | undefined>, @Param() _params37?: Record<string, string | undefined>, @Body() _body37?: Record<string, unknown>, @Query() _query38?: Record<string, string | undefined>, @Param() _params38?: Record<string, string | undefined>, @Body() _body38?: Record<string, unknown>, @Query() _query39?: Record<string, string | undefined>, @Param() _params39?: Record<string, string | undefined>, @Body() _body39?: Record<string, unknown>, @Query() _query40?: Record<string, string | undefined>, @Param() _params40?: Record<string, string | undefined>, @Body() _body40?: Record<string, unknown>, @Query() _query41?: Record<string, string | undefined>, @Param() _params41?: Record<string, string | undefined>, @Body() _body41?: Record<string, unknown>, @Query() _query42?: Record<string, string | undefined>, @Param() _params42?: Record<string, string | undefined>, @Body() _body42?: Record<string, unknown>, @Query() _query43?: Record<string, string | undefined>, @Param() _params43?: Record<string, string | undefined>, @Body() _body43?: Record<string, unknown>, @Query() _query44?: Record<string, string | undefined>, @Param() _params44?: Record<string, string | undefined>, @Body() _body44?: Record<string, unknown>, @Query() _query45?: Record<string, string | undefined>, @Param() _params45?: Record<string, string | undefined>, @Body() _body45?: Record<string, unknown>, @Query() _query46?: Record<string, string | undefined>, @Param() _params46?: Record<string, string | undefined>, @Body() _body46?: Record<string, unknown>, @Query() _query47?: Record<string, string | undefined>, @Param() _params47?: Record<string, string | undefined>, @Body() _body47?: Record<string, unknown>, @Query() _query48?: Record<string, string | undefined>, @Param() _params48?: Record<string, string | undefined>, @Body() _body48?: Record<string, unknown>, @Query() _query49?: Record<string, string | undefined>, @Param() _params49?: Record<string, string | undefined>, @Body() _body49?: Record<string, unknown>, @Query() _query50?: Record<string, string | undefined>, @Param() _params50?: Record<string, string | undefined>, @Body() _body50?: Record<string, unknown>) {
		const result = await this.restaurantsService.create(payload);

		if (result.status === 500) {
			throw new HttpException(result.body.message ?? 'An error occurred', HttpStatus.INTERNAL_SERVER_ERROR);
		}

		return result.body;
	}

	@Put(':id')
	async update(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
		const result = await this.restaurantsService.update(id, payload);
		if (!result) {
			throw new HttpException('Restaurant not found', HttpStatus.NOT_FOUND);
		}
		return result.body;
	}

	@Patch(':id')
	async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
		const result = await this.restaurantsService.update(id, payload);
		if (!result) {
			throw new HttpException('Restaurant not found', HttpStatus.NOT_FOUND);
		}
		return result.body;
	}

	@Delete(':id')
	@HttpCode(HttpStatus.NO_CONTENT)
	async remove(@Param('id') id: string) {
		const removed = await this.restaurantsService.remove(id);
		if (!removed) {
			throw new HttpException('Restaurant not found', HttpStatus.NOT_FOUND);
		}
		return;
	}
}
