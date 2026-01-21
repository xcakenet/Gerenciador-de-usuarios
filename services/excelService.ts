
import * as XLSX from 'xlsx';
import { ImportPreviewRow, User } from '../types';
import { getCompanyForUser } from '../utils/formatters';

const cleanString = (val: any): string => {
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

export const parseExcelFile = async (file: File): Promise<ImportPreviewRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        if (json.length === 0) {
          resolve([]);
          return;
        }

        const normalized = json.map(row => {
          const keys = Object.keys(row);
          
          // Função auxiliar para busca de chaves
          const findKey = (targets: string[]) => 
            keys.find(k => {
              const normalizedK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return targets.some(t => normalizedK === t || normalizedK.includes(t));
            });

          // 1. Identificar Identificador (Email ou Key)
          const emailKey = findKey(['email', 'e-mail', 'login', 'usuario', 'identifier', 'identificador']);
          const apiKeyKey = findKey(['apikey', 'api key', 'chave', 'appkey']);
          
          // 2. Identificar Nome
          const nameKey = findKey(['nome', 'name', 'label', 'exibicao', 'full name']);
          
          // 3. Identificar Perfil (Atribuição)
          const profileKey = findKey(['perfil', 'profile', 'acesso', 'atribuicao', 'permissao', 'nivel', 'role', 'regra']);
          
          // 4. Identificar Empresa
          const companyKey = findKey(['empresa', 'company', 'organizacao', 'corporacao', 'unidade', 'cliente', 'organization']);

          const emailVal = cleanString(row[emailKey || ''] || row[apiKeyKey || '']);
          const nameVal = cleanString(row[nameKey || '']);
          const profileVal = cleanString(row[profileKey || '']);
          const companyVal = cleanString(row[companyKey || '']);

          // Fallbacks de segurança: se não tem nome, usa o email. Se não tem perfil, tenta achar qualquer outra coluna útil
          return {
            email: emailVal || 'desconhecido@sistema.com',
            name: nameVal || (emailVal && !emailVal.includes('@') ? emailVal : ''),
            profile: profileVal || 'Acesso Padrão',
            company: companyVal || undefined,
            apiKey: cleanString(row[apiKeyKey || '']) || undefined,
            roles: profileVal || undefined // Backup para o App.tsx
          };
        });

        resolve(normalized);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const exportUsersToExcel = (users: User[]) => {
  const exportData = users.flatMap(user => 
    user.accesses.map(access => ({
      'Nome': user.name,
      'Identificador/Email': user.email,
      'Empresa': getCompanyForUser(user),
      'Sistema': access.systemName,
      'Perfil': access.profile,
      'Data de Sincronização': new Date(access.importedAt).toLocaleString('pt-BR')
    }))
  );

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Relatorio");
  XLSX.writeFile(workbook, `access_report_${Date.now()}.xlsx`);
};
