
import { User, SystemData } from '../types';

/**
 * Armazenamento Centralizado via npoint.io
 * Este serviço permite que você salve e recupere o JSON de qualquer lugar.
 * Cada 'workspaceKey' atua como uma gaveta privada no banco de dados.
 */
const STORAGE_API_BASE = 'https://api.npoint.io';

export const saveToCloud = async (workspaceKey: string, data: { users: User[], systems: SystemData[] }) => {
  if (!workspaceKey || workspaceKey === 'default-workspace') {
    console.warn('Aviso: Usando workspace padrão. Recomenda-se definir um ID único nas Configurações.');
  }
  
  try {
    // Usamos o método POST para npoint.io para criar/atualizar o documento
    // Nota: Em npoint, para atualizar um bin existente, costuma-se usar o ID do bin.
    // Para simplificar e garantir que funcione em qualquer subdomínio sem backend,
    // usamos uma abordagem de Key-Value resiliente.
    const response = await fetch(`${STORAGE_API_BASE}/${workspaceKey}`, {
      method: 'POST',
      body: JSON.stringify({
        users: data.users,
        systems: data.systems,
        updatedAt: new Date().toISOString(),
        version: '1.1'
      }),
      headers: { 
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na Resposta do Servidor:', errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro crítico de conexão com o banco global:', error);
    return false;
  }
};

export const loadFromCloud = async (workspaceKey: string) => {
  if (!workspaceKey) return null;
  
  try {
    const response = await fetch(`${STORAGE_API_BASE}/${workspaceKey}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Workspace novo detectado. Criando repositório no primeiro salvamento...');
        return null;
      }
      return null;
    }
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao carregar dados do workspace:', error);
    return null;
  }
};
