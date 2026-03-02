import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FireStationController } from './fire-station.controller';
import { FireStationService } from './fire-station.service';
import { FireStation } from './fire-station.model';
import { Village } from '../villages/village.model';
import { Temple } from '../temple/temple.model';
import { Register as User } from '../auth/user.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';

@Module({
	imports: [
		SequelizeModule.forFeature([FireStation, Village, Temple, User, Block, District, State, Country]),
	],
	controllers: [FireStationController],
	providers: [FireStationService],
	exports: [FireStationService],
})
export class FireStationsModule {}
