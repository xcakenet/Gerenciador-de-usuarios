
import { User, SystemData } from '../types';

/**
 * Para um ambiente compartilhado, usamos um bucket fixo.
 * Em um cenário real de produção, aqui seria a URL da sua API backend.
 * Para esta solução frontend-only, utilizaremos um serviço de KV Store 
 * que permite persistência global via API.
 */
const KV_BUCKET_URL = 'https://kvdb.io/AnV9Bq8Y8zW7y2X7B8zW7y'; 

export const saveToCloud = async (workspaceKey: string, data: { users: User[], systems: SystemData[] }) => {
  if (!workspaceKey) return false;
  
  try {
    const response = await fetch(`${KV_BUCKET_URL}/${workspaceKey}`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        updatedAt: new Date().toISOString()
      }),
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('Erro ao salvar no banco global:', error);
    return false;
  }
};

export const loadFromCloud = async (workspaceKey: string) => {
  if (!workspaceKey) return null;
  
  try {
    const response = await fetch(`${KV_BUCKET_URL}/${workspaceKey}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar do banco global:', error);
    return null;
  }
};
