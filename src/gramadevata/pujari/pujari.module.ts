import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PujariCategory } from './pujari-category.model';
import { PujariSubCategory } from './pujari-subcategory.model';
import { PujariCategoryController } from './pujari-category.controller';
import { PujariCategoryService } from './pujari-category.service';
import { PujariSubCategoryController } from './pujari-subcategory.controller';
import { PujariSubCategoryService } from './pujari-subcategory.service';

@Module({
  imports: [
    SequelizeModule.forFeature([PujariCategory, PujariSubCategory]),
  ],
  controllers: [PujariCategoryController, PujariSubCategoryController],
  providers: [PujariCategoryService, PujariSubCategoryService],
})
export class PujariModule {}
