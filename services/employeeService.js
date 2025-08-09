import { deleteFromLocal, getAllLocal, saveToLocal, syncIfOnline } from './dataHandler';

export const addEmployee = async (data) => {
  const id = `employee_${Date.now()}`;
  await saveToLocal(id, data);
  await syncIfOnline(id, data);
};

export const editEmployee = async (key, updatedData) => {
  await saveToLocal(key, updatedData);
  await syncIfOnline(key, updatedData);
};

export const deleteEmployee = async (key) => {
  await deleteFromLocal(key);
};

export const getItems = async () => {
  return await getAllLocal();
};
