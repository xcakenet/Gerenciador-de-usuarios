
import { User, SystemData } from '../types';

const API_URL = './api.php';

export const saveToCloud = async (data: { users: User[], systems: SystemData[] }) => {
  try {
    const payload = {
      users: data.users,
      systems: data.systems,
      updatedAt: new Date().toISOString()
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Erro ao salvar no MySQL:', error);
    return false;
  }
};

export const loadFromCloud = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar do MySQL:', error);
    return null;
  }
};
