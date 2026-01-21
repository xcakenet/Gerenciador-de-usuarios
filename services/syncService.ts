
import { User, SystemData } from '../types';

const API_URL = './api.php';

export const saveToCloud = async (data: { users: User[], systems: SystemData[], password?: string }) => {
  try {
    const payload = JSON.stringify({
      users: data.users,
      systems: data.systems,
      password: data.password,
      updatedAt: new Date().toISOString()
    });

    const formData = new FormData();
    formData.append('data', payload);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Erro na sincronização (Cloud):', error);
    return false;
  }
};

export const loadFromCloud = async () => {
  try {
    const response = await fetch(`${API_URL}?cache=${Date.now()}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    return null;
  }
};
