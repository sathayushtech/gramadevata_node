import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GlobalSearchController } from './global-search.controller';
import { GlobalSearchService } from './global-search.service';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { Temple } from '../temple/temple.model';
import { Event } from '../events/event.model';
import { TempleNearbyTourismPlace } from '../tourism/temple-nearby-tourism.model';
import { Goshala } from '../goshalas/goshala.model';
import { WelfareHomes } from '../welfare/welfare-homes.model';
import { State } from '../../common/models/state.model';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Village,
			Block,
			District,
			Temple,
			Event,
			TempleNearbyTourismPlace,
			Goshala,
			WelfareHomes,
			State,
		]),
	],
	controllers: [GlobalSearchController],
	providers: [GlobalSearchService],
	exports: [GlobalSearchService],
})
export class GlobalSearchModule {}
