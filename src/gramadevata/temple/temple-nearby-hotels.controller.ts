import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TempleNearbyHotelsService } from './temple-nearby-hotels.service';

@Controller('gramadevata')
@ApiTags('temple-nearby-hotels')
export class TempleNearbyHotelsController {
  constructor(private readonly service: TempleNearbyHotelsService) {}

  @Get('temple-nearby-hotels')
  async list(@Query() query: Record<string, string | undefined>) {
    return this.service.list(query);
  }

  @Get('temple-nearby-hotels/:id')
  async getById(@Param('id') id: string) {
    const record = await this.service.getById(id);
    if (record === 'inactive' || record === null) {
      throw new NotFoundException({ message: 'Hotel not found', status: 404 });
    }
    return record;
  }

  @Post('temple-nearby-hotels')
  async create(@Body() payload: Record<string, unknown>, @Req() req: { user?: Record<string, unknown> }) {
    const result = await this.service.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Patch('temple-nearby-hotels/:id')
  async patch(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    const result = await this.service.update(id, payload);
    if (result.status === 404) {
      throw new NotFoundException(result.body);
    }
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Put('temple-nearby-hotels/:id')
  async put(@Param('id') id: string, @Body() payload: Record<string, unknown>) {
    return this.patch(id, payload);
  }

  @Delete('temple-nearby-hotels/:id')
  async remove(@Param('id') id: string) {
    const result = await this.service.remove(id);
    if (result.status === 404) {
      throw new NotFoundException(result.body);
    }
    return result.body;
  }

  @Get('hotels_by_location')
  async hotelsByLocation(
    @Query('input_value') inputValue?: string,
    @Query('search') search?: string,
  ) {
    if (!inputValue) {
      throw new HttpException('input_value is required', 400);
    }
    return this.service.hotelsByLocation(inputValue, search);
  }
}
