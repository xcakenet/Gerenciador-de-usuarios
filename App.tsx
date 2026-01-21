
import React, { useState, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UsersView from './components/UsersView';
import ImportView from './components/ImportView';
import InsightsView from './components/InsightsView';
import SettingsView from './components/SettingsView';
import { ViewState, User, SystemData, ImportPreviewRow, SyncState } from './types';
import { formatNameFromEmail } from './utils/formatters';
import { saveToCloud, loadFromCloud } from './services/syncService';

declare global {
  interface Window {
    ACCESS_INSIGHT_DATA?: {
      users: User[];
      systems: SystemData[];
    };
  }
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [systems, setSystems] = useState<SystemData[]>([]);
  const [sync, setSync] = useState<SyncState>({
    enabled: false,
    syncKey: localStorage.getItem('accessinsight_synckey') || '',
    lastSync: localStorage.getItem('accessinsight_lastsync'),
    status: 'idle'
  });

  // 1. Inicialização (Local -> Script Externo)
  useEffect(() => {
    if (window.ACCESS_INSIGHT_DATA) {
      setUsers(window.ACCESS_INSIGHT_DATA.users);
      setSystems(window.ACCESS_INSIGHT_DATA.systems);
    } else {
      const savedUsers = localStorage.getItem('accessinsight_users');
      const savedSystems = localStorage.getItem('accessinsight_systems');
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      if (savedSystems) setSystems(JSON.parse(savedSystems));
    }
  }, []);

  // 2. Sincronização em Nuvem (Ao carregar chave ou iniciar app)
  useEffect(() => {
    const initCloudSync = async () => {
      if (sync.syncKey && sync.syncKey.length >= 6) {
        setSync(prev => ({ ...prev, status: 'syncing' }));
        const remoteData = await loadFromCloud(sync.syncKey);
        if (remoteData && remoteData.users) {
          // Merge inteligente ou substituição? Por segurança, vamos substituir se os dados remotos forem mais novos
          setUsers(remoteData.users);
          setSystems(remoteData.systems);
          setSync(prev => ({ ...prev, status: 'success', lastSync: new Date().toISOString() }));
        } else {
          setSync(prev => ({ ...prev, status: 'idle' }));
        }
      }
    };
    initCloudSync();
  }, [sync.syncKey]);

  // 3. Auto-Save (LocalStorage e Nuvem)
  useEffect(() => {
    localStorage.setItem('accessinsight_users', JSON.stringify(users));
    localStorage.setItem('accessinsight_systems', JSON.stringify(systems));

    const timeout = setTimeout(async () => {
      if (sync.syncKey && sync.syncKey.length >= 6 && users.length > 0) {
        setSync(prev => ({ ...prev, status: 'syncing' }));
        const success = await saveToCloud(sync.syncKey, { users, systems });
        if (success) {
          const now = new Date().toISOString();
          setSync(prev => ({ ...prev, status: 'success', lastSync: now }));
          localStorage.setItem('accessinsight_lastsync', now);
        } else {
          setSync(prev => ({ ...prev, status: 'error' }));
        }
      }
    }, 2000); // Delay para não sobrecarregar a rede em cada clique

    return () => clearTimeout(timeout);
  }, [users, systems, sync.syncKey]);

  const handleUpdateSyncKey = useCallback((key: string) => {
    setSync(prev => ({ ...prev, syncKey: key }));
    localStorage.setItem('accessinsight_synckey', key);
  }, []);

  const handleManualSync = useCallback(async () => {
    if (!sync.syncKey) return;
    setSync(prev => ({ ...prev, status: 'syncing' }));
    const remoteData = await loadFromCloud(sync.syncKey);
    if (remoteData) {
      setUsers(remoteData.users);
      setSystems(remoteData.systems);
      setSync(prev => ({ ...prev, status: 'success', lastSync: new Date().toISOString() }));
    } else {
      // Se não tem na nuvem, sobe os locais
      await saveToCloud(sync.syncKey, { users, systems });
      setSync(prev => ({ ...prev, status: 'success', lastSync: new Date().toISOString() }));
    }
  }, [sync.syncKey, users, systems]);

  const handleDeleteUser = useCallback((email: string) => {
    setUsers(prev => prev.filter(u => u.email !== email));
  }, []);

  const handleUpdateUser = useCallback((oldEmail: string, updatedData: Partial<User>) => {
    setUsers(prev => prev.map(u => u.email === oldEmail ? { ...u, ...updatedData } : u));
  }, []);

  const handleImportAll = useCallback((newUsers: User[], newSystems: SystemData[]) => {
    setUsers(newUsers);
    setSystems(newSystems);
  }, []);

  const handleClearData = useCallback(() => {
    setUsers([]);
    setSystems([]);
    localStorage.clear();
    setSync({ enabled: false, syncKey: '', lastSync: null, status: 'idle' });
  }, []);

  const handleImport = useCallback((systemName: string, data: ImportPreviewRow[]) => {
    const importedAt = new Date().toISOString();
    
    setSystems(prev => {
      const existing = prev.find(s => s.name === systemName);
      if (existing) {
        return prev.map(s => s.name === systemName ? { ...s, userCount: data.length, lastImport: importedAt } : s);
      }
      return [...prev, { id: Date.now().toString(), name: systemName, userCount: data.length, lastImport: importedAt }];
    });

    setUsers(prev => {
      const updatedUsers = [...prev];
      data.forEach(row => {
        let identifier = row.email?.trim().toLowerCase();
        if (row.apiKey && row.apiKey.toLowerCase().startsWith('vtexappkey')) {
          identifier = row.apiKey;
        }
        if (!identifier || identifier === 'n/a') return;

        const existingUserIndex = updatedUsers.findIndex(u => u.email.toLowerCase() === identifier.toLowerCase());
        const newAccess = { systemName, profile: row.profile || 'Sem Perfil', importedAt };

        if (existingUserIndex > -1) {
          const filteredAccesses = updatedUsers[existingUserIndex].accesses.filter(a => a.systemName !== systemName);
          updatedUsers[existingUserIndex] = {
            ...updatedUsers[existingUserIndex],
            accesses: [...filteredAccesses, newAccess]
          };
        } else {
          updatedUsers.push({
            email: identifier,
            name: formatNameFromEmail(identifier),
            company: row.roles || undefined,
            accesses: [newAccess]
          });
        }
      });
      return updatedUsers;
    });

    setActiveView('users');
  }, []);

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {activeView === 'dashboard' && <Dashboard users={users} systems={systems} />}
      {activeView === 'users' && <UsersView users={users} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} />}
      {activeView === 'import' && <ImportView onImportComplete={handleImport} />}
      {activeView === 'insights' && <InsightsView users={users} />}
      {activeView === 'settings' && (
        <SettingsView 
          users={users} 
          systems={systems} 
          sync={sync}
          onImportAll={handleImportAll} 
          onClearData={handleClearData} 
          onUpdateSyncKey={handleUpdateSyncKey}
          onManualSync={handleManualSync}
        />
      )}
    </Layout>
  );
};

export default App;
