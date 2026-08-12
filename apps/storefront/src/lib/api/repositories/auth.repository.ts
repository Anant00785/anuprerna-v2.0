import { apiRequest } from "../client";

export interface JWTResponse {
  jwt: string;
  status?: number;
  message?: string;
  user?: any;
}

export interface TenantCheckResponse {
  registered: boolean;
  emailVerified?: boolean;
  provider?: string;
  exists?: boolean;
}

export const authRepository = {
  /**
   * Check if email tenant is already registered
   */
  async checkEmailTenant(email: string): Promise<TenantCheckResponse> {
    try {
      const res = await apiRequest<TenantCheckResponse>("check-email/tenant", {
        method: "POST",
        body: JSON.stringify({ email, username: email }),
      });
      return res;
    } catch (err) {
      return { registered: false };
    }
  },

  /**
   * Authenticate with email & password
   */
  async loginEmail(username: string, password: string): Promise<JWTResponse> {
    return apiRequest<JWTResponse>("authenticate/email", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  },

  /**
   * Authenticate with Social provider (e.g. GOOGLE)
   */
  async loginSocial(username: string, token: string, provider: string = "GOOGLE"): Promise<JWTResponse> {
    return apiRequest<JWTResponse>("authenticate/social", {
      method: "POST",
      body: JSON.stringify({
        username,
        password: token,
        provider,
      }),
    });
  },

  /**
   * Register customer with Social provider (e.g. GOOGLE)
   */
  async registerSocial(email: string, token: string, provider: string = "GOOGLE"): Promise<JWTResponse> {
    return apiRequest<JWTResponse>("customer/registration/social", {
      method: "POST",
      body: JSON.stringify({
        email,
        username: email,
        password: token,
        provider,
      }),
    });
  },

  /**
   * Register a new basic user
   */
  async registerCustomer(data: {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<JWTResponse> {
    return apiRequest<JWTResponse>("customer/registration", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; message?: string }> {
    return apiRequest<{ success: boolean; message?: string }>("send/password-reset/email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
};
