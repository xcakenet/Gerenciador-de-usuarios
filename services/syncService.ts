
import { User, SystemData } from '../types';

const API_URL = './api.php';

export const saveToCloud = async (data: { users: User[], systems: SystemData[] }) => {
  try {
    const payload = JSON.stringify({
      users: data.users,
      systems: data.systems,
      updatedAt: new Date().toISOString()
    });

    // Usar FormData em vez de JSON bruto evita bloqueios de firewall (Erro 403)
    const formData = new FormData();
    formData.append('data', payload);

    const response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
      // Omitimos o Content-Type para que o navegador defina como multipart/form-data corretamente
    });

    if (!response.ok) {
      console.error('Erro HTTP:', response.status);
      return false;
    }
    
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
