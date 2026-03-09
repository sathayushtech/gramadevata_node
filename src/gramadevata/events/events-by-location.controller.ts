import { Controller, Get, Query, Param, Req } from '@nestjs/common';
import { EventService } from './event.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata/Events')
@ApiTags('EventsByLocation')
export class EventsByLocationController {
  constructor(private readonly eventService: EventService) {}

  @Get('state_id/:state_id')
  async getByState(@Param('state_id') stateId: string): Promise<Record<string, unknown>[]> {
    return this.eventService.getByState(stateId);
  }

  @Get('district_id/:district_id')
  async getByDistrict(@Param('district_id') districtId: string): Promise<Record<string, unknown>[]> {
    return this.eventService.getByDistrict(districtId);
  }

  @Get('block_id/:block_id')
  async getByBlock(@Param('block_id') blockId: string): Promise<Record<string, unknown>[]> {
    return this.eventService.getByBlock(blockId);
  }

  @Get('InactivelocationByEvents')
  async getInactiveByLocation(@Query() query: Record<string, string | undefined>) {
    return this.eventService.getInactiveByLocation(query.input_value, query.category);
  }

  @Get('locationByEvents')
  async getByLocation(@Query() query: Record<string, string | undefined>) {
    return this.eventService.getByLocation(query.input_value, query.category);
  }

  @Get('indiaevents')
  async getIndiaEvents(
    @Query() query: Record<string, string | undefined>,
    @Req() req: { protocol?: string; get?: (name: string) => string | undefined; path?: string; originalUrl?: string }
  ) {
    const basePath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path ?? '';
    const host = req.get?.('host');
    const protocol = req.protocol ?? 'http';
    const baseUrl = host ? `${protocol}://${host}${basePath}` : basePath;

    return this.eventService.listIndianEvents(query, baseUrl);
  }
}
