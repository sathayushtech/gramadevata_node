import Comment from '../models/comment.js';

export const createComment = async (payload) => Comment.create(payload);

export const getCommentById = async (id) => Comment.findByPk(id);

export const listComments = async (filters = {}) => Comment.findAll({ where: filters });

export const updateComment = async (id, payload) => {
  const comment = await Comment.findByPk(id);

  if (!comment) {
    return null;
  }

  await comment.update(payload);

  return comment;
};

export const deleteComment = async (id) => {
  const comment = await Comment.findByPk(id);

  if (!comment) {
    return false;
  }

  await comment.destroy();

  return true;
};
