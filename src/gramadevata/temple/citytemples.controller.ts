import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { CityTemplesService } from './citytemples.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata/citytemples_bylocation')
@ApiTags('citytemples_bylocation')
export class CityTemplesController {
  constructor(private readonly cityTemplesService: CityTemplesService) {}

  @Get()
  async getByLocation(@Query() query: Record<string, string | undefined>) {
    const result = await this.cityTemplesService.getByLocation(query);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}
