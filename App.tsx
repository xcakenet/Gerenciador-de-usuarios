
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
      if (remoteData) {
        setUsers(remoteData.users || []);
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
    // Atualização automática a cada 30 segundos para manter navegadores sincronizados
    const interval = setInterval(fetchGlobalData, 30000);
    return () => clearInterval(interval);
  }, [fetchGlobalData]);

  const persistToCloud = useCallback(async (newUsers: User[], newSystems: SystemData[]) => {
    setSyncStatus('syncing');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      const success = await saveToCloud({ users: newUsers, systems: newSystems });
      setSyncStatus(success ? 'success' : 'error');
    }, 1000);
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
    if (confirm('Atenção! Isso apagará TODOS os dados do Banco MySQL. Confirmar?')) {
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
      if (row.apiKey && row.apiKey.toLowerCase().startsWith('vtexappkey')) identifier = row.apiKey;
      if (!identifier || identifier === 'n/a') return;

      const existingIdx = updatedUsers.findIndex(u => u.email.toLowerCase() === identifier.toLowerCase());
      const newAccess = { systemName, profile: row.profile || 'Sem Perfil', importedAt };

      if (existingIdx > -1) {
        const filtered = updatedUsers[existingIdx].accesses.filter(a => a.systemName !== systemName);
        updatedUsers[existingIdx] = { ...updatedUsers[existingIdx], accesses: [...filtered, newAccess] };
      } else {
        updatedUsers.push({
          email: identifier,
          name: formatNameFromEmail(identifier),
          company: row.roles || undefined,
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
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <Database className="w-12 h-12 animate-pulse text-indigo-500 mb-6" />
        <h1 className="text-xl font-bold">Acessando MySQL Corporativo...</h1>
        <p className="text-slate-400 text-sm mt-2">Sincronizando base de dados global</p>
      </div>
    );
  }

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {/* Status Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl transition-all ${
            syncStatus === 'error' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'
          }`}>
            {syncStatus === 'error' ? <WifiOff className="w-6 h-6" /> : <Database className={`w-6 h-6 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-800">
                {syncStatus === 'error' ? 'Erro de Conexão' : 'Conectado ao MySQL'}
              </p>
              {syncStatus === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Base de Dados Centralizada</p>
          </div>
        </div>
        
        <button 
          onClick={fetchGlobalData}
          className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Atualizar Dados
        </button>
      </div>

      {syncStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 animate-bounce">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold text-center sm:text-left">Falha crítica: Verifique o arquivo api.php e as credenciais do banco.</p>
        </div>
      )}

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
