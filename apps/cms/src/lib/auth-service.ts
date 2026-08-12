import axios from 'axios';
import { ConfigurationService } from './config';

export interface Authority {
  superuser: boolean;
  admin: boolean;
  user: boolean;
  guest: boolean;
}

export interface JWTResponse {
  jwt?: string;
  token?: string;
  response?: any;
  status?: any;
}

const KEY_033 = 'nkbgUGFbfYHbJh';
const KEY_06 = 'nkftrVHdretgvNjug';
const KEY_40 = 'bfdtBVNHGYkjbg';
const KEY_63 = 'bFTGVFyvgHUIBH';
const KEY_25 = 'BHNFGtyhjjiGGGDSRj';

export class AuthService {
  public static storeJWT(token: string): void {
    if (typeof window === 'undefined' || !token) return;

    localStorage.setItem('token', token);
    localStorage.setItem('jwt', token);

    // Shatter into 5 chunks matching Angular JWTService
    const chunkSize = Math.ceil(token.length / 5);
    const chunks: string[] = [];
    for (let i = 0; i < token.length; i += chunkSize) {
      chunks.push(token.substring(i, i + chunkSize));
    }
    while (chunks.length < 5) {
      chunks.push('');
    }

    localStorage.setItem(KEY_033, chunks[0] || '');
    localStorage.setItem(KEY_06, chunks[1] || '');
    localStorage.setItem(KEY_40, chunks[2] || '');
    localStorage.setItem(KEY_63, chunks[3] || '');
    localStorage.setItem(KEY_25, chunks[4] || '');
  }

  public static retrieveJWT(): string | null {
    if (typeof window === 'undefined') return null;

    const directToken = localStorage.getItem('jwt') || localStorage.getItem('token');
    if (directToken && directToken.trim().length > 0) return directToken;

    const chunk0 = localStorage.getItem(KEY_033) || '';
    const chunk1 = localStorage.getItem(KEY_06) || '';
    const chunk2 = localStorage.getItem(KEY_40) || '';
    const chunk3 = localStorage.getItem(KEY_63) || '';
    const chunk4 = localStorage.getItem(KEY_25) || '';

    const reconstructed = chunk0 + chunk1 + chunk2 + chunk3 + chunk4;
    return reconstructed.trim().length > 0 ? reconstructed : null;
  }

  public static isTokenExpired(token: string): boolean {
    if (!token || token.length < 5) return true;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      let base64Url = parts[1];
      let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      const payload = JSON.parse(atob(base64));
      if (payload && payload.exp) {
        return payload.exp * 1000 < Date.now();
      }
      return false;
    } catch {
      return false;
    }
  }

  public static hasValidJWT(): boolean {
    const token = this.retrieveJWT();
    return !!(token && token.trim().length > 0);
  }

  public static destroySession(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('token');
    localStorage.removeItem('jwt');
    localStorage.removeItem('authority');
    localStorage.removeItem('user_email');
    localStorage.removeItem(KEY_033);
    localStorage.removeItem(KEY_06);
    localStorage.removeItem(KEY_40);
    localStorage.removeItem(KEY_63);
    localStorage.removeItem(KEY_25);
  }

  public static async login(username: string, password: string): Promise<{ token: string; authority?: Authority }> {
    const endpoint = `${ConfigurationService.SERVER_ENDPOINT}/auth/authenticate`;

    try {
      const response = await axios.post(
        endpoint,
        { username, password },
        { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
      );

      const responseData = response.data;
      const token = responseData?.jwt || responseData?.token || (typeof responseData === 'string' ? responseData : null);

      if (!token) {
        const msg = responseData?.message || 'Authentication succeeded but no JWT token was returned by backend.';
        throw new Error(msg);
      }

      this.storeJWT(token);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user_email', username);
      }

      let authority: Authority | undefined;
      try {
        authority = await this.resolveAuthorityToken(token);
      } catch (authErr) {
        console.warn('Authority resolution warning:', authErr);
      }

      return { token, authority };
    } catch (err: any) {
      if (err.response) {
        const serverMessage = err.response.data?.message || err.response.data?.error || (typeof err.response.data === 'string' ? err.response.data : null);
        throw new Error(serverMessage || `Authentication failed with status ${err.response.status}`);
      }
      if (err.request) {
        throw new Error(`Unable to connect to backend server at ${ConfigurationService.SERVER_ENDPOINT}. Please check network connection.`);
      }
      throw new Error(err.message || 'Authentication failed.');
    }
  }

  public static async resolveAuthorityToken(token?: string): Promise<Authority> {
    const jwtToken = token || this.retrieveJWT();
    if (!jwtToken) {
      throw new Error('No JWT token available to resolve authority');
    }

    const endpoint = `${ConfigurationService.SERVER_ENDPOINT}/auth/authority`;
    const response = await axios.get(endpoint, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 8000,
    });

    const rawAuthority = response.data?.authority || response.data;
    const authorityData: Authority = {
      superuser: !!(rawAuthority?.superUser || rawAuthority?.superuser),
      admin: !!(rawAuthority?.superUser || rawAuthority?.admin),
      user: !!(rawAuthority?.customer || rawAuthority?.user),
      guest: false,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('authority', JSON.stringify(authorityData));
    }

    return authorityData;
  }
}
