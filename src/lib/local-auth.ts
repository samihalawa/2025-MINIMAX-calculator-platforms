// Local Authentication System - No Backend Required
// Stores user data in localStorage for demo purposes

interface User {
  id: string;
  email: string;
  created_at: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface AuthResponse {
  data: { user: User | null; session: Session | null } | null;
  error: Error | null;
}

// Storage keys
const STORAGE_KEYS = {
  SESSION: 'numera-auth-session',
  USERS: 'numera-auth-users',
};

// Helper functions
const generateId = () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const generateToken = () => `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;

const getStoredUsers = (): Record<string, { email: string; password: string; user: User }> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveUsers = (users: Record<string, { email: string; password: string; user: User }>) => {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

const getStoredSession = (): Session | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!stored) return null;
    const session: Session = JSON.parse(stored);
    
    // Check if session is expired
    if (session.expires_at < Date.now()) {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      return null;
    }
    
    return session;
  } catch {
    return null;
  }
};

const saveSession = (session: Session | null) => {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
};

const createSession = (user: User): Session => {
  return {
    user,
    access_token: generateToken(),
    refresh_token: generateToken(),
    expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
};

// Simple password hashing (for demo - in production use proper hashing)
const hashPassword = (password: string): string => {
  return btoa(password); // Base64 encoding (NOT secure for production)
};

// Auth listeners
type AuthChangeCallback = (event: string, session: Session | null) => void;
const authListeners: AuthChangeCallback[] = [];

const notifyAuthChange = (event: string, session: Session | null) => {
  authListeners.forEach(callback => callback(event, session));
};

// Auth API
export const localAuth = {
  // Sign up with email and password
  signUp: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const users = getStoredUsers();
      
      // Check if user already exists
      if (Object.values(users).some(u => u.email === email)) {
        return {
          data: null,
          error: new Error('User already exists'),
        };
      }

      // Create new user
      const user: User = {
        id: generateId(),
        email,
        created_at: new Date().toISOString(),
        user_metadata: {},
      };

      // Store user credentials
      users[user.id] = {
        email,
        password: hashPassword(password),
        user,
      };
      saveUsers(users);

      // Create session
      const session = createSession(user);
      saveSession(session);
      notifyAuthChange('SIGNED_UP', session);

      return {
        data: { user, session },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const users = getStoredUsers();
      const userEntry = Object.values(users).find(u => u.email === email);

      if (!userEntry || userEntry.password !== hashPassword(password)) {
        return {
          data: null,
          error: new Error('Invalid email or password'),
        };
      }

      // Create new session
      const session = createSession(userEntry.user);
      saveSession(session);
      notifyAuthChange('SIGNED_IN', session);

      return {
        data: { user: userEntry.user, session },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  },

  // Sign in with Google (mock implementation)
  signInWithGoogle: async (): Promise<AuthResponse> => {
    // Mock Google sign-in
    const email = `demo_${Date.now()}@gmail.com`;
    return localAuth.signUp(email, 'google-oauth-' + generateToken());
  },

  // Sign out
  signOut: async (): Promise<{ error: Error | null }> => {
    try {
      saveSession(null);
      notifyAuthChange('SIGNED_OUT', null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  // Get current session
  getSession: async (): Promise<{ data: { session: Session | null }; error: Error | null }> => {
    try {
      const session = getStoredSession();
      return {
        data: { session },
        error: null,
      };
    } catch (error) {
      return {
        data: { session: null },
        error: error as Error,
      };
    }
  },

  // Get current user
  getUser: async (): Promise<{ data: { user: User | null }; error: Error | null }> => {
    try {
      const session = getStoredSession();
      return {
        data: { user: session?.user || null },
        error: null,
      };
    } catch (error) {
      return {
        data: { user: null },
        error: error as Error,
      };
    }
  },

  // Reset password (mock implementation)
  resetPassword: async (email: string): Promise<{ data: any; error: Error | null }> => {
    try {
      const users = getStoredUsers();
      const userExists = Object.values(users).some(u => u.email === email);
      
      if (!userExists) {
        return {
          data: null,
          error: new Error('User not found'),
        };
      }

      // In a real app, send reset email
      // For demo, just return success
      return {
        data: { message: 'Password reset email sent' },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  },

  // Update password
  updatePassword: async (password: string): Promise<{ data: any; error: Error | null }> => {
    try {
      const session = getStoredSession();
      if (!session) {
        return {
          data: null,
          error: new Error('Not authenticated'),
        };
      }

      const users = getStoredUsers();
      const userEntry = users[session.user.id];
      if (userEntry) {
        userEntry.password = hashPassword(password);
        saveUsers(users);
      }

      return {
        data: { message: 'Password updated' },
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as Error,
      };
    }
  },

  // Auth state change listener
  onAuthStateChange: (callback: AuthChangeCallback) => {
    authListeners.push(callback);
    
    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = authListeners.indexOf(callback);
            if (index > -1) {
              authListeners.splice(index, 1);
            }
          },
        },
      },
    };
  },
};

// Export a mock supabase-like object for compatibility
export const supabase = {
  auth: {
    signUp: localAuth.signUp,
    signInWithPassword: localAuth.signIn,
    signInWithOAuth: async ({ provider }: { provider: string }) => {
      if (provider === 'google') {
        return localAuth.signInWithGoogle();
      }
      return {
        data: null,
        error: new Error('Provider not supported'),
      };
    },
    signOut: localAuth.signOut,
    getSession: localAuth.getSession,
    getUser: localAuth.getUser,
    resetPasswordForEmail: localAuth.resetPassword,
    updateUser: async ({ password }: { password: string }) => {
      return localAuth.updatePassword(password);
    },
    onAuthStateChange: localAuth.onAuthStateChange,
  },
};

export const auth = localAuth;