import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
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
import { AddVillageDetailsService } from './add-village-details.service';

@Controller('gramadevata/add_more_village_details')
@ApiTags('add_more_village_details')
export class AddVillageDetailsController {
  constructor(private readonly addVillageDetailsService: AddVillageDetailsService) {}

  @Get()
  async list(@Query() query: Record<string, string | undefined>) {
    return this.addVillageDetailsService.list(query);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const record = await this.addVillageDetailsService.getById(id);
    if (!record) {
      throw new NotFoundException('Object not found');
    }
    return record;
  }

  @Post()
  async create(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> }
  ) {
    const result = await this.addVillageDetailsService.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Patch(':id')
  async patchById(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>
  ) {
    const updated = await this.addVillageDetailsService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Put(':id')
  async putById(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>
  ) {
    const updated = await this.addVillageDetailsService.update(id, payload);
    if (!updated) {
      throw new NotFoundException('Object not found');
    }
    return updated;
  }

  @Delete(':id')
  @HttpCode(204)
  async deleteById(@Param('id') id: string) {
    const removed = await this.addVillageDetailsService.remove(id);
    if (!removed) {
      throw new NotFoundException('Object not found');
    }
  }
}
