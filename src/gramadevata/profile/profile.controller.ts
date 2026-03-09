import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('gramadevata')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /** PUT /gramadevata/profile/:id */
  @Put('profile/:id')
  async updateProfile(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.profileService.updateProfile(id, body);
  }

  /** DELETE /gramadevata/profile_delete/:id */
  @Delete('profile_delete/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async deleteProfile(@Param('id') id: string, @Req() req: any) {
    const requestUser = req.user as Record<string, string>;
    await this.profileService.deleteProfile(id, requestUser.user_id);
    return { detail: 'Profile deleted successfully.' };
  }

  /** GET /gramadevata/profile_get */
  @Get('profile_get')
  async getProfiles(@Query() query: Record<string, string>) {
    return this.profileService.getProfiles(query);
  }

  /** GET /gramadevata/profile_get_by_id/:id */
  @Get('profile_get_by_id/:id')
  async getProfileById(@Param('id') id: string, @Req() req: any) {
    // Optional auth — grab user id if token present but don't require it
    let requestUserId: string | undefined;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.verify(
          authHeader.split(' ')[1],
          process.env.JWT_SECRET || 'secret',
        ) as Record<string, string>;
        requestUserId = decoded.user_id;
      }
    } catch {
      // token absent or invalid — treat as anonymous
    }
    return this.profileService.getProfileById(id, requestUserId);
  }

  /** PUT /gramadevata/profileimages/:id */
  @Put('profileimages/:id')
  async updateProfileImages(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.profileService.updateProfileImages(id, body);
  }

  /** PUT /gramadevata/updateroots/:id */
  @Put('updateroots/:id')
  @UseGuards(JwtAuthGuard)
  async updateRoots(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.profileService.updateRoots(id, body);
  }
}
