import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GoshalasByLocationService } from './goshalas-by-location.service';
import { ApiTags } from '@nestjs/swagger';

@Controller("gramadevata")
@ApiTags('Goshalas By Location')
export class GoshalasByLocationController {
    constructor(
		private readonly goshalasByLocationService: GoshalasByLocationService,
	) {}

    @Get('goshalas/state_id/:state_id')
	async getByState(@Param('state_id') stateId: string) {
		return this.goshalasByLocationService.getByState(stateId);
	}

	@Get('goshalas/district_id/:district_id')
	@UseGuards(JwtAuthGuard)
	async getByDistrict(@Param('district_id') districtId: string) {
		return this.goshalasByLocationService.getByDistrict(districtId);
	}

	@Get('goshalas/block_id/:block_id')
	@UseGuards(JwtAuthGuard)
	async getByBlock(@Param('block_id') blockId: string) {
		return this.goshalasByLocationService.getByBlock(blockId);
	}
}