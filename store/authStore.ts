import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  phone: string;
}

export interface Trip {
  id: string;
  cruiseName: string;
  companion: string;
  destination: string;
  startDate: string;
  endDate: string;
  userId: string;
}

export interface UserData {
  user: User;
  trip: Trip;
}

interface AuthStore {
  isAuthenticated: boolean;
  userData: UserData | null;
  login: (userData: UserData) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  userData: null,
  
  login: (userData: UserData) => {
    set({ isAuthenticated: true, userData });
  },
  
  logout: () => {
    set({ isAuthenticated: false, userData: null });
  },
}));
