
import { User } from "../types";

/**
 * Formata um nome a partir do email
 */
export const formatNameFromEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email; // Se for API Key, retorna o valor original
  
  const handle = email.split('@')[0];
  const cleanName = handle.replace(/[._-]/g, ' ');
  
  return cleanName
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Retorna a empresa de um usuário, priorizando o campo explicitamente definido.
 */
export const getCompanyForUser = (user: User): string => {
  if (user.company) return user.company;
  return getCompanyFromEmail(user.email);
};

/**
 * Extrai o nome da empresa a partir do domínio do e-mail.
 */
export const getCompanyFromEmail = (email: string): string => {
  if (!email || !email.includes('@')) {
    // Se não for e-mail mas for uma chave VTEX, poderíamos tratar aqui, 
    // mas o ideal é o App.tsx já ter preenchido user.company.
    if (email?.startsWith('vtexappkey')) return 'VTEX Integration';
    return 'Outros';
  }
  
  const domain = email.split('@')[1];
  const companyPart = domain.split('.')[0];
  
  const genericProviders = ['gmail', 'outlook', 'hotmail', 'live', 'yahoo', 'icloud', 'me'];
  
  if (genericProviders.includes(companyPart.toLowerCase())) {
    return 'Pessoal / Externo';
  }

  return companyPart.charAt(0).toUpperCase() + companyPart.slice(1).toLowerCase();
};
