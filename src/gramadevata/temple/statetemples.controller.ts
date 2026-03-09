import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StateTemplesService } from './statetemples.service';

@Controller('gramadevata/statetemples_bylocation')
@ApiTags('statetemples_bylocation')
export class StateTemplesController {
  constructor(private readonly service: StateTemplesService) {}

  @Get()
  async getByLocation(@Query() query: Record<string, string | undefined>): Promise<any> {
    const result = await this.service.getByLocation(query);
    if (result.status !== 200) {
      throw new HttpException(result.body as Record<string, any>, result.status);
    }
    return result.body;
  }
}
