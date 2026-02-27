import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpException,
  NotFoundException,
  Patch,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventService } from './event.service';

@Controller('gramadevata/event')
@ApiTags('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    const result = await this.eventService.listEvents(query);
    if ((result as { status?: number }).status === 404) {
      throw new NotFoundException({ message: 'Data not found', status: 404 });
    }
    return result;
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const record = await this.eventService.getEventById(id);
    if (!record) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return record;
  }

  @Post()
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> }
  ) {
    const result = await this.eventService.createEvent(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body as string | Record<string, any>, result.status as number);
    }
    return result.body;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> }
  ) {
    const result = await this.eventService.updateEvent(id, payload, req.user);
    if (result.status !== 200) {
      throw new HttpException(result.body as string | Record<string, any>, result.status as number);
    }
    return result.body;
  }

  @Patch(':id')
  async patch(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> }
  ) {
    const result = await this.eventService.updateEvent(id, payload, req.user);
    if (result.status !== 200) {
      throw new HttpException(result.body as string | Record<string, any>, result.status as number);
    }
    return result.body;
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    const removed = await this.eventService.removeEvent(id);
    if (!removed) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
  }
}
