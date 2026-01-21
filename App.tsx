
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UsersView from './components/UsersView';
import ImportView from './components/ImportView';
import InsightsView from './components/InsightsView';
import SettingsView from './components/SettingsView';
import { ViewState, User, SystemData, ImportPreviewRow, SyncState } from './types';
import { formatNameFromEmail } from './utils/formatters';
import { saveToCloud, loadFromCloud } from './services/syncService';
import { Database, CheckCircle2, WifiOff, AlertCircle, RefreshCcw } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [systems, setSystems] = useState<SystemData[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const saveTimeoutRef = useRef<any>(null);

  const fetchGlobalData = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const remoteData = await loadFromCloud();
      if (remoteData && remoteData.users) {
        setUsers(remoteData.users);
        setSystems(remoteData.systems || []);
        setSyncStatus('success');
      } else {
        setSyncStatus('error');
      }
    } catch (e) {
      setSyncStatus('error');
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalData();
    const interval = setInterval(fetchGlobalData, 45000);
    return () => clearInterval(interval);
  }, [fetchGlobalData]);

  const persistToCloud = useCallback(async (newUsers: User[], newSystems: SystemData[]) => {
    setSyncStatus('syncing');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      const success = await saveToCloud({ users: newUsers, systems: newSystems });
      setSyncStatus(success ? 'success' : 'error');
    }, 800);
  }, []);

  const handleDeleteUser = useCallback((email: string) => {
    const updated = users.filter(u => u.email !== email);
    setUsers(updated);
    persistToCloud(updated, systems);
  }, [users, systems, persistToCloud]);

  const handleUpdateUser = useCallback((oldEmail: string, updatedData: Partial<User>) => {
    const updated = users.map(u => u.email === oldEmail ? { ...u, ...updatedData } : u);
    setUsers(updated);
    persistToCloud(updated, systems);
  }, [users, systems, persistToCloud]);

  const handleImportAll = useCallback((newUsers: User[], newSystems: SystemData[]) => {
    setUsers(newUsers);
    setSystems(newSystems);
    persistToCloud(newUsers, newSystems);
  }, [persistToCloud]);

  const handleClearData = useCallback(() => {
    if (confirm('Zerar toda a base MySQL corporativa?')) {
      setUsers([]);
      setSystems([]);
      persistToCloud([], []);
    }
  }, [persistToCloud]);

  const handleImport = useCallback((systemName: string, data: ImportPreviewRow[]) => {
    const importedAt = new Date().toISOString();
    const newSystems = [...systems];
    const systemIdx = newSystems.findIndex(s => s.name === systemName);
    
    if (systemIdx > -1) {
      newSystems[systemIdx] = { ...newSystems[systemIdx], userCount: data.length, lastImport: importedAt };
    } else {
      newSystems.push({ id: Date.now().toString(), name: systemName, userCount: data.length, lastImport: importedAt });
    }

    const updatedUsers = [...users];
    data.forEach(row => {
      let identifier = row.email?.trim().toLowerCase();
      if (!identifier || identifier === 'n/a') return;

      const existingIdx = updatedUsers.findIndex(u => u.email.toLowerCase() === identifier.toLowerCase());
      const newAccess = { systemName, profile: row.profile || 'Acesso Padrão', importedAt };

      if (existingIdx > -1) {
        const currentUser = updatedUsers[existingIdx];
        const otherAccesses = currentUser.accesses.filter(a => a.systemName !== systemName);
        
        updatedUsers[existingIdx] = { 
          ...currentUser, 
          accesses: [...otherAccesses, newAccess],
          // Só atualiza Nome e Empresa se o novo dado for válido e o antigo for genérico
          name: (row.name && row.name !== 'N/A' && (currentUser.name.includes('@') || currentUser.name === 'N/A')) ? row.name : currentUser.name,
          company: (row.company && row.company !== 'N/A') ? row.company : currentUser.company
        };
      } else {
        updatedUsers.push({
          email: identifier,
          name: (row.name && row.name !== 'N/A') ? row.name : formatNameFromEmail(identifier),
          company: (row.company && row.company !== 'N/A') ? row.company : undefined,
          accesses: [newAccess]
        });
      }
    });

    setUsers(updatedUsers);
    setSystems(newSystems);
    persistToCloud(updatedUsers, newSystems);
    setActiveView('users');
  }, [users, systems, persistToCloud]);

  if (isInitialLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white">
        <Database className="w-12 h-12 animate-pulse text-indigo-500 mb-6" />
        <h1 className="text-xl font-bold">Conectando ao MySQL...</h1>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${syncStatus === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
            <Database className={`w-6 h-6 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Status do Banco MySQL</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {syncStatus === 'success' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Salvando...' : 'Erro de Conexão'}
            </p>
          </div>
        </div>
        <button onClick={fetchGlobalData} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2">
          <RefreshCcw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {activeView === 'dashboard' && <Dashboard users={users} systems={systems} />}
      {activeView === 'users' && <UsersView users={users} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} />}
      {activeView === 'import' && <ImportView onImportComplete={handleImport} />}
      {activeView === 'insights' && <InsightsView users={users} />}
      {activeView === 'settings' && (
        <SettingsView 
          users={users} 
          systems={systems} 
          sync={{ status: syncStatus, syncKey: 'Global', enabled: true, lastSync: null }}
          onImportAll={handleImportAll} 
          onClearData={handleClearData} 
          onUpdateSyncKey={() => {}} 
          onManualSync={fetchGlobalData}
        />
      )}
    </Layout>
  );
};

export default App;
