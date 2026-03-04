import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';

// Models
import { TempleNearbyTourismPlace } from './temple-nearby-tourism.model';
import { TourOperator } from './tour-operator.model';
import { TourGuide } from './tour-guide.model';
import { AddMoreTourOperator } from './add-more-tour-operator.model';
import { Village } from '../villages/village.model';
import { Block } from '../block/block.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Country } from '../../common/models/country.model';
import { Register as User } from '../auth/user.model';

// Tourism Place
import { TourismPlaceController, TourismPlaceExtraController } from './tourism-place.controller';
import { TourismPlaceService } from './tourism-place.service';

// Tour Operator
import { TourOperatorController, TourOperatorExtraController } from './tour-operator.controller';
import { TourOperatorService } from './tour-operator.service';

// Tour Guide
import { TourGuideController, TourGuideExtraController } from './tour-guide.controller';
import { TourGuideService } from './tour-guide.service';

// Add More Tour Operator (already existed)
import { AddMoreTourOperatorController } from './add-more-tour-operator.controller';
import { AddMoreTourOperatorService } from './add-more-tour-operator.service';

@Module({
  imports: [
    ConfigModule,
    SequelizeModule.forFeature([
      TempleNearbyTourismPlace,
      TourOperator,
      TourGuide,
      AddMoreTourOperator,
      Village,
      Block,
      District,
      State,
      Country,
      User,
    ]),
  ],
  controllers: [
    TourismPlaceController,
    TourismPlaceExtraController,
    TourOperatorController,
    TourOperatorExtraController,
    TourGuideController,
    TourGuideExtraController,
    AddMoreTourOperatorController,
  ],
  providers: [
    TourismPlaceService,
    TourOperatorService,
    TourGuideService,
    AddMoreTourOperatorService,
  ],
})
export class TourismModule {}
