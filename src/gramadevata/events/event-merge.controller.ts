import { Body, Controller, HttpException, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AddEventDetailsService } from './add-event-details.service';

@Controller('gramadevata')
@ApiTags('eventmerge')
export class EventMergeController {
  constructor(private readonly addEventDetailsService: AddEventDetailsService) {}

  @Put('eventmerge/:event_id')
  async merge(
    @Param('event_id') eventId: string,
    @Body() payload: Record<string, unknown>
  ) {
    const result = await this.addEventDetailsService.mergeEventDetails(eventId, payload);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}
