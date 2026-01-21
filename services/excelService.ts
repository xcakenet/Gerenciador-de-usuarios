
import * as XLSX from 'xlsx';
import { ImportPreviewRow, User } from '../types';
import { getCompanyForUser } from '../utils/formatters';

const cleanString = (val: any): string => {
  if (typeof val !== 'string') return String(val || '').trim();
  return val.trim();
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
        
        const normalized = json.map(row => {
          const keys = Object.keys(row);
          
          const findKey = (targets: string[]) => 
            keys.find(k => targets.some(t => 
              k.toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .includes(t.toLowerCase())
            ));

          const emailKey = findKey(['email', 'e-mail', 'correio', 'contato']);
          const profileKey = findKey(['perfil', 'profile', 'atribuição', 'atribuicao', 'cargo', 'role', 'acesso']);
          const apiKeyField = findKey(['apikey', 'api key', 'chave', 'appkey']);
          const labelField = findKey(['label', 'nome exibicao', 'identificador']);
          const rolesField = findKey(['roles', 'regra', 'funcao']);

          const emailValue = cleanString(row[emailKey || '']);
          const apiKeyValue = cleanString(row[apiKeyField || '']);

          return {
            email: emailValue || 'N/A',
            name: 'N/A', 
            profile: cleanString(row[profileKey || '']) || 'Sem Perfil',
            apiKey: apiKeyValue || undefined,
            label: cleanString(row[labelField || '']) || undefined,
            roles: cleanString(row[rolesField || '']) || undefined,
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
  XLSX.utils.book_append_sheet(workbook, worksheet, "Usuários e Perfis");

  const wscols = [{wch: 30}, {wch: 40}, {wch: 20}, {wch: 20}, {wch: 25}, {wch: 25}];
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `relatorio_acessos_${new Date().toISOString().split('T')[0]}.xlsx`);
};
