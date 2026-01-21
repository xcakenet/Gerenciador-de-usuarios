
export interface Access {
  systemName: string;
  profile: string;
  importedAt: string;
}

export interface User {
  email: string;
  name: string;
  accesses: Access[];
  company?: string;
  department?: string;
}

export interface SystemData {
  id: string;
  name: string;
  userCount: number;
  lastImport: string;
}

export interface ImportPreviewRow {
  email: string;
  name: string;
  profile: string;
  apiKey?: string;
  label?: string;
  roles?: string;
  [key: string]: any;
}

export type ViewState = 'dashboard' | 'users' | 'import' | 'insights' | 'settings';
