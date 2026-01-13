export interface User {
  id: string;
  username: string;
  name: string;
  avatarColor: string;
  settings: {
    readReceipts: boolean;
    lastSeen: boolean;
    theme: 'light' | 'dark';
  };
}

export interface Message {
  id: string;
  spaceId: string;
  senderId: string; 
  content: string;
  type: 'text' | 'image' | 'system' | 'music_card';
  timestamp: number;
  metadata?: {
    imageUrl?: string;
    musicData?: Song;
  };
  replyTo?: {
    id: string;
    content: string;
    senderId: string;
  };
  readBy: string[];
}

export interface Song {
  id: string;
  url: string;
  title: string;
  artist: string;
  coverArt: string;
  addedBy: string;
  platform: 'spotify' | 'youtube' | 'apple' | 'soundcloud' | 'other';
  reactions: Record<string, 'like' | 'repeat' | 'skip'>;
}

export interface GameState {
  id: string;
  type: 'tictactoe';
  board: (string | null)[];
  currentPlayer: string;
  status: 'active' | 'draw' | 'winner';
  winner?: string;
  resetRequests: string[];
  lastUpdated: number;
}

export interface DuoSpace {
  id: string;
  name: string;
  code: string;
  theme: string;
  members: string[];
  createdAt: number;
  createdBy: string;
  activeGame?: GameState;
}

export interface AuthSession {
  token: string;
  user: User;
}
