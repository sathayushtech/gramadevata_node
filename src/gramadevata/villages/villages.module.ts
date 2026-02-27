import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Block } from '../block/block.model';
import { Country } from '../../common/models/country.model';
import { District } from '../../common/models/district.model';
import { State } from '../../common/models/state.model';
import { Village } from './village.model';
import { Register as User } from '../auth/user.model';
import { AddVillageDetails } from './add-village-details.model';
import { VillagesController } from './villages.controller';
import { VillagesService } from './villages.service';
import { AddVillageDetailsController } from './add-village-details.controller';
import { AddVillageDetailsService } from './add-village-details.service';
import { Geographic } from './village-geographic.model';
import { VillageGeographicController } from './geographic/village-geographic.controller';
import { VillageGeographicService } from './geographic/village-geographic.service';
import { VillageFamousPersonality } from './village-famous-personality.model';
import { VillageFamousPersonalitiesController } from './famous-personalities/village-famous-personalities.controller';
import { VillageFamousPersonalitiesService } from './famous-personalities/village-famous-personalities.service';
import { VillageDevelopmentFacility } from './village-development-facility.model';
import { VillageDevelopmentFacilitiesController } from './development-facilities/village-development-facilities.controller';
import { VillageDevelopmentFacilitiesService } from './development-facilities/village-development-facilities.service';
import { Connect } from '../connect/connect.model';
import { Temple } from '../temple/temple.model';
import { VillageSchool } from './village-school.model';
import { VillageSchoolsController } from './schools/village-schools.controller';
import { VillageSchoolsService } from './schools/village-schools.service';
import { VillageBank } from './village-bank.model';
import { VillageBanksController } from './banks/village-banks.controller';
import { VillageBanksService } from './banks/village-banks.service';
import { VillageCollege } from './village-college.model';
import { VillageCollegesController } from './colleges/village-colleges.controller';
import { VillageCollegesService } from './colleges/village-colleges.service';
import { VillageCulturalProfile } from './village-cultural-profile.model';
import { VillageCulturalProfileController } from './cultural-profile/village-cultural-profile.controller';
import { VillageCulturalProfileService } from './cultural-profile/village-cultural-profile.service';
import { VillageArtist } from './village-artist.model';
import { VillageArtistsController } from './artists/village-artists.controller';
import { VillageArtistsService } from './artists/village-artists.service';
import { VillagesExtrasController } from './villages-extras.controller';
import { VillageMarket } from './village-market.model';
import { VillageMarketsController } from './markets/village-markets.controller';
import { VillageMarketsService } from './markets/village-markets.service';
import { VillagePostOffice } from './village-post-office.model';
import { VillagePostOfficesController } from './postoffice/village-postoffices.controller';
import { VillagePostOfficesService } from './postoffice/village-postoffices.service';
import { VillageSportsground } from './village-sportsground.model';
import { VillageSportsgroundsController } from './sportsground/village-sportsgrounds.controller';
import { VillageSportsgroundsService } from './sportsground/village-sportsgrounds.service';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Village,
      Block,
      District,
      State,
      Country,
      AddVillageDetails,
      User,
      Geographic,
      VillageFamousPersonality,
      VillageDevelopmentFacility,
      Connect,
      Temple,
      VillageSchool,
      VillageBank,
      VillageCollege,
      VillageCulturalProfile,
      VillageArtist,
      VillageMarket,
      VillagePostOffice,
      VillageSportsground,
    ]),
  ],
  controllers: [
    VillagesController,
    VillagesExtrasController,
    AddVillageDetailsController,
    VillageGeographicController,
    VillageFamousPersonalitiesController,
    VillageDevelopmentFacilitiesController,
    VillageSchoolsController,
    VillageBanksController,
    VillageCollegesController,
    VillageCulturalProfileController,
    VillageArtistsController,
    VillageMarketsController,
    VillagePostOfficesController,
    VillageSportsgroundsController,
  ],
  providers: [
    VillagesService,
    AddVillageDetailsService,
    VillageGeographicService,
    VillageFamousPersonalitiesService,
    VillageDevelopmentFacilitiesService,
    VillageSchoolsService,
    VillageBanksService,
    VillageCollegesService,
    VillageCulturalProfileService,
    VillageArtistsService,
    VillageMarketsService,
    VillagePostOfficesService,
    VillageSportsgroundsService,
  ],
})
export class VillagesModule {}
