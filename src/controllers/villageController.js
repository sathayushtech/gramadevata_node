import {
  createVillage,
  deleteVillage,
  getVillageById,
  listVillages,
  updateVillage,
} from '../services/villageService.js';

const buildFilters = (query) => {
  const { blockId, status, type, name } = query;
  const filters = {};

  if (blockId) filters.blockId = blockId;
  if (status) filters.status = status;
  if (type) filters.type = type;
  if (name) filters.name = name;

  return filters;
};

export const create = async (req, res) => {
  try {
    const village = await createVillage(req.body);
    res.status(201).json(village);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create village.' });
  }
};

export const list = async (req, res) => {
  try {
    const villages = await listVillages(buildFilters(req.query));
    res.status(200).json(villages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch villages.' });
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Village id is required.' });
    }

    const village = await getVillageById(id);

    if (!village) {
      return res.status(404).json({ message: 'Village not found.' });
    }

    return res.status(200).json(village);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch village.' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Village id is required.' });
    }

    const village = await updateVillage(id, req.body);

    if (!village) {
      return res.status(404).json({ message: 'Village not found.' });
    }

    return res.status(200).json(village);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update village.' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Village id is required.' });
    }

    const deleted = await deleteVillage(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Village not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete village.' });
  }
};
