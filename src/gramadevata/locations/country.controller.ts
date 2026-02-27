import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CountryService } from './country.service';

@Controller('gramadevata/country')
@ApiTags('country')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  async list(@Query('page_type') pageType?: string) {
    const countries = await this.countryService.list(pageType);

    if (!countries.length) {
      throw new NotFoundException({
        message: 'Data not found',
        status: 404,
      });
    }

    return countries;
  }
}
