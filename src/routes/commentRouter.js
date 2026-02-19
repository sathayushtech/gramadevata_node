import { Router } from 'express';
import {
  create as createComment,
  getById as getCommentById,
  list as listComments,
  remove as removeComment,
  update as updateComment,
} from '../controllers/commentController.js';

const router = Router();

router.post('/', (req, res) => {
  // #swagger.tags = ['Comment']
  return createComment(req, res);
});

router.get('/', (req, res) => {
  // #swagger.tags = ['Comment']
  return listComments(req, res);
});

router.get('/:id', (req, res) => {
  // #swagger.tags = ['Comment']
  return getCommentById(req, res);
});

router.put('/:id', (req, res) => {
  // #swagger.tags = ['Comment']
  return updateComment(req, res);
});

router.delete('/:id', (req, res) => {
  // #swagger.tags = ['Comment']
  return removeComment(req, res);
});

export default router;
