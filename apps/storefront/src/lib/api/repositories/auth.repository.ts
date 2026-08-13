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

export interface RainTreeResponse {
  success: boolean;
  message?: string;
}

/**
 * Ordinals of Loom's `NVERSE_AUTH_PROVIDER`, as returned by `/validate/provider`
 * when validation fails. Same mapping fabric's `_verifyProvider` switches on.
 */
export const AUTH_PROVIDER_BY_ORDINAL: Record<number, string> = {
  0: "BASIC",
  2: "GOOGLE",
  3: "FACEBOOK",
};

export interface ProviderValidation {
  /** true when the account really does authenticate with the provider asked about */
  valid: boolean;
  /** the account's actual provider — only meaningful when `valid` is false */
  actualProvider: string | null;
}

/**
 * Loom wraps single-entity reads as `{ entity: <payload>, success, message }`
 * (`RainTree.postEntityCustomResponseUnauthorized`). Reading the payload fields
 * off the top level silently yields `undefined`, which is how the login flow
 * came to treat every registered customer as a new signup.
 */
function unwrapEntity<T>(response: unknown): Partial<T> {
  if (response && typeof response === "object" && "entity" in response) {
    return ((response as { entity?: Partial<T> }).entity ?? {}) as Partial<T>;
  }
  return (response ?? {}) as Partial<T>;
}

export const authRepository = {
  /**
   * Check if email tenant is already registered
   */
  async checkEmailTenant(email: string): Promise<TenantCheckResponse> {
    try {
      const res = await apiRequest<unknown>("check-email/tenant", {
        method: "POST",
        body: JSON.stringify({ email, username: email }),
      });
      const status = unwrapEntity<TenantCheckResponse>(res);
      return { registered: !!status.registered, emailVerified: !!status.emailVerified };
    } catch (err) {
      return { registered: false };
    }
  },

  /**
   * Ask Loom whether this account authenticates with `provider`.
   *
   * Roughly half of the 7,254 production accounts are GOOGLE-provider and have no
   * usable password. Skipping this check means showing them a password box that
   * can only ever 401 — which is exactly what happened. `/validate/provider`
   * answers `{success: false, provider: <ordinal>}`, where the ordinal is the
   * account's real provider. Mirrors fabric's `_verifyProvider`.
   */
  async validateProvider(username: string, provider: string = "BASIC"): Promise<ProviderValidation> {
    try {
      const res = await apiRequest<{ success?: boolean; provider?: number }>("validate/provider", {
        method: "POST",
        body: JSON.stringify({ username, provider }),
      });
      if (res?.success) return { valid: true, actualProvider: provider };
      return {
        valid: false,
        actualProvider: AUTH_PROVIDER_BY_ORDINAL[res?.provider ?? -1] ?? null,
      };
    } catch {
      // Don't strand the customer on a network blip — fall through to the
      // password form, which fails loudly and recoverably on its own.
      return { valid: true, actualProvider: provider };
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
   * Register customer with Social provider (e.g. GOOGLE).
   *
   * Loom's `CustomerController` binds a `Customer`, whose tenant fields live
   * under a `tenant` key — a flat body is rejected with 406 "A minion wasn't in
   * the right place at the right time. [NPX]". Registration returns a RainTree
   * ack only; no JWT. Authenticate separately afterwards.
   */
  async registerSocial(email: string, token: string, provider: string = "GOOGLE"): Promise<RainTreeResponse> {
    return apiRequest<RainTreeResponse>("customer/registration/social", {
      method: "POST",
      body: JSON.stringify({
        tenant: { email, password: token, provider },
      }),
    });
  },

  /**
   * Register a new basic user.
   *
   * The endpoint is `/customer/registration/email`; plain `/customer/registration`
   * does not exist on Loom and 404s. Loom stores a single `name`, not first/last.
   * Returns a RainTree ack only — the customer must verify their email and then
   * log in.
   */
  async registerCustomer(data: {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<RainTreeResponse> {
    return apiRequest<RainTreeResponse>("customer/registration/email", {
      method: "POST",
      body: JSON.stringify({
        tenant: {
          name: [data.firstName, data.lastName].filter(Boolean).join(" ").trim(),
          email: data.email,
          password: data.password,
          ...(data.phone ? { contactNumber: data.phone } : {}),
          emailVerified: false,
          provider: "BASIC",
          gender: "",
        },
      }),
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
