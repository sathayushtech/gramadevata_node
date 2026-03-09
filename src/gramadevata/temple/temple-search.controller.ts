import { Controller, Get, HttpException, Param, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TempleSearchService } from './temple-search.service';

@Controller('gramadevata')
@ApiTags('temple-search')
export class TempleSearchController {
  constructor(private readonly service: TempleSearchService) {}

  /** GET /gramadevata/templeget/:fieldName/:inputValue */
  @Get('templeget/:fieldName/:inputValue')
  async getByField(
    @Param('fieldName') fieldName: string,
    @Param('inputValue') inputValue: string,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    const result = await this.service.getByField(fieldName, inputValue, req.user);
    if (result.status !== 200) {
      throw new HttpException(result.body as Record<string, any>, result.status);
    }
    return result.body;
  }

  /** GET /gramadevata/temples/country_id/:countryId */
  @Get('temples/country_id/:countryId')
  async templesByCountry(
    @Param('countryId') countryId: string,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    return this.service.templesByCountry(countryId, req.user);
  }

  /** GET /gramadevata/temples/state_id/:stateId */
  @Get('temples/state_id/:stateId')
  async templesByState(
    @Param('stateId') stateId: string,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    return this.service.templesByState(stateId, req.user);
  }

  /** GET /gramadevata/temples/district_id/:districtId */
  @Get('temples/district_id/:districtId')
  async templesByDistrict(
    @Param('districtId') districtId: string,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    return this.service.templesByDistrict(districtId, req.user);
  }

  /** GET /gramadevata/temples/block_id/:blockId */
  @Get('temples/block_id/:blockId')
  async templesByBlock(
    @Param('blockId') blockId: string,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    return this.service.templesByBlock(blockId, req.user);
  }

  /** GET /gramadevata/indiatemples */
  @Get('indiatemples')
  async getIndianTemples(
    @Query() query: Record<string, string | undefined>,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    return this.service.getIndianTemples('/gramadevata/indiatemples', query, req.user);
  }
}
