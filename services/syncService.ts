
import { User, SystemData } from '../types';

// Usaremos uma API pública de KV (Key-Value) para persistência remota sem necessidade de backend próprio
// O endpoint é baseado na chave do usuário para garantir "privacidade" por obscuridade
const BASE_URL = 'https://api.jsonbin.io/v3/b';
const MASTER_KEY = '$2a$10$7Z/Y.x7H.I.I.I.I.I.I.I.I.I.I.I.I.I.I.I.I.I.I.I.I.I.I.I.'; // Placeholder

// Nota: Como não temos um backend fixo, utilizaremos um serviço gratuito de KV Store
// Para fins desta aplicação, usaremos o 'kvdb.io' que é simples e não requer conta para buckets públicos
const KV_URL = 'https://kvdb.io/AnV9Bq8Y8zW7y2X7B8zW7y'; // Bucket público temporário para o exemplo

export const saveToCloud = async (key: string, data: { users: User[], systems: SystemData[] }) => {
  if (!key || key.length < 5) return null;
  
  try {
    const response = await fetch(`${KV_URL}/${key}`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json' }
    });
    return response.ok;
  } catch (error) {
    console.error('Erro ao salvar na nuvem:', error);
    return false;
  }
};

export const loadFromCloud = async (key: string) => {
  if (!key || key.length < 5) return null;
  
  try {
    const response = await fetch(`${KV_URL}/${key}`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar da nuvem:', error);
    return null;
  }
};
