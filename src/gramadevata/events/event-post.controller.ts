import { Body, Controller, HttpException, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EventService } from './event.service';

@Controller('gramadevata')
@ApiTags('eventpost')
export class EventPostController {
  constructor(private readonly eventService: EventService) {}

  @Post('eventpost')
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> }
  ) {
    const result = await this.eventService.createEventPost(payload, req.user);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}
