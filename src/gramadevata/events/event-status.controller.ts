import { Controller, Get, HttpException, NotFoundException, Param, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventService } from './event.service';

@Controller('gramadevata')
export class EventStatusController {
  constructor(private readonly eventService: EventService) {}

  @Get('eventsmain')
  @ApiTags('eventsmain')
  async getEventsMain(): Promise<Record<string, unknown>> {
    return this.eventService.getEventsMain();
  }

  @Get('eventsstatus')
  @ApiTags('eventsstatus')
  async listEventStatus(
    @Query() query: Record<string, string | undefined>,
    @Req() req: { protocol?: string; get?: (name: string) => string | undefined; path?: string; originalUrl?: string }
  ) {
    const basePath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path ?? '';
    const host = req.get?.('host');
    const protocol = req.protocol ?? 'http';
    const baseUrl = host ? `${protocol}://${host}${basePath}` : basePath;

    return this.eventService.listEventStatus(query, baseUrl);
  }

  @Get('events_inactive')
  @ApiTags('events_inactive')
  async listInactiveEvents(@Query() query: Record<string, string | undefined>) {
    const result = await this.eventService.listInactiveEvents(query);
    if (result.status !== 200) {
      throw new NotFoundException(result.body);
    }
    return result;
  }

  @Get('events_inactive_get/:field_name/:input_value')
  @ApiTags('events_inactive_get')
  async getInactiveByField(
    @Param('field_name') fieldName: string,
    @Param('input_value') inputValue: string
  ): Promise<unknown> {
    const result = await this.eventService.getInactiveEventByField(fieldName, inputValue);
    if (result.status !== 200) {
      throw new HttpException(result.body as any, result.status);
    }
    return result.body as unknown;
  }

  @Get('globalevents')
  @ApiTags('GlobalEvents')
  async getGlobalEvents(
    @Query() query: Record<string, string | undefined>,
    @Req() req: { protocol?: string; get?: (name: string) => string | undefined; path?: string; originalUrl?: string }
  ) {
    const basePath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path ?? '';
    const host = req.get?.('host');
    const protocol = req.protocol ?? 'http';
    const baseUrl = host ? `${protocol}://${host}${basePath}` : basePath;

    return this.eventService.listGlobalEvents(query, baseUrl);
  }
}
