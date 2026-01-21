
import { User, SystemData } from '../types';

/**
 * Armazenamento Centralizado via JSONStorage.net
 * Este serviço é ideal para aplicações na Hostinger pois permite 
 * criar 'buckets' nomeados instantaneamente.
 */
const API_URL = 'https://api.jsonstorage.net/v1/json';

export const saveToCloud = async (workspaceKey: string, data: { users: User[], systems: SystemData[] }) => {
  if (!workspaceKey) return false;
  
  try {
    const payload = JSON.stringify({
      users: data.users,
      systems: data.systems,
      updatedAt: new Date().toISOString(),
      workspace: workspaceKey
    });

    // Tentamos salvar. O JSONStorage aceita PUT para criar/atualizar se tivermos uma chave de API, 
    // mas para uso público/aberto, usamos uma estrutura de URL que ele entenda.
    // Usaremos uma abordagem de 'Public Bin' baseada na sua chave única.
    const response = await fetch(`${API_URL}/${workspaceKey}?apiKey=anonymous`, {
      method: 'PUT',
      body: payload,
      headers: { 
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Erro na API de Nuvem:', response.status);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro de conexão física:', error);
    return false;
  }
};

export const loadFromCloud = async (workspaceKey: string) => {
  if (!workspaceKey) return null;
  
  try {
    const response = await fetch(`${API_URL}/${workspaceKey}`);
    
    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
        console.log('Workspace novo. Criando espaço ao salvar pela primeira vez...');
        return null;
      }
      return null;
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.warn('Conexão com a nuvem bloqueada ou offline.');
    return null;
  }
};
