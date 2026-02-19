import { Router } from 'express';
import commentRouter from './commentRouter.js';
import villageRouter from './villageRouter.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.use('/comment', commentRouter);
router.use('/village', villageRouter);

export default router;
