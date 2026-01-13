import { User, DuoSpace, Message, AuthSession, GameState } from '../types';

const USERS_KEY = 'duospace_users';
const SPACES_KEY = 'duospace_spaces';
const MESSAGES_KEY = 'duospace_messages';
const SESSION_KEY = 'duospace_session';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const generateId = () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9);

const notifySessionChange = () => {
  window.dispatchEvent(new Event('duospace-session-update'));
};

export const getSession = (): AuthSession | null => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

export const setSession = (session: AuthSession) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notifySessionChange();
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
  notifySessionChange();
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  await delay(400); 
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  return !users.some(u => u.username.toLowerCase() === username.trim().toLowerCase());
};

export const updateUserSettings = async (userId: string, settings: Partial<User['settings']>): Promise<User> => {
   await delay(200);
   const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
   const index = users.findIndex(u => u.id === userId);
   if (index === -1) throw new Error("User not found");
   
   users[index].settings = { ...users[index].settings, ...settings };
   localStorage.setItem(USERS_KEY, JSON.stringify(users));
   
   const session = getSession();
   if (session && session.user.id === userId) {
     session.user = users[index];
     setSession(session);
   }
   return users[index];
};

export const login = async (usernameInput: string): Promise<AuthSession> => {
  await delay(600);
  const username = usernameInput.trim();
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  
  const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (!existingUser) {
    const newUser: User = {
      id: generateId(),
      username: username,
      name: username,
      avatarColor: ['bg-rose-400', 'bg-violet-400', 'bg-cyan-400', 'bg-amber-400', 'bg-fuchsia-400'][Math.floor(Math.random() * 5)],
      settings: { lastSeen: true, readReceipts: true, theme: 'light' }
    };
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    const session = { token: 'simulated-token', user: newUser };
    setSession(session);
    return session;
  }
  
  const session = { token: 'simulated-token', user: existingUser };
  setSession(session);
  return session;
};

export const getSpaces = async (userId: string): Promise<DuoSpace[]> => {
  await delay(400);
  const spaces: DuoSpace[] = JSON.parse(localStorage.getItem(SPACES_KEY) || '[]');
  return spaces.filter(s => s.members.includes(userId));
};

export const createSpace = async (userId: string, name: string): Promise<DuoSpace> => {
  await delay(800);
  const spaces: DuoSpace[] = JSON.parse(localStorage.getItem(SPACES_KEY) || '[]');
  
  const existingSpace = spaces.find(s => s.members.includes(userId));
  if (existingSpace) {
    throw new Error("You are already in a space. You must leave it before creating a new one.");
  }

  const newSpace: DuoSpace = {
    id: generateId(),
    name: name || 'Cozy Corner',
    code: Math.random().toString(36).substring(2, 8).toUpperCase(),
    theme: 'violet',
    members: [userId],
    createdAt: Date.now(),
    createdBy: userId
  };
  spaces.push(newSpace);
  localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));
  return newSpace;
};

export const joinSpace = async (userId: string, code: string): Promise<DuoSpace> => {
  await delay(800);
  const spaces: DuoSpace[] = JSON.parse(localStorage.getItem(SPACES_KEY) || '[]');
  
  const existingSpace = spaces.find(s => s.members.includes(userId));
  if (existingSpace) {
    throw new Error("You are already in a space. You must leave it before joining another.");
  }

  const spaceIndex = spaces.findIndex(s => s.code === code);
  
  if (spaceIndex === -1) throw new Error("Invalid Invite Code");
  
  const space = spaces[spaceIndex];
  if (!space.members.includes(userId)) {
    space.members.push(userId);
    spaces[spaceIndex] = space;
    localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));
  }
  return space;
};

export const leaveSpace = async (userId: string, spaceId: string): Promise<void> => {
  await delay(500);
  const spaces: DuoSpace[] = JSON.parse(localStorage.getItem(SPACES_KEY) || '[]');
  
  const updatedSpaces = spaces.map(s => {
    if (s.id === spaceId) {
      return { ...s, members: s.members.filter(m => m !== userId) };
    }
    return s;
  }).filter(s => s.members.length > 0);

  if (updatedSpaces.length < spaces.length) {
     const allMessages: Record<string, Message[]> = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '{}');
     const currentIds = new Set(updatedSpaces.map(s => s.id));
     const removedIds = spaces.filter(s => !currentIds.has(s.id)).map(s => s.id);
     
     removedIds.forEach(id => delete allMessages[id]);
     localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
  }
  
  localStorage.setItem(SPACES_KEY, JSON.stringify(updatedSpaces));
};

export const getMessages = async (spaceId: string): Promise<Message[]> => {
  await delay(300);
  const allMessages: Record<string, Message[]> = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '{}');
  return allMessages[spaceId] || [];
};

export const sendMessage = async (spaceId: string, message: Message): Promise<Message> => {
  await delay(200);
  const allMessages: Record<string, Message[]> = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '{}');
  if (!allMessages[spaceId]) allMessages[spaceId] = [];
  
  allMessages[spaceId].push(message);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
  return message;
};

export const updateGame = async (spaceId: string, gameState: GameState | undefined): Promise<void> => {
  await delay(200);
  const spaces: DuoSpace[] = JSON.parse(localStorage.getItem(SPACES_KEY) || '[]');
  const spaceIndex = spaces.findIndex(s => s.id === spaceId);
  if (spaceIndex > -1) {
    spaces[spaceIndex].activeGame = gameState;
    localStorage.setItem(SPACES_KEY, JSON.stringify(spaces));
  }
};
