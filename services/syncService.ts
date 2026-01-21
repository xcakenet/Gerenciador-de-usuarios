
import { User, SystemData } from '../types';

// Usamos caminho relativo para garantir que funcione em subdiretórios na Hostinger
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
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Falha no Servidor (POST):', response.status, errorData);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Erro de Rede/Conexão (POST):', error);
    return false;
  }
};

export const loadFromCloud = async () => {
  try {
    const response = await fetch(`${API_URL}?t=${Date.now()}`, { // Cache-busting
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Falha no Servidor (GET):', response.status, errorData);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro de Rede/Conexão (GET):', error);
    return null;
  }
};
