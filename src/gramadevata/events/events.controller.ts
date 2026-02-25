import { Controller, Get, Param } from '@nestjs/common';
import { EventsService } from './events.service';
import { ApiTags } from '@nestjs/swagger';

@Controller('gramadevata/Events')
@ApiTags('Events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('state_id/:state_id')
  async getByState(@Param('state_id') stateId: string): Promise<Record<string, unknown>[]> {
    return this.eventsService.getByState(stateId);
  }

  @Get('district_id/:district_id')
  async getByDistrict(@Param('district_id') districtId: string): Promise<Record<string, unknown>[]> {
    return this.eventsService.getByDistrict(districtId);
  }

  @Get('block_id/:block_id')
  async getByBlock(@Param('block_id') blockId: string): Promise<Record<string, unknown>[]> {
    return this.eventsService.getByBlock(blockId);
  }
}
