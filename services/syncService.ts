
import { User, SystemData } from '../types';

const API_URL = './api.php';

export const saveToCloud = async (data: { users: User[], systems: SystemData[] }) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        users: data.users,
        systems: data.systems,
        updatedAt: new Date().toISOString()
      }),
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error saving:', error);
    return false;
  }
};

export const loadFromCloud = async () => {
  try {
    const response = await fetch(`${API_URL}?cache=${Date.now()}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error loading:', error);
    return null;
  }
};
