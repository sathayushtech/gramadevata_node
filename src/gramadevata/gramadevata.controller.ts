import { Controller, Get } from '@nestjs/common';

@Controller('gramadevata')
export class GramadevataController {
  @Get('health')
  getHealth() {
    return { status: 'ok' };
  }
}
