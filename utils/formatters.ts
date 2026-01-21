
import { User } from "../types";

export const formatNameFromEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email || 'Usuário Sem Nome';
  
  const handle = email.split('@')[0];
  const cleanName = handle.replace(/[._-]/g, ' ');
  
  return cleanName
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const getCompanyForUser = (user: User): string => {
  if (user.company && user.company !== 'N/A' && user.company.length > 1) return user.company;
  return getCompanyFromEmail(user.email);
};

export const getCompanyFromEmail = (email: string): string => {
  if (!email || !email.includes('@')) {
    if (email?.toLowerCase().includes('vtex')) return 'VTEX';
    return 'Geral';
  }
  
  const domain = email.split('@')[1];
  if (!domain) return 'Geral';
  
  const companyPart = domain.split('.')[0];
  const genericProviders = ['gmail', 'outlook', 'hotmail', 'live', 'yahoo', 'icloud', 'me', 'msn', 'uol', 'terra'];
  
  if (genericProviders.includes(companyPart.toLowerCase())) {
    return 'Externo / Pessoal';
  }

  return companyPart.charAt(0).toUpperCase() + companyPart.slice(1).toLowerCase();
};
