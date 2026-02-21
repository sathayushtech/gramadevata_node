import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectModel } from '@nestjs/sequelize';
import { Comment } from './comment.model';
import type { CreationAttributes } from 'sequelize';
import { CommentStatus } from '../../common/enums/comment-status.enum';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment)
    private readonly commentModel: typeof Comment
  ) {}

  async create(payload: Record<string, unknown>) {
    const rawId = typeof payload.id === 'string'
      ? payload.id
      : typeof payload._id === 'string'
        ? payload._id
        : randomUUID();
    const id = rawId.replace(/-/g, '');

    if (id.length !== 32) {
      throw new BadRequestException('Comment id must be 32 hex characters.');
    }

    const data: CreationAttributes<Comment> = {
      ...payload,
      id,
      status: (payload.status as string) || CommentStatus.ACTIVE,
      createdAt: (payload.createdAt as Date) || new Date(),
    } as CreationAttributes<Comment>;

    return this.commentModel.create(data);
  }

  async list(query: Record<string, string | undefined>) {
    const filters: Record<string, string> = {};

    if (query.templeId) filters.templeId = query.templeId;
    if (query.userId) filters.userId = query.userId;
    if (query.goshalaId) filters.goshalaId = query.goshalaId;
    if (query.eventId) filters.eventId = query.eventId;
    if (query.status) {
      filters.status = query.status;
    } else {
      filters.status = CommentStatus.ACTIVE;
    }

    return this.commentModel.findAll({ where: filters, order: [['createdAt', 'DESC']] });
  }

  async getById(id: string) {
    return this.commentModel.findByPk(id);
  }

  async update(id: string, payload: Record<string, unknown>) {
    const comment = await this.getById(id);
    if (!comment) {
      return null;
    }

    await comment.update(payload as CreationAttributes<Comment>);
    return comment;
  }

  async remove(id: string) {
    const comment = await this.getById(id);
    if (!comment) {
      return false;
    }

    comment.status = CommentStatus.INACTIVE;
    await comment.save();
    return true;
  }

  async markInactive(id: string) {
    return this.remove(id);
  }
}
