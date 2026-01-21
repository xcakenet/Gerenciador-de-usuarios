
import React, { useState, useCallback, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import UsersView from './components/UsersView';
import ImportView from './components/ImportView';
import InsightsView from './components/InsightsView';
import SettingsView from './components/SettingsView';
import { ViewState, User, SystemData, ImportPreviewRow } from './types';
import { formatNameFromEmail } from './utils/formatters';

// Estendendo o objeto Window para reconhecer dados externos
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

  // Inicialização: Prioriza script externo -> localStorage -> vazio
  useEffect(() => {
    if (window.ACCESS_INSIGHT_DATA) {
      console.log('Dados carregados via script externo data.js');
      setUsers(window.ACCESS_INSIGHT_DATA.users);
      setSystems(window.ACCESS_INSIGHT_DATA.systems);
    } else {
      const savedUsers = localStorage.getItem('accessinsight_users');
      const savedSystems = localStorage.getItem('accessinsight_systems');
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      if (savedSystems) setSystems(JSON.parse(savedSystems));
    }
  }, []);

  // Persistência local automática
  useEffect(() => {
    localStorage.setItem('accessinsight_users', JSON.stringify(users));
    localStorage.setItem('accessinsight_systems', JSON.stringify(systems));
  }, [users, systems]);

  const handleDeleteUser = useCallback((email: string) => {
    setUsers(prev => prev.filter(u => u.email !== email));
  }, []);

  const handleUpdateUser = useCallback((oldEmail: string, updatedData: Partial<User>) => {
    setUsers(prev => prev.map(u => 
      u.email === oldEmail ? { ...u, ...updatedData } : u
    ));
  }, []);

  const handleImportAll = useCallback((newUsers: User[], newSystems: SystemData[]) => {
    setUsers(newUsers);
    setSystems(newSystems);
  }, []);

  const handleClearData = useCallback(() => {
    setUsers([]);
    setSystems([]);
    localStorage.removeItem('accessinsight_users');
    localStorage.removeItem('accessinsight_systems');
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
        let identifier = '';
        let userName = '';
        let userCompany = undefined;

        if (row.apiKey && row.apiKey.toLowerCase().startsWith('vtexappkey')) {
          identifier = row.apiKey;
          userName = row.label || 'App Key s/ Label';
          userCompany = row.roles || 'VTEX Role';
        } else {
          const email = row.email?.trim().toLowerCase();
          if (!email || email === 'n/a') return;
          identifier = email;
          userName = formatNameFromEmail(email);
        }

        const existingUserIndex = updatedUsers.findIndex(u => u.email.toLowerCase() === identifier.toLowerCase());
        
        const newAccess = {
          systemName,
          profile: row.profile || 'Sem Perfil',
          importedAt
        };

        if (existingUserIndex > -1) {
          const filteredAccesses = updatedUsers[existingUserIndex].accesses.filter(a => a.systemName !== systemName);
          updatedUsers[existingUserIndex] = {
            ...updatedUsers[existingUserIndex],
            name: userName, 
            company: userCompany || updatedUsers[existingUserIndex].company,
            accesses: [...filteredAccesses, newAccess]
          };
        } else {
          updatedUsers.push({
            email: identifier,
            name: userName,
            company: userCompany,
            accesses: [newAccess]
          });
        }
      });

      return updatedUsers;
    });

    setActiveView('users');
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard users={users} systems={systems} />;
      case 'users':
        return <UsersView users={users} onDeleteUser={handleDeleteUser} onUpdateUser={handleUpdateUser} />;
      case 'import':
        return <ImportView onImportComplete={handleImport} />;
      case 'insights':
        return <InsightsView users={users} />;
      case 'settings':
        return (
          <SettingsView 
            users={users} 
            systems={systems} 
            onImportAll={handleImportAll} 
            onClearData={handleClearData} 
          />
        );
      default:
        return <Dashboard users={users} systems={systems} />;
    }
  };

  return (
    <Layout activeView={activeView} onNavigate={setActiveView}>
      {renderView()}
    </Layout>
  );
};

export default App;
