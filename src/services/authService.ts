import { UserProfile } from '../types';

const AUTH_BASE = '/api/wp-proxy/headlesskey/v1';
const WP_API_BASE = '/api/wp-proxy/wp/v2';

export interface AuthTokens {
  token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponse {
  success: boolean;
  data?: AuthTokens;
  message?: string;
}

export const authService = {
  async signUp(username: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${AUTH_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      return { success: false, message: 'Network error during sign up' };
    }
  },

  async signIn(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${AUTH_BASE}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        this.saveTokens(data);
      }
      return { success: response.ok, data, message: data.message };
    } catch (error) {
      return { success: false, message: 'Network error during sign in' };
    }
  },

  async refreshToken(): Promise<boolean> {
    const tokens = this.getTokens();
    if (!tokens?.refresh_token) return false;

    try {
      const response = await fetch(`${AUTH_BASE}/token/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      });
      const data = await response.json();
      if (response.ok && data.token) {
        this.saveTokens({ ...tokens, ...data });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  async logout(): Promise<void> {
    const tokens = this.getTokens();
    if (tokens?.token) {
      try {
        await fetch(`${AUTH_BASE}/token/revoke`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokens.token}`
          },
        });
      } catch (e) {
        console.warn('Failed to revoke token on server', e);
      }
    }
    this.clearTokens();
  },

  async getProfile(): Promise<UserProfile | null> {
    const tokens = this.getTokens();
    if (!tokens?.token) return null;

    try {
      const response = await fetch(`${WP_API_BASE}/users/me`, {
        headers: { 'Authorization': `Bearer ${tokens.token}` },
      });
      if (response.status === 401) {
        const refreshed = await this.refreshToken();
        if (refreshed) return this.getProfile();
        return null;
      }
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  },

  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${AUTH_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  async resetPassword(email: string, code: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${AUTH_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password }),
      });
      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<AuthResponse> {
    const tokens = this.getTokens();
    if (!tokens?.token) return { success: false, message: 'Not authenticated' };

    try {
      const response = await fetch(`${AUTH_BASE}/change-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.token}`
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await response.json();
      return { success: response.ok, ...data };
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  saveTokens(tokens: AuthTokens) {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
    localStorage.setItem('auth_token_timestamp', Date.now().toString());
  },

  getTokens(): AuthTokens | null {
    const saved = localStorage.getItem('auth_tokens');
    return saved ? JSON.parse(saved) : null;
  },

  clearTokens() {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_token_timestamp');
  }
};
