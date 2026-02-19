import { Router } from 'express';
import {
  create as createVillage,
  getById as getVillageById,
  list as listVillages,
  remove as removeVillage,
  update as updateVillage,
} from '../controllers/villageController.js';

const router = Router();

router.post('/', (req, res) => {
  // #swagger.tags = ['Village']
  return createVillage(req, res);
});

router.get('/', (req, res) => {
  // #swagger.tags = ['Village']
  return listVillages(req, res);
});

router.get('/:id', (req, res) => {
  // #swagger.tags = ['Village']
  return getVillageById(req, res);
});

router.put('/:id', (req, res) => {
  // #swagger.tags = ['Village']
  return updateVillage(req, res);
});

router.delete('/:id', (req, res) => {
  // #swagger.tags = ['Village']
  return removeVillage(req, res);
});

export default router;
