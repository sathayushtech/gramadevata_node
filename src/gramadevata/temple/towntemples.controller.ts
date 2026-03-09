import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TownTemplesService } from './towntemples.service';

@Controller('gramadevata/towntemples_bylocation')
@ApiTags('towntemples_bylocation')
export class TownTemplesController {
  constructor(private readonly townTemplesService: TownTemplesService) {}

  @Get()
  async getByLocation(@Query() query: Record<string, string | undefined>): Promise<any> {
    const result = await this.townTemplesService.getByLocation(query);
    if (result.status !== 200) {
      throw new HttpException(result.body as Record<string, any>, result.status);
    }
    return result.body;
  }
}
