
import { User, SystemData } from '../types';

/**
 * Bridge para o Banco de Dados MySQL (Hostinger)
 * O arquivo api.php deve estar na mesma pasta ou URL base do app.
 */
const API_URL = './api.php';

export const saveToCloud = async (workspaceKey: string, data: { users: User[], systems: SystemData[] }) => {
  if (!workspaceKey) return false;
  
  try {
    const payload = {
      users: data.users,
      systems: data.systems,
      updatedAt: new Date().toISOString()
    };

    const response = await fetch(`${API_URL}?ws=${workspaceKey}`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('MySQL Bridge recusou a gravação:', response.status);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Falha ao conectar com o MySQL Bridge:', error);
    return false;
  }
};

export const loadFromCloud = async (workspaceKey: string) => {
  if (!workspaceKey) return null;
  
  try {
    const response = await fetch(`${API_URL}?ws=${workspaceKey}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Workspace novo no MySQL.');
        return null;
      }
      return null;
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.warn('Banco MySQL offline ou api.php não configurado.');
    return null;
  }
};
