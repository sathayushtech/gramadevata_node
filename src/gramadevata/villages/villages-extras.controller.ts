import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VillagesService } from './villages.service';

@Controller('gramadevata')
@ApiTags('Villages')
export class VillagesExtrasController {
  constructor(private readonly villagesService: VillagesService) {}

  @Get('search_village')
  async searchVillage(@Query() query: Record<string, string | undefined>) {
    return this.villagesService.searchVillage(query);
  }

  @Get('village_inactive')
  async listInactive(@Res() res: any, @Query() query: Record<string, string | undefined>) {
    const result = await this.villagesService.listInactiveVillages(query);
    if ((result as any)?.status === 404 && (result as any)?.message === 'Data not found') {
      return res.status(404).json(result);
    }
    return res.json(result);
  }

  @Get('village_inactive_get/:field_name/:input_value')
  async getInactiveByField(
    @Res() res: any,
    @Param('field_name') fieldName: string,
    @Param('input_value') inputValue: string,
  ) {
    const result = await this.villagesService.getInactiveVillagesByField(fieldName, inputValue);

    if ((result as any)?.status === 400) {
      return res.status(400).json(result);
    }
    if ((result as any)?.status === 404 && (result as any)?.message === 'Village not found') {
      return res.status(404).json(result);
    }
    if ((result as any)?.status === 500) {
      return res.status(500).json(result);
    }

    return res.json(result);
  }
}
