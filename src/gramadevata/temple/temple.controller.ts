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
import { TempleService } from './temple.service';

@Controller('gramadevata')
@ApiTags('temple')
export class TempleController {
  constructor(private readonly service: TempleService) {}

  @Get('temple')
  async list(
    @Query() query: Record<string, string | undefined>,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    return this.service.list('/gramadevata/temple', query, req.user);
  }

  @Get('temple/:id')
  async getById(@Param('id') id: string, @Req() req: { user?: Record<string, unknown> }): Promise<any> {
    const temple = await this.service.getById(id, req.user);
    if (!temple) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return temple;
  }

  @Post('temple')
  async create(@Body() payload: Record<string, unknown>, @Req() req: { user?: Record<string, unknown> }): Promise<any> {
    const result = await this.service.create(payload, req.user);
    if (result.status !== 201) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Patch('temple/:id')
  async patch(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    const result = await this.service.update(id, payload, req.user);
    if (result.status === 404) {
      throw new NotFoundException(result.body);
    }
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Put('temple/:id')
  async put(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    return this.patch(id, payload, req);
  }

  @Delete('temple/:id')
  async remove(@Param('id') id: string): Promise<any> {
    const result = await this.service.remove(id);
    if (result.status === 404) {
      throw new NotFoundException(result.body);
    }
    return result.body;
  }

  @Get('locationByTemples')
  async locationByTemples(@Query() query: Record<string, string | undefined>): Promise<any> {
    try {
      return await this.service.locationByTemples('/gramadevata/locationByTemples', query);
    } catch (e) {
      throw new HttpException({ message: e instanceof Error ? e.message : String(e) }, 400);
    }
  }

  @Get('InactivelocationByTemples')
  async inactiveLocationByTemples(@Query() query: Record<string, string | undefined>): Promise<any> {
    try {
      return await this.service.inactiveLocationByTemples('/gramadevata/InactivelocationByTemples', query);
    } catch (e) {
      throw new HttpException({ message: e instanceof Error ? e.message : String(e) }, 400);
    }
  }

  @Get('temple_inactive')
  async listInactive(@Query() query: Record<string, string | undefined>): Promise<any> {
    return this.service.listInactive('/gramadevata/temple_inactive', query);
  }

  @Get('temple_inactive_get/:fieldName/:inputValue')
  async getInactiveByField(
    @Param('fieldName') fieldName: string,
    @Param('inputValue') inputValue: string,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    return this.service.getInactiveByField(fieldName, inputValue, req.user);
  }

  @Get('templedetail/:id')
  async templeDetail(@Param('id') id: string, @Req() req: { user?: Record<string, unknown> }): Promise<any> {
    const temple = await this.service.getById(id, req.user);
    if (!temple) {
      throw new NotFoundException({ message: 'Object not found', status: 404 });
    }
    return temple;
  }

  @Get('templemain')
  async templeMain(@Req() req: { user?: Record<string, unknown> }): Promise<any> {
    return this.service.getTempleMain(req.user);
  }

  @Post('templepost')
  async createWithMembershipCheck(
    @Body() payload: Record<string, unknown>,
    @Req() req: { user?: Record<string, unknown> },
  ): Promise<any> {
    const result = await this.service.createWithMembershipCheck(payload, req.user);
    if (result.status >= 400) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}
