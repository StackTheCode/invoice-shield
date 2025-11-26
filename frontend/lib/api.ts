// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Token management
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

// Helper to make authenticated requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

// Auth endpoints
interface RegisterData {
  email: string;
  password: string;
  name?: string;
  companyName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    companyId: string | null;
  };
  error?: string;
}

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  return fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const login = async (data: LoginData): Promise<AuthResponse> => {
  return fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getCurrentUser = async () => {
  return fetchWithAuth('/auth/me', {
    method: 'GET',
  });
};

export const logout = () => {
  removeToken();
  window.location.href = '/login';
};

// Invoice endpoints (with auth)
export const uploadInvoice = async (file: File) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('invoice', file);

  const response = await fetch(`${API_URL}/invoices/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
};

export const analyzeInvoice = async (invoiceId: string) => {
  return fetchWithAuth(`/invoices/${invoiceId}/analyze`, {
    method: 'POST',
  });
};

export const getInvoices = async () => {
  return fetchWithAuth('/invoices', {
    method: 'GET',
  });
};

// Vendors endpoints
export const getVendors = async () => {
  return fetchWithAuth('/vendors', {
    method: 'GET',
  });
};

export const addVendor = async (data: any) => {
  return fetchWithAuth('/vendors', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};