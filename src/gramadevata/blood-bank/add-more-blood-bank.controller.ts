import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  HttpException,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { AddMoreBloodBankService } from './add-more-blood-bank.service';

@Controller('gramadevata')
export class AddMoreBloodBankController {
  constructor(
    private readonly addMoreService: AddMoreBloodBankService,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  GET /gramadevata/add_more_blood_bank                               */
  /* ------------------------------------------------------------------ */
  @Get('add_more_blood_bank')
  async list() {
    return this.addMoreService.list();
  }

  /* ------------------------------------------------------------------ */
  /*  POST /gramadevata/add_more_blood_bank                              */
  /* ------------------------------------------------------------------ */
  @Post('add_more_blood_bank')
  async create(
    @Body() body: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ) {
    const result = await this.addMoreService.create(body, req.user as any);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  /* ------------------------------------------------------------------ */
  /*  GET /gramadevata/add_more_blood_bank/:id                           */
  /* ------------------------------------------------------------------ */
  @Get('add_more_blood_bank/:id')
  async retrieve(@Param('id') id: string) {
    const data = await this.addMoreService.getById(id);
    if (!data) {
      throw new NotFoundException({ message: 'Not found.' });
    }
    return data;
  }

  /* ------------------------------------------------------------------ */
  /*  PUT /gramadevata/add_more_blood_bank/:id                           */
  /* ------------------------------------------------------------------ */
  @Put('add_more_blood_bank/:id')
  async update(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.addMoreService.update(id, body);
    if (!data) {
      throw new NotFoundException({ message: 'Not found.' });
    }
    return data;
  }

  /* ------------------------------------------------------------------ */
  /*  PATCH /gramadevata/add_more_blood_bank/:id                         */
  /* ------------------------------------------------------------------ */
  @Patch('add_more_blood_bank/:id')
  async partialUpdate(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    const data = await this.addMoreService.update(id, body);
    if (!data) {
      throw new NotFoundException({ message: 'Not found.' });
    }
    return data;
  }

  /* ------------------------------------------------------------------ */
  /*  DELETE /gramadevata/add_more_blood_bank/:id                        */
  /* ------------------------------------------------------------------ */
  @Delete('add_more_blood_bank/:id')
  @HttpCode(204)
  async destroy(@Param('id') id: string) {
    const deleted = await this.addMoreService.remove(id);
    if (!deleted) {
      throw new NotFoundException({ message: 'Not found.' });
    }
  }
}
