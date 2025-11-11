import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  photoAlbum?: string[];
  suggestions?: string[];
}

interface ChatStore {
  messages: ChatMessage[];
  currentPhotoAlbum: string[];
  isPhotoAlbumOpen: boolean;
  addMessage: (message: ChatMessage) => void;
  setCurrentPhotoAlbum: (photos: string[]) => void;
  setIsPhotoAlbumOpen: (isOpen: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  currentPhotoAlbum: [],
  isPhotoAlbumOpen: false,
  
  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },
  
  setCurrentPhotoAlbum: (photos: string[]) => {
    set({ currentPhotoAlbum: photos });
  },
  
  setIsPhotoAlbumOpen: (isOpen: boolean) => {
    set({ isPhotoAlbumOpen: isOpen });
  },
  
  clearMessages: () => {
    set({ messages: [] });
  },
}));
