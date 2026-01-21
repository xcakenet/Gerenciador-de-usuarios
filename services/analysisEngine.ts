
import { User } from '../types';

export interface LocalInsight {
  type: 'danger' | 'warning' | 'info';
  title: string;
  description: string;
  count: number;
}

export const performLocalAnalysis = (users: User[]): LocalInsight[] => {
  const insights: LocalInsight[] = [];
  
  // 1. Detecção de Privilégios Críticos
  const superUsers = users.filter(u => 
    u.accesses.some(a => 
      ['admin', 'super', 'gerente', 'owner', 'root', 'diretor'].some(key => 
        a.profile.toLowerCase().includes(key)
      )
    )
  );
  if (superUsers.length > 0) {
    insights.push({
      type: 'warning',
      title: 'Usuários com Privilégios Elevados',
      description: `Detectamos ${superUsers.length} usuários com perfis administrativos. Recomenda-se revisão trimestral.`,
      count: superUsers.length
    });
  }

  // 2. Acúmulo de Acessos (Sod - Segregation of Duties)
  const multiAccess = users.filter(u => u.accesses.length >= 3);
  if (multiAccess.length > 0) {
    insights.push({
      type: 'danger',
      title: 'Acúmulo de Sistemas',
      description: `${multiAccess.length} usuários possuem acesso a 3 ou mais sistemas simultâneos, o que pode indicar excesso de permissões.`,
      count: multiAccess.length
    });
  }

  // 3. Identificação de Inconsistências de Perfil
  const inconsistentProfiles = users.filter(u => {
    const profiles = u.accesses.map(a => a.profile.toLowerCase());
    const hasHigh = profiles.some(p => p.includes('admin') || p.includes('super'));
    const hasLow = profiles.some(p => p.includes('view') || p.includes('leitura') || p.includes('basico'));
    return hasHigh && hasLow;
  });
  if (inconsistentProfiles.length > 0) {
    insights.push({
      type: 'info',
      title: 'Discrepância de Perfis',
      description: `${inconsistentProfiles.length} usuários possuem níveis de acesso muito divergentes entre sistemas (ex: Admin em um, Básico em outro).`,
      count: inconsistentProfiles.length
    });
  }

  return insights;
};
