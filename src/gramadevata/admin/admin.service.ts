import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import * as fs from 'fs';
import * as path from 'path';
import { MemberStatus } from '../../common/enums/member-status.enum';
import { Chat } from '../chat/chat.model';
import { Comment } from '../comments/comment.model';
import { Connect } from '../connect/connect.model';
import { Register as User } from '../auth/user.model';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Connect)
    private readonly connectModel: typeof Connect,
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment,
    @InjectModel(Chat)
    private readonly chatModel: typeof Chat,
    private readonly sequelize: Sequelize,
    private readonly configService: ConfigService
  ) {}

  async deleteMember(id: string, requestUser?: Record<string, unknown>) {
    const requestUserId = String(requestUser?.user_id ?? requestUser?.id ?? '');
    if (!requestUserId) {
      return {
        status: 401,
        body: { detail: 'Authentication required' },
      };
    }

    if (requestUserId !== String(id)) {
      return {
        status: 403,
        body: { detail: "You are not allowed to delete another user's member data." },
      };
    }

    const profile = await this.userModel.findByPk(id);
    if (!profile) {
      return {
        status: 404,
        body: { detail: 'Object not found' },
      };
    }

    if ((profile.type || '').toUpperCase().includes('PUJARI')) {
      return {
        status: 400,
        body: { detail: 'Please delete your Pujari details before deleting Member details.' },
      };
    }

    await this.logDeletedUserData(profile, 'member', requestUserId);

    profile.fullName = null as unknown as string;
    profile.firstName = null as unknown as string;
    profile.lastName = null as unknown as string;
    profile.fatherName = null as unknown as string;
    profile.gender = null as unknown as string;
    profile.accountType = null as unknown as string;
    profile.email = null as unknown as string;
    profile.maritalStatus = null as unknown as string;
    profile.surname = null as unknown as string;
    profile.motherName = null as unknown as string;
    profile.gotram = null as unknown as string;
    profile.siblings = null as unknown as string;
    profile.husband = null as unknown as string;
    profile.wife = null as unknown as string;
    profile.children = null as unknown as string;
    profile.profilePic = null as unknown as string;

    await this.connectModel.destroy({ where: { userId: profile.id } });
    await this.commentModel.destroy({ where: { userId: profile.id } });
    await this.chatModel.destroy({ where: { userId: profile.id } });

    profile.isMember = MemberStatus.false;
    profile.type = this.updateMemberTypeOnDelete(profile.type, 'member');
    await profile.save();

    return {
      status: 200,
      body: { detail: 'Member details removed successfully.' },
    };
  }

  async deletePujari(id: string, requestUser?: Record<string, unknown>) {
    const requestUserId = String(requestUser?.user_id ?? requestUser?.id ?? '');
    if (!requestUserId) {
      return {
        status: 401,
        body: { detail: 'Authentication required' },
      };
    }

    if (requestUserId !== String(id)) {
      return {
        status: 403,
        body: { detail: "You are not allowed to delete another user's pujari data." },
      };
    }

    const profile = await this.userModel.findByPk(id);
    if (!profile) {
      return {
        status: 404,
        body: { detail: 'Object not found' },
      };
    }

    await this.logDeletedUserData(profile, 'pujari', requestUserId);

    profile.voluntaryLevel = null as unknown as string;
    profile.pujariExpertise = null as unknown as string;
    profile.pujariIdType = null as unknown as string;
    profile.pujariIdImage = null as unknown as string;
    profile.pujariCertificateType = null as unknown as string;
    profile.issuedBy = null as unknown as string;
    profile.pujariType = null as unknown as string;
    profile.pujariVideo = [];
    profile.pujariCertificate = [];
    profile.workingTemple = null as unknown as string;
    profile.pujariDesignation = null as unknown as string;

    await (profile as unknown as { $set: (key: string, value: unknown) => Promise<void> }).$set(
      'pujariCategories',
      []
    );
    await (profile as unknown as { $set: (key: string, value: unknown) => Promise<void> }).$set(
      'pujariSubCategories',
      []
    );

    await this.connectModel.destroy({ where: { userId: profile.id } });
    await this.commentModel.destroy({ where: { userId: profile.id } });
    await this.chatModel.destroy({ where: { userId: profile.id } });

    const newType = this.updateMemberTypeOnDelete(profile.type, 'pujari');
    if (newType) {
      profile.type = newType;
    } else if (profile.isMember === MemberStatus.true) {
      profile.type = 'MEMBER';
    } else {
      profile.type = '';
    }

    await profile.save();

    return {
      status: 200,
      body: { detail: 'Pujari details removed successfully.' },
    };
  }

  async deleteImage(id: string, payload: Record<string, unknown>) {
    const action = typeof payload.action === 'string' ? payload.action : '';
    if (action !== 'delete_family_image') {
      return {
        status: 400,
        body: { error: 'Invalid action.' },
      };
    }

    const profile = await this.userModel.findByPk(id);
    if (!profile) {
      return {
        status: 404,
        body: { detail: 'Object not found' },
      };
    }

    const rawIndex = payload.index;
    const index = typeof rawIndex === 'number' ? rawIndex : Number(rawIndex);
    if (!Number.isInteger(index)) {
      return {
        status: 400,
        body: { error: 'A valid index is required.' },
      };
    }

    const images = this.coerceImageList(profile.familyImages);
    if (index < 0 || index >= images.length) {
      return {
        status: 400,
        body: { error: 'Index out of range.' },
      };
    }

    const filePathToDelete = images[index];
    const basePath = this.configService.get<string>('FILE_URL') || '';
    if (basePath) {
      const fullPath = path.join(basePath, filePathToDelete);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    images.splice(index, 1);
    profile.familyImages = images;
    await profile.save({ fields: ['familyImages'] });

    return {
      status: 200,
      body: { message: 'Family image deleted successfully.' },
    };
  }

  private updateMemberTypeOnDelete(currentType?: string | null, removeRole?: string) {
    if (!currentType || !removeRole) {
      return currentType || '';
    }

    const roles = currentType
      .split('/')
      .map((role) => role.trim().toUpperCase())
      .filter(Boolean);
    const remove = removeRole.trim().toUpperCase();
    const filtered = roles.filter((role) => role !== remove);
    return filtered.join('/');
  }

  private async logDeletedUserData(profile: User, role: string, deletedBy: string) {
    let profileData: Record<string, unknown> = {};

    if (role === 'member') {
      profileData = {
        first_name: profile.firstName ?? null,
        last_name: profile.lastName ?? null,
        father_name: profile.fatherName ?? null,
        contact_number: profile.contactNumber ?? null,
        email: profile.email ?? null,
        gender: profile.gender ?? null,
        account_type: profile.accountType ?? null,
        type: profile.type ?? null,
        marital_status: profile.maritalStatus ?? null,
        surname: profile.surname ?? null,
        mother_name: profile.motherName ?? null,
        gotram: profile.gotram ?? null,
        siblings: profile.siblings ?? null,
        husband: profile.husband ?? null,
        wife: profile.wife ?? null,
        children: profile.children ?? null,
        profile_pic: profile.profilePic ?? null,
      };
    } else if (role === 'pujari') {
      profileData = {
        voluntary_level: profile.voluntaryLevel ?? null,
        pujari_expertise: profile.pujariExpertise ?? null,
        pujari_id_type: profile.pujariIdType ?? null,
        pujari_id_image: profile.pujariIdImage ?? null,
        pujari_certificate_type: profile.pujariCertificateType ?? null,
        issued_by: profile.issuedBy ?? null,
        pujari_type: profile.pujariType ?? null,
        pujari_video: profile.pujariVideo ?? [],
        pujari_certificate: profile.pujariCertificate ?? [],
        working_temple: profile.workingTemple ?? null,
        pujari_designation: profile.pujariDesignation ?? null,
      };
    }

    const connections = await this.connectModel.findAll({ where: { userId: profile.id } });
    const comments = await this.commentModel.findAll({ where: { userId: profile.id } });
    const chats = await this.chatModel.findAll({ where: { userId: profile.id } });

    const fullData = {
      profile: profileData,
      connections: connections.map((record) => record.get({ plain: true })),
      comments: comments.map((record) => record.get({ plain: true })),
      chats: chats.map((record) => record.get({ plain: true })),
    };

    await this.sequelize.query(
      'INSERT INTO deleted_user_data (user_id, deleted_by, role, data) VALUES (:user_id, :deleted_by, :role, :data)',
      {
        replacements: {
          user_id: String(profile.id),
          deleted_by: String(deletedBy),
          role,
          data: JSON.stringify(fullData),
        },
        type: QueryTypes.INSERT,
      }
    );
  }

  private coerceImageList(value: unknown): string[] {
    if (!value) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter(Boolean);
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item)).filter(Boolean);
        }
      } catch {
        return value.replace(/\[|\]/g, '').split(',').map((item) => item.trim()).filter(Boolean);
      }
    }
    return [String(value)].filter(Boolean);
  }
}