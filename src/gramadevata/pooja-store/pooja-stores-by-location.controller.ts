import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PoojaStoreService } from './pooja-store.service';

@Controller('gramadevata')
export class PoojaStoresByLocationController         {
  constructor(private readonly poojaStoreService: PoojaStoreService) {}

  @Get('pooja_stores_by_location')
  @ApiTags('pooja_stores_by_location')
  async getByLocation(@Query() query: Record<string, string | undefined>) {
    return this.poojaStoreService.getByLocation(query);
  }
}