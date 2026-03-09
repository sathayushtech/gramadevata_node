import { Body, Controller, HttpException, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddMorePoojaStoreService } from './add-more-pooja-store.service';

@Controller('gramadevata')
export class PoojaStoreMergeController {
  constructor(private readonly addMorePoojaStoreService: AddMorePoojaStoreService) {}

  @Put('pooja_store_merge/:pooja_store_id')
  @ApiTags('pooja_store_merge')
  async mergePoojaStore(
    @Param('pooja_store_id') poojaStoreId: string,
    @Body() payload: Record<string, unknown>
  ) {
    const result = await this.addMorePoojaStoreService.mergePoojaStoreDetails(poojaStoreId, payload ?? {});
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}