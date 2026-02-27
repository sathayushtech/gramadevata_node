import {
  Controller,
  Delete,
  Post,
  Body,
  HttpException,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('gramadevata')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('delete-member/:id')
  @ApiTags('delete-member')
  @UseGuards(JwtAuthGuard)
  async deleteMember(
    @Param('id') id: string,
    @Req() req: { user?: Record<string, unknown> }
  ) {
    const result = await this.adminService.deleteMember(id, req.user);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Delete('delete-pujari/:id')
  @ApiTags('delete-pujari')
  @UseGuards(JwtAuthGuard)
  async deletePujari(
    @Param('id') id: string,
    @Req() req: { user?: Record<string, unknown> }
  ) {
    const result = await this.adminService.deletePujari(id, req.user);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }

  @Post('deleteimage/:id')
  @ApiTags('delete-image')
  @UseGuards(JwtAuthGuard)
  async deleteImage(
    @Param('id') id: string,
    @Body() payload: Record<string, unknown>
  ) {
    const result = await this.adminService.deleteImage(id, payload);
    if (result.status !== 200) {
      throw new HttpException(result.body, result.status);
    }
    return result.body;
  }
}
