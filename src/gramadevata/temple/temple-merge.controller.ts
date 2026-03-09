import { Body, Controller, HttpException, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TempleMergeService } from './temple-merge.service';

@Controller('gramadevata')
@ApiTags('temple-merge')
export class TempleMergeController {
  constructor(private readonly service: TempleMergeService) {}

  /** PUT /gramadevata/templemerge/:templeId */
  @Put('templemerge/:templeId')
  async mergeTemple(
    @Param('templeId') templeId: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<any> {
    const result = await this.service.mergeTempleDetails(templeId, payload);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  /** PUT /gramadevata/temple_hotel_merge/:hotelId */
  @Put('temple_hotel_merge/:hotelId')
  async mergeHotel(
    @Param('hotelId') hotelId: string,
    @Body() payload: Record<string, unknown>,
  ): Promise<any> {
    const result = await this.service.mergeHotelDetails(hotelId, payload);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}
