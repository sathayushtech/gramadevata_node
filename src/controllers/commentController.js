import {
  createComment,
  deleteComment,
  getCommentById,
  listComments,
  updateComment,
} from '../services/commentService.js';

const buildFilters = (query) => {
  const { templeId, userId, goshalaId, eventId, status } = query;
  const filters = {};

  if (templeId) filters.templeId = templeId;
  if (userId) filters.userId = userId;
  if (goshalaId) filters.goshalaId = goshalaId;
  if (eventId) filters.eventId = eventId;
  if (status) filters.status = status;

  return filters;
};

export const create = async (req, res) => {
  try {
    const comment = await createComment(req.body);
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create comment.' });
  }
};

export const list = async (req, res) => {
  try {
    const comments = await listComments(buildFilters(req.query));
    res.status(200).json(comments);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to fetch comments.' });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Comment id is required.' });
    }

    const comment = await getCommentById(id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    return res.status(200).json(comment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch comment.' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Comment id is required.' });
    }

    const comment = await updateComment(id, req.body);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    return res.status(200).json(comment);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update comment.' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Comment id is required.' });
    }

    const deleted = await deleteComment(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Comment not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete comment.' });
  }
};
