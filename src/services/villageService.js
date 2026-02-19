import Village from '../models/village.js';

export const createVillage = async (payload) => Village.create(payload);

export const getVillageById = async (id) => Village.findByPk(id);

export const listVillages = async (filters = {}) => Village.findAll({ where: filters });

export const updateVillage = async (id, payload) => {
  const village = await Village.findByPk(id);

  if (!village) {
    return null;
  }

  await village.update(payload);

  return village;
};

export const deleteVillage = async (id) => {
  const village = await Village.findByPk(id);

  if (!village) {
    return false;
  }

  await village.destroy();

  return true;
};
