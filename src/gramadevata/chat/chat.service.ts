import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { CreationAttributes } from 'sequelize';
import { Op } from 'sequelize';
import { Chat } from './chat.model';
import { Register as User } from '../auth/user.model';
import { Temple } from '../temple/temple.model';
import { Village } from '../villages/village.model';

type CreateResult = {
  status: number;
  body: Record<string, unknown>;
};

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat)
    private readonly chatModel: typeof Chat,
    @InjectModel(User)
    private readonly userModel: typeof User,
    @InjectModel(Temple)
    private readonly templeModel: typeof Temple,
    @InjectModel(Village)
    private readonly villageModel: typeof Village,
  ) {}

  async list(query: Record<string, string | undefined>) {
    const filters = this.buildFilters(query);
    const templeId = filters.templeId;
    const villageId = filters.villageId;

    const templeMessages = await this.chatModel.findAll({
      where: {
        ...filters,
        chatEntityType: 'temple',
      },
      order: [['createdAt', 'ASC']],
      include: [{ model: User, as: 'user' }],
    });

    const adminTempleMessages = await this.chatModel.findAll({
      where: {
        chatUserType: 'admin',
        chatEntityType: 'temple',
      },
      order: [['createdAt', 'ASC']],
      include: [{ model: User, as: 'user' }],
    });

    const combinedTempleMessages = this.mergeUniqueMessages([
      ...templeMessages,
      ...adminTempleMessages,
    ]);

    const villageMessages = await this.chatModel.findAll({
      where: {
        ...filters,
        chatEntityType: 'village',
      },
      order: [['createdAt', 'ASC']],
      include: [{ model: User, as: 'user' }],
    });

    const adminVillageMessages = await this.chatModel.findAll({
      where: {
        chatUserType: 'admin',
        chatEntityType: 'village',
      },
      order: [['createdAt', 'ASC']],
      include: [{ model: User, as: 'user' }],
    });

    const combinedVillageMessages = this.mergeUniqueMessages([
      ...villageMessages,
      ...adminVillageMessages,
    ]);

    if (templeId) {
      if (!combinedTempleMessages.length) {
        return { status: 404, body: { message: 'Data not found for temple', status: 404 } };
      }

      return {
        status: 200,
        body: { temple_messages: combinedTempleMessages.map((chat) => this.toResponse(chat)) },
      };
    }

    if (villageId) {
      if (!combinedVillageMessages.length) {
        return { status: 404, body: { message: 'Data not found for village', status: 404 } };
      }

      return {
        status: 200,
        body: { village_messages: combinedVillageMessages.map((chat) => this.toResponse(chat)) },
      };
    }

    const allMessages = this.mergeUniqueMessages([
      ...combinedTempleMessages,
      ...combinedVillageMessages,
    ]);

    if (!allMessages.length) {
      return { status: 404, body: { message: 'No messages found', status: 404 } };
    }

    return {
      status: 200,
      body: { all_messages: allMessages.map((chat) => this.toResponse(chat)) },
    };
  }

  async getById(id: string): Promise<Record<string, unknown> | null> {
    const record = await this.chatModel.findByPk(id, {
      include: [{ model: User, as: 'user' }],
    });

    if (!record) {
      return null;
    }

    return this.toResponse(record);
  }

  async create(payload: Record<string, unknown>, userPayload?: Record<string, unknown>): Promise<CreateResult> {
    try {
      const message = typeof payload.message === 'string' ? payload.message : null;
      if (!message) {
        return { status: 400, body: { error: 'message is required' } };
      }

      const user = await this.findUser(userPayload);
      if (!user) {
        return { status: 404, body: { message: 'User not found.' } };
      }

      const templeId = this.getId(payload.temple ?? payload.temple_id ?? payload.templeId);
      const villageId = this.getId(payload.village ?? payload.village_id ?? payload.villageId);

      if (!templeId && !villageId) {
        return { status: 400, body: { error: 'You must specify a temple or village to send a message.' } };
      }

      const chatUserType = user.isStaff ? 'admin' : 'user';
      const chatEntityType = templeId ? 'temple' : 'village';

      if (user.isStaff) {
        if (templeId) {
          const temple = await this.templeModel.findByPk(templeId);
          if (!temple) {
            return { status: 404, body: { message: 'Temple not found.' } };
          }

          const existing = await this.chatModel.findOne({
            where: { templeId, message },
          });

          if (!existing) {
            await this.chatModel.create({
              userId: user.id,
              templeId,
              message,
              chatUserType,
              chatEntityType,
            } as CreationAttributes<Chat>);
          }

          return { status: 201, body: { message: 'Message broadcasted to all temples.' } };
        }

        if (villageId) {
          const village = await this.villageModel.findByPk(villageId);
          if (!village) {
            return { status: 404, body: { message: 'Village not found.' } };
          }

          const existing = await this.chatModel.findOne({
            where: { villageId, message },
          });

          if (!existing) {
            await this.chatModel.create({
              userId: user.id,
              villageId,
              message,
              chatUserType,
              chatEntityType,
            } as CreationAttributes<Chat>);
          }

          return { status: 201, body: { message: 'Message broadcasted to all villages.' } };
        }
      }

      const created = await this.chatModel.create({
        userId: user.id,
        templeId: templeId ?? null,
        villageId: villageId ?? null,
        message,
        chatUserType,
        chatEntityType,
      } as CreationAttributes<Chat>);

      const hydrated = await this.chatModel.findByPk(created.id, {
        include: [{ model: User, as: 'user' }],
      });

      return {
        status: 201,
        body: hydrated ? this.toResponse(hydrated) : this.toResponse(created),
      };
    } catch (error) {
      return {
        status: 500,
        body: {
          message: 'An error occurred.',
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  async update(id: string, payload: Record<string, unknown>) {
    const record = await this.chatModel.findByPk(id, {
      include: [{ model: User, as: 'user' }],
    });
    if (!record) {
      return null;
    }

    const updateData = this.mapUpdatePayload(payload);
    if (Object.keys(updateData).length) {
      await record.update(updateData as CreationAttributes<Chat>);
    }

    return this.toResponse(record);
  }

  async remove(id: string) {
    const record = await this.chatModel.findByPk(id);
    if (!record) {
      return false;
    }

    await record.destroy();
    return true;
  }

  private buildFilters(query: Record<string, string | undefined>) {
    const filters: Record<string, string> = {};

    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) {
        return;
      }

      switch (key) {
        case '_id':
        case 'id':
          filters.id = value;
          break;
        case 'message':
          filters.message = value;
          break;
        case 'user':
        case 'user_id':
          filters.userId = value;
          break;
        case 'temple':
        case 'temple_id':
          filters.templeId = value;
          break;
        case 'village':
        case 'village_id':
          filters.villageId = value;
          break;
        case 'chat_user_type':
          filters.chatUserType = value;
          break;
        case 'chat_entity_type':
          filters.chatEntityType = value;
          break;
        default:
          break;
      }
    });

    return filters;
  }

  private mapUpdatePayload(payload: Record<string, unknown>) {
    const updateData: Partial<Chat> = {};

    if (Object.prototype.hasOwnProperty.call(payload, 'message') && typeof payload.message === 'string') {
      updateData.message = payload.message;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'chat_user_type') && typeof payload.chat_user_type === 'string') {
      updateData.chatUserType = payload.chat_user_type;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'chatUserType')
      && typeof payload.chatUserType === 'string') {
      updateData.chatUserType = payload.chatUserType;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'chat_entity_type')
      && typeof payload.chat_entity_type === 'string') {
      updateData.chatEntityType = payload.chat_entity_type;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'chatEntityType')
      && typeof payload.chatEntityType === 'string') {
      updateData.chatEntityType = payload.chatEntityType;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'temple') && typeof payload.temple === 'string') {
      updateData.templeId = payload.temple;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'temple_id')
      && typeof payload.temple_id === 'string') {
      updateData.templeId = payload.temple_id;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'templeId')
      && typeof payload.templeId === 'string') {
      updateData.templeId = payload.templeId;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'village') && typeof payload.village === 'string') {
      updateData.villageId = payload.village;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'village_id')
      && typeof payload.village_id === 'string') {
      updateData.villageId = payload.village_id;
    } else if (Object.prototype.hasOwnProperty.call(payload, 'villageId')
      && typeof payload.villageId === 'string') {
      updateData.villageId = payload.villageId;
    }

    return updateData;
  }

  private async findUser(userPayload?: Record<string, unknown>) {
    if (!userPayload) {
      return null;
    }

    const email = typeof userPayload.email === 'string' ? userPayload.email : undefined;
    const contactNumber = typeof userPayload.contact_number === 'string'
      ? userPayload.contact_number
      : typeof userPayload.contactNumber === 'string'
        ? userPayload.contactNumber
        : undefined;
    const userId = typeof userPayload.user_id === 'string'
      ? userPayload.user_id
      : typeof userPayload.id === 'string'
        ? userPayload.id
        : undefined;

    if (email || contactNumber) {
      const orConditions = [] as Record<string, string>[];
      if (email) {
        orConditions.push({ email });
      }
      if (contactNumber) {
        orConditions.push({ contactNumber });
      }

      const user = await this.userModel.findOne({
        where: { [Op.or]: orConditions },
      });

      if (user) {
        return user;
      }
    }

    if (userId) {
      return this.userModel.findByPk(userId);
    }

    return null;
  }

  private getId(value: unknown) {
    return typeof value === 'string' ? value : undefined;
  }

  private toResponse(record: Chat): Record<string, unknown> {
    return {
      _id: record.id,
      message: record.message,
      user: this.mapUser(record.user),
      village: record.villageId ?? null,
      created_at: record.createdAt,
      posted_time_ago: this.relativeTime(record.createdAt),
      temple: record.templeId ?? null,
      chat_user_type: record.chatUserType ?? null,
      chat_entity_type: record.chatEntityType ?? null,
    };
  }

  private mapUser(user?: User | null) {
    if (!user) {
      return null;
    }

    return {
      _id: user.id,
      name: user.fullName ?? null,
      father_name: user.fatherName ?? null,
      contact_number: user.contactNumber ?? null,
      dob: user.dob ?? null,
      type: user.type ?? null,
      username: user.username ?? null,
    };
  }

  private mergeUniqueMessages(messages: Chat[]) {
    const unique = new Map<string, Chat>();
    messages.forEach((message) => {
      if (!unique.has(message.id)) {
        unique.set(message.id, message);
      }
    });

    return Array.from(unique.values()).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });
  }

  private relativeTime(date: Date | undefined) {
    if (!date) {
      return null;
    }

    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) {
      return 'just now';
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }

    const days = Math.floor(hours / 24);
    if (days < 30) {
      return `${days} day${days === 1 ? '' : 's'} ago`;
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return `${months} month${months === 1 ? '' : 's'} ago`;
    }

    const years = Math.floor(months / 12);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  }
}
