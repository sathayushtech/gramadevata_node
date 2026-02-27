import { Controller, Get, Param } from '@nestjs/common';
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
}
