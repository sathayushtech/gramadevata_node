import { Controller, Get, Param, Query, Req, Res, Body, Put, HttpException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VillagesService } from './villages.service';
import { AddVillageDetailsService } from './add-village-details.service';

@Controller('gramadevata')
@ApiTags('Villages')
export class VillagesExtrasController {
  constructor(
    private readonly villagesService: VillagesService,
    private readonly addVillageDetailsService: AddVillageDetailsService
  ) {}

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

  @Get('villages_by_location')
  async getByLocation(
    @Query() query: Record<string, string | undefined>,
    @Req() req: { protocol?: string; get?: (name: string) => string | undefined; path?: string; originalUrl?: string }
  ) {
    const basePath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path ?? '';
    const host = req.get?.('host');
    const protocol = req.protocol ?? 'http';
    const baseUrl = host ? `${protocol}://${host}${basePath}` : basePath;

    return this.villagesService.getByLocation(query, baseUrl);
  }

  @Put('mergevillage/:village_id')
  async mergeVillage(
    @Param('village_id') villageId: string,
    @Body() payload: Record<string, unknown>
  ) {
    const result = await this.addVillageDetailsService.mergeVillageDetails(villageId, payload ?? {});
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}
