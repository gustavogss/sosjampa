// Mock authentication service
// TODO: Replace with Firebase Authentication in production

export interface MockUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
}

const MOCK_USER: MockUser = {
  uid: 'mock-uid-001',
  displayName: 'Usuário SOS Jampa',
  email: 'usuario@sosjampa.com',
  photoURL: null,
};

let currentUser: MockUser | null = null;

export const authService = {
  getCurrentUser: (): MockUser | null => currentUser,

  signInWithGoogle: async (): Promise<MockUser> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    currentUser = MOCK_USER;
    return MOCK_USER;
  },

  signOut: async (): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    currentUser = null;
  },

  isAuthenticated: (): boolean => currentUser !== null,
};
