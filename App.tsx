import React, { useState, useEffect, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { 
  Users, Plus, LogOut, Settings, Music, MessageCircle, 
  Gamepad2, Send, RefreshCw, Copy, Check, Mic, Bot,
  Sun, Moon, Heart, Zap, DoorOpen, Reply, X, Loader2
} from 'lucide-react';

import { Button, Input, Card, Badge } from './components/Common';
import { 
  User, DuoSpace, Message, Song
} from './types';
import * as API from './services/storage';
import * as Gemini from './services/geminiService';

// --- Auth View ---

const AuthView = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [availability, setAvailability] = useState<{status: 'idle' | 'checking' | 'available' | 'taken', message: string}>({status: 'idle', message: ''});
  
  // Debounce check
  useEffect(() => {
    if (mode === 'login' || !username) {
      setAvailability({status: 'idle', message: ''});
      return;
    }

    const timer = setTimeout(async () => {
      setAvailability({status: 'checking', message: 'Checking...'});
      const isAvailable = await API.checkUsernameAvailability(username);
      if (isAvailable) {
        setAvailability({status: 'available', message: ''});
      } else {
        setAvailability({status: 'taken', message: 'Username is taken'});
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    // Prevent registration if taken
    if (mode === 'signup' && availability.status === 'taken') return;

    setLoading(true);
    await API.login(username);
    setLoading(false);
    onLogin();
  };

  return (
    <div className="min-h-full flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-violet-400/30 rounded-full blur-3xl dark:bg-violet-900/40" />
      <div className="absolute bottom-[-20%] left-[-10%] w-96 h-96 bg-rose-400/30 rounded-full blur-3xl dark:bg-rose-900/40" />

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="relative inline-block mb-2">
             <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-[2rem] flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-6 transition-transform">
                <span className="text-5xl font-black text-white">D</span>
             </div>
             <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg text-rose-500 ring-4 ring-slate-50 dark:ring-slate-900">
               <Heart size={20} fill="currentColor" />
             </div>
          </div>
          <div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 tracking-tighter pb-2">
              DuoSpace
            </h1>
            <p className="text-slate-600 dark:text-slate-300 font-bold text-lg">Your private world for two.</p>
          </div>
        </div>

        <Card className="backdrop-blur-xl border-white/40 dark:border-white/10 shadow-2xl">
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl mb-8">
            <button 
              className={`flex-1 py-3 text-sm font-extrabold rounded-xl transition-all ${mode === 'signup' ? 'bg-white dark:bg-slate-700 shadow-md text-violet-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              onClick={() => setMode('signup')}
            >
              Sign Up
            </button>
             <button 
              className={`flex-1 py-3 text-sm font-extrabold rounded-xl transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-700 shadow-md text-violet-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              onClick={() => setMode('login')}
            >
              Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
              type="text" 
              placeholder="Pick a cool username" 
              label={mode === 'signup' ? "Create Username" : "Enter Username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              error={mode === 'signup' && availability.status === 'taken' ? availability.message : undefined}
            />
            {mode === 'signup' && availability.status === 'available' && username && (
              <p className="text-xs text-emerald-500 font-bold ml-1 flex items-center gap-1">
                <Check size={12} strokeWidth={4} /> Looks good!
              </p>
            )}
            
            <Button 
              type="submit" 
              className="w-full shadow-violet-500/25 !py-4 !text-lg" 
              isLoading={loading || (mode === 'signup' && availability.status === 'checking')}
              disabled={mode === 'signup' && availability.status === 'taken'}
            >
              {mode === 'signup' ? 'Start Adventure' : 'Jump Back In'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

// --- Dashboard View ---

const Dashboard = () => {
  const [spaces, setSpaces] = useState<DuoSpace[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 'none' | 'join' | 'create'
  const [activeAction, setActiveAction] = useState<string>('none');
  const [inputValue, setInputValue] = useState('');

  const session = API.getSession();
  const user = session?.user;
  const navigate = useNavigate();

  const fetchSpaces = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await API.getSpaces(user.id);
    setSpaces(data);
    setLoading(false);
  }, [user?.id]); 

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const handleCreateSubmit = async () => {
    if (!user || !inputValue.trim()) return;
    setLoading(true);
    try {
      await API.createSpace(user.id, inputValue.trim());
      setActiveAction('none');
      setInputValue('');
      fetchSpaces();
    } catch (e: any) {
      alert(e.message);
      setLoading(false);
    }
  };

  const handleJoinSubmit = async () => {
    if (!user || !inputValue.trim()) return;
    try {
      setLoading(true);
      await API.joinSpace(user.id, inputValue.trim().toUpperCase());
      setActiveAction('none');
      setInputValue('');
      fetchSpaces();
    } catch (err: any) {
      alert(err.message || "Invalid Invite Code");
      setLoading(false);
    }
  };

  const cancelAction = () => {
    setActiveAction('none');
    setInputValue('');
  };

  const existingSpace = spaces.length > 0 ? spaces[0] : null;

  return (
    <div className="min-h-full p-6 pb-24 relative">
      <div className="max-w-xl mx-auto space-y-8 relative z-10">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black text-black dark:text-white">Your Spaces</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-bold">Where the magic happens</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 pr-4 rounded-full shadow-sm border border-slate-100 dark:border-slate-700">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${user?.avatarColor || 'bg-violet-500'}`}>
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.username}</span>
            <button onClick={() => { API.logout(); window.location.reload(); }} className="ml-2 text-slate-400 hover:text-rose-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {loading ? (
          <div className="text-center text-slate-500 py-20">
            <div className="animate-pulse">Loading spaces...</div>
          </div>
        ) : existingSpace ? (
          // Single Space View (One Space Limit)
          <div 
             onClick={() => navigate(`/space/${existingSpace.id}`)}
             className="group relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-violet-500/10 hover:shadow-2xl hover:shadow-violet-500/20 transition-all cursor-pointer h-64 flex flex-col justify-between"
          >
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 rounded-bl-[10rem] transition-transform group-hover:scale-110 blur-xl" />
             
             <div className="relative z-10">
                <Badge color="bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-200">Active Space</Badge>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-600 group-hover:to-fuchsia-600 transition-all">
                  {existingSpace.name}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 font-bold mt-2">{existingSpace.members.length} member{existingSpace.members.length !== 1 && 's'}</p>
             </div>

             <div className="relative z-10 flex items-center gap-3">
               <span className="text-sm font-bold text-slate-400 group-hover:text-violet-500 transition-colors">Tap to enter</span>
               <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
                  <ArrowRightIcon />
               </div>
             </div>
          </div>
        ) : (
          // Empty State - Show Create/Join options
          <div className="text-center py-20 space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="w-32 h-32 bg-gradient-to-tr from-violet-100 to-fuchsia-100 dark:from-slate-800 dark:to-slate-700 rounded-full mx-auto flex items-center justify-center text-violet-400 dark:text-violet-300 shadow-inner">
              <Users size={56} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-black dark:text-white">You're floating in space</h3>
              <p className="text-slate-600 dark:text-slate-400 font-bold max-w-xs mx-auto">Create a cozy corner for your duo, or use their code to join them.</p>
            </div>
          </div>
        )}

        {/* Action Buttons - Only show if NO space exists */}
        {!loading && !existingSpace && (
           <div className="fixed bottom-8 left-6 right-6 max-w-xl mx-auto flex gap-4 z-50">
            {activeAction !== 'none' ? (
              <Card className="flex-1 !p-3 flex gap-2 animate-in slide-in-from-bottom-5 fade-in duration-300 shadow-2xl ring-4 ring-violet-500/10">
                 <Input 
                  autoFocus
                  placeholder={activeAction === 'create' ? "Name your space..." : "Enter Invite Code"} 
                  value={inputValue} 
                  onChange={e => setInputValue(e.target.value)}
                  className="!py-2.5"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      activeAction === 'create' ? handleCreateSubmit() : handleJoinSubmit();
                    }
                  }}
                />
                <Button 
                  onClick={activeAction === 'create' ? handleCreateSubmit : handleJoinSubmit} 
                  disabled={!inputValue.trim() || loading}
                  className="!px-6"
                >
                  {activeAction === 'create' ? 'Go' : 'Join'}
                </Button>
                <Button variant="ghost" onClick={cancelAction} disabled={loading} className="!px-3">Cancel</Button>
              </Card>
            ) : (
              <>
                <Button onClick={() => setActiveAction('join')} variant="secondary" className="flex-1 shadow-lg">
                  Join Space
                </Button>
                <Button onClick={() => setActiveAction('create')} className="flex-1 shadow-lg shadow-violet-500/20">
                  <Plus size={20} /> Create Space
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Space View Components ---

const Chat = ({ spaceId, user }: { spaceId: string, user: User }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    const msgs = await API.getMessages(spaceId);
    setMessages(msgs);
  }, [spaceId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000); 
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, replyingTo]); // Scroll on new messages or reply open

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    const replyContext = replyingTo;
    
    setInputText(''); 
    setReplyingTo(null);
    setSending(true);

    const newMsg: Message = {
      id: API.generateId(),
      spaceId,
      senderId: user.id,
      content: text,
      type: 'text',
      timestamp: Date.now(),
      replyTo: replyContext ? {
        id: replyContext.id,
        content: replyContext.content,
        senderId: replyContext.senderId
      } : undefined,
      readBy: [user.id]
    };

    setMessages(prev => [...prev, newMsg]);
    
    await API.sendMessage(spaceId, newMsg);
    setSending(false);

    // AI Check
    if (text.toLowerCase().includes('@ai') || text.toLowerCase().includes('duo')) {
      const aiResponseText = await Gemini.generateAiResponse(
        text, 
        messages, 
        ['User', 'Friend'] 
      );
      
      const aiMsg: Message = {
        id: API.generateId(),
        spaceId,
        senderId: 'ai',
        content: aiResponseText,
        type: 'text',
        timestamp: Date.now(),
        readBy: []
      };
      await API.sendMessage(spaceId, aiMsg);
      loadMessages();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 opacity-50">
            <div className="text-6xl">✨</div>
            <p className="font-medium">Start the magic here.</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderId === user.id;
          const isAi = msg.senderId === 'ai';
          const showTime = i === 0 || (msg.timestamp - messages[i-1].timestamp > 300000); 

          return (
            <React.Fragment key={msg.id}>
              {showTime && (
                <div className="flex items-center justify-center gap-4 py-2 opacity-50">
                   <div className="h-px w-10 bg-slate-300 dark:bg-slate-700"></div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                   <div className="h-px w-10 bg-slate-300 dark:bg-slate-700"></div>
                </div>
              )}
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300 group`}>
                <div className="flex flex-col max-w-[85%] relative">
                  
                  {/* Reply Action Button - UPDATED for better mobile experience */}
                  <button 
                    onClick={() => setReplyingTo(msg)}
                    className={`absolute top-1/2 -translate-y-1/2 p-2 rounded-full transition-all bg-slate-100 dark:bg-slate-800 shadow-sm z-10 
                      ${isMe ? '-left-10' : '-right-10'}
                      text-slate-300 hover:text-violet-500
                    `}
                    aria-label="Reply"
                  >
                    <Reply size={14} />
                  </button>

                  <div className={`
                    p-4 rounded-3xl text-[15px] leading-relaxed shadow-sm relative z-0
                    ${isMe 
                      ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-none shadow-violet-500/20' 
                      : isAi 
                        ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-violet-100 dark:border-violet-900/30 rounded-bl-none shadow-sm' 
                        : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                    }
                  `}>
                    {/* Replying Context Bubble */}
                    {msg.replyTo && (
                      <div className={`mb-2 p-2 rounded-xl text-xs border-l-2 opacity-90 ${isMe ? 'bg-white/20 border-white/50' : 'bg-slate-100 dark:bg-slate-700 border-violet-400'}`}>
                         <div className="font-bold mb-0.5 opacity-75">{msg.replyTo.senderId === user.id ? 'You' : msg.replyTo.senderId}</div>
                         <div className="truncate">{msg.replyTo.content}</div>
                      </div>
                    )}

                    {isAi && (
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-violet-500 mb-2 tracking-wider">
                        <Bot size={12} /> Duo AI
                      </div>
                    )}
                    {msg.type === 'music_card' ? (
                       <div className="flex items-center gap-4">
                          <div className="relative">
                             <div className="absolute inset-0 bg-black/20 rounded-xl"></div>
                             <img src={msg.metadata?.musicData?.coverArt} alt="cover" className="w-14 h-14 rounded-xl object-cover shadow-lg" />
                             <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-violet-600 border-b-[4px] border-b-transparent ml-0.5"></div>
                                </div>
                             </div>
                          </div>
                          <div className="overflow-hidden min-w-0">
                            <div className="font-bold truncate pr-2">{msg.metadata?.musicData?.title}</div>
                            <div className="text-xs opacity-80 truncate">{msg.metadata?.musicData?.artist}</div>
                          </div>
                       </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="glass border-t border-white/20 dark:border-white/5 pb-6">
        {/* Replying Interface */}
        {replyingTo && (
           <div className="px-4 py-2 flex items-center justify-between bg-violet-50/50 dark:bg-violet-900/10 border-b border-violet-100 dark:border-white/5 backdrop-blur-md animate-in slide-in-from-bottom-2">
              <div className="flex flex-col border-l-2 border-violet-500 pl-3">
                 <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase">Replying to {replyingTo.senderId === user.id ? 'Yourself' : replyingTo.senderId}</span>
                 <span className="text-xs text-slate-600 dark:text-slate-300 truncate max-w-[250px]">{replyingTo.content}</span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-black/5 rounded-full">
                 <X size={16} className="text-slate-500" />
              </button>
           </div>
        )}

        <div className="p-4 flex gap-3 items-end">
          <Input 
            placeholder="Say something nice..." 
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            className="!py-3.5 !rounded-2xl"
          />
          <Button onClick={handleSend} disabled={!inputText.trim() || sending} className="!p-3.5 !rounded-2xl aspect-square">
            <Send size={20} fill="currentColor" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const MiniGame = ({ spaceId, user }: { spaceId: string, user: User }) => {
  const [space, setSpace] = useState<DuoSpace | null>(null);
  
  // Poll for game state so both players are synced
  useEffect(() => {
    const fetchGame = async () => {
       const spaces = await API.getSpaces(user.id);
       const s = spaces.find(sp => sp.id === spaceId);
       if (s) setSpace(s);
    };
    fetchGame(); // Initial
    const interval = setInterval(fetchGame, 2000);
    return () => clearInterval(interval);
  }, [spaceId, user.id]);

  const activeGame = space?.activeGame;
  const board = activeGame?.board || Array(9).fill(null);
  const currentPlayer = activeGame?.currentPlayer;
  const isMyTurn = currentPlayer === user.id;
  
  const resetRequests = activeGame?.resetRequests || [];
  const iRequestedReset = resetRequests.includes(user.id);
  
  const opponentId = space?.members.find(m => m !== user.id);

  const handleMove = async (index: number) => {
    if (!activeGame) {
       // Start new game
       const newBoard = Array(9).fill(null);
       newBoard[index] = 'X'; 
       await API.updateGame(spaceId, {
         id: API.generateId(),
         type: 'tictactoe',
         board: newBoard,
         currentPlayer: opponentId || 'unknown', // Pass turn to opponent
         status: 'active',
         resetRequests: [],
         lastUpdated: Date.now()
       });
       return;
    }

    // Turn Logic Check
    if (!isMyTurn) {
      alert("It's not your turn!");
      return;
    }
    
    if (board[index]) return; // Occupied

    const newBoard = [...board];
    // Simple logic: X always starts (assumed). Alternate.
    const moves = newBoard.filter(Boolean).length;
    const symbol = moves % 2 === 0 ? 'X' : 'O';

    newBoard[index] = symbol;

    await API.updateGame(spaceId, {
      ...activeGame,
      board: newBoard,
      currentPlayer: opponentId || user.id, // Swap
      lastUpdated: Date.now()
    });
  };

  const requestReset = async () => {
    if (!activeGame) return;

    let newRequests = [...resetRequests];
    if (!newRequests.includes(user.id)) {
       newRequests.push(user.id);
    }

    // Check if both requested or if I am the only one but opponent is missing/offline (simplified: require both if 2 members)
    const membersCount = space?.members.length || 1;
    
    if (newRequests.length >= membersCount) {
       // Reset Game
       await API.updateGame(spaceId, {
         id: API.generateId(),
         type: 'tictactoe',
         board: Array(9).fill(null),
         currentPlayer: activeGame.currentPlayer, // Keep turn
         status: 'active',
         resetRequests: [],
         lastUpdated: Date.now()
       });
    } else {
       // Just update requests
       await API.updateGame(spaceId, {
          ...activeGame,
          resetRequests: newRequests
       });
    }
  };

  if (!space) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto" /></div>;

  return (
    <div className="p-6 flex flex-col items-center justify-center h-full space-y-8 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="text-center space-y-2">
         <Badge color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300">Tic-Tac-Toe</Badge>
        <h2 className="text-3xl font-black text-slate-800 dark:text-white">
           {!activeGame ? "Start a Game" : (isMyTurn ? "Your Turn!" : "Waiting...")}
        </h2>
        {activeGame && (
          <p className="text-sm text-slate-500 font-bold">You are playing with {opponentId ? 'your friend' : 'yourself (waiting for friend)'}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 p-4 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl shadow-violet-500/10">
        {board.map((cell, i) => (
          <button 
            key={i} 
            onClick={() => handleMove(i)}
            disabled={!!cell || (activeGame && !isMyTurn)}
            className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-2xl flex items-center justify-center text-4xl font-black text-slate-700 dark:text-white shadow-inner hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors disabled:cursor-not-allowed disabled:opacity-80"
          >
            {cell === 'X' && <span className="text-violet-500">X</span>}
            {cell === 'O' && <span className="text-rose-500">O</span>}
          </button>
        ))}
      </div>

      <Button 
        variant={iRequestedReset ? "ghost" : "secondary"} 
        onClick={requestReset}
        disabled={iRequestedReset && resetRequests.length < (space.members.length)}
      >
        <RefreshCw size={16} className={iRequestedReset ? "animate-spin" : ""} /> 
        {iRequestedReset ? "Waiting for friend..." : "Reset Game"}
      </Button>
    </div>
  );
};

const MusicShare = ({ spaceId, user }: { spaceId: string, user: User }) => {
  const [url, setUrl] = useState('');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!url) return;
    setLoading(true);
    const metadata = await Gemini.extractMusicMetadata(url);
    
    const newSong: Song = {
      id: API.generateId(),
      url,
      title: metadata.title || 'Track',
      artist: metadata.artist || 'Artist',
      coverArt: metadata.coverArt || 'https://picsum.photos/200',
      addedBy: user.id,
      platform: (metadata.platform as any) || 'other',
      reactions: {}
    };

    setSongs(prev => [newSong, ...prev]);
    
    await API.sendMessage(spaceId, {
      id: API.generateId(),
      spaceId,
      senderId: user.id,
      content: `Shared a song: ${newSong.title}`,
      type: 'music_card',
      timestamp: Date.now(),
      readBy: [],
      metadata: { musicData: newSong }
    });

    setLoading(false);
    setUrl('');
  };

  return (
    <div className="p-4 space-y-6 h-full overflow-y-auto no-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
      <Card className="space-y-4 !p-5">
        <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
          <Zap size={18} className="text-yellow-500" fill="currentColor" /> Share a Banger
        </h3>
        <div className="flex gap-2">
          <Input 
            placeholder="Paste Link (Spotify/YT)..." 
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="!py-3"
          />
          <Button onClick={handleShare} isLoading={loading} className="aspect-square !p-3">
            <Plus size={24} />
          </Button>
        </div>
      </Card>

      <div className="space-y-4 pb-20">
        <h3 className="font-bold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider px-2">Recently Shared</h3>
        {songs.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <Music size={40} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-400">No vibes yet.</p>
          </div>
        ) : (
          songs.map(song => (
            <div key={song.id} className="bg-white dark:bg-slate-800 p-3 rounded-2xl flex gap-4 shadow-sm border border-slate-100 dark:border-slate-700 items-center hover:scale-[1.02] transition-transform">
              <img src={song.coverArt} className="w-16 h-16 rounded-xl object-cover shadow-md" alt="art" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 dark:text-white truncate text-lg">{song.title}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 truncate font-medium">{song.artist}</div>
              </div>
               <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                  <ArrowRightIcon />
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const SettingsPanel = ({ spaceId, user }: { spaceId: string, user: User }) => {
  const navigate = useNavigate();
  const [space, setSpace] = useState<DuoSpace | null>(null);
  const [settings, setSettings] = useState(user.settings);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    API.getSpaces(user.id).then(spaces => {
      const s = spaces.find(sp => sp.id === spaceId);
      if (s) setSpace(s);
    });
  }, [spaceId, user.id]);

  const toggleSetting = async (key: keyof User['settings']) => {
    const newVal = !settings[key];
    const newSettings = { ...settings, [key]: newVal };
    setSettings(newSettings);
    
    if (key === 'theme') {
       const nextTheme = settings.theme === 'light' ? 'dark' : 'light';
       setSettings({ ...settings, theme: nextTheme });
       await API.updateUserSettings(user.id, { theme: nextTheme });
       return;
    }

    await API.updateUserSettings(user.id, { [key]: newVal });
  };

  const handleLeave = async () => {
    if (!confirmLeave) {
      setConfirmLeave(true);
      setTimeout(() => setConfirmLeave(false), 3000); // Reset after 3s
      return;
    }

    setLeaving(true);
    await API.leaveSpace(user.id, spaceId);
    navigate('/');
  };

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
      <Card>
        <h3 className="font-bold mb-4 text-slate-800 dark:text-white">The Keys</h3>
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-700">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invite Code</span>
                <span className="text-lg font-mono font-bold text-violet-600 dark:text-violet-400 tracking-widest">{space?.code}</span>
             </div>
             <button className="w-10 h-10 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-400 shadow-sm hover:text-violet-500"><Copy size={18} /></button>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold mb-4 text-slate-800 dark:text-white">Vibe Check</h3>
         
         {/* Theme Toggle */}
         <div className="flex items-center justify-between py-3 cursor-pointer group" onClick={() => toggleSetting('theme')}>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-violet-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400">
               {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
             </div>
             <span className="text-slate-700 dark:text-slate-200 font-bold">Dark Mode</span>
          </div>
          <div className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${settings.theme === 'dark' ? 'bg-violet-600' : 'bg-slate-200'}`}>
             <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${settings.theme === 'dark' ? 'left-7' : 'left-1'}`}></div>
          </div>
        </div>

        {/* Read Receipts */}
        <div className="flex items-center justify-between py-3 cursor-pointer group" onClick={() => toggleSetting('readReceipts')}>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-rose-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-rose-500 dark:text-rose-400">
               <Check size={20} />
             </div>
             <span className="text-slate-700 dark:text-slate-200 font-bold">Read Receipts</span>
          </div>
          <div className={`w-14 h-8 rounded-full relative transition-colors duration-300 ${settings.readReceipts ? 'bg-rose-500' : 'bg-slate-200'}`}>
             <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${settings.readReceipts ? 'left-7' : 'left-1'}`}></div>
          </div>
        </div>
      </Card>

      <Button 
        variant={confirmLeave ? "danger" : "secondary"} 
        className="w-full mt-8" 
        onClick={handleLeave}
        isLoading={leaving}
      >
        {confirmLeave ? (
           <>Are you sure? Click again.</>
        ) : (
           <><DoorOpen size={18} /> Leave Space</>
        )}
      </Button>
      {confirmLeave && (
         <p className="text-center text-xs text-rose-500 mt-2 font-bold animate-pulse">
            Warning: This action cannot be undone.
         </p>
      )}
    </div>
  );
};

const SpaceView = () => {
  const { id } = useParams<{ id: string }>();
  const user = API.getSession()?.user;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chat' | 'music' | 'game' | 'settings'>('chat');

  useEffect(() => {
    if (!user || !id) navigate('/');
  }, [user, id, navigate]);

  if (!user || !id) return null;

  return (
    <div className="h-full flex flex-col max-w-lg mx-auto shadow-2xl overflow-hidden bg-white/50 dark:bg-slate-900/80 backdrop-blur-xl relative">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/90 border-b border-slate-100 dark:border-slate-800 p-4 pt-safe flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
        <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
           <ArrowLeftIcon />
        </button>
        <div className="font-black text-slate-800 dark:text-white tracking-tight text-lg">DuoSpace</div>
        <div className="w-10" /> 
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative z-10">
        {activeTab === 'chat' && <Chat spaceId={id} user={user} />}
        {activeTab === 'music' && <MusicShare spaceId={id} user={user} />}
        {activeTab === 'game' && <MiniGame spaceId={id} user={user} />}
        {activeTab === 'settings' && <SettingsPanel spaceId={id} user={user} />}
      </div>

      {/* Tab Bar */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-2 pb-6 pb-safe flex justify-around items-center sticky bottom-0 z-20">
        <TabButton icon={<MessageCircle size={24} />} active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
        <TabButton icon={<Music size={24} />} active={activeTab === 'music'} onClick={() => setActiveTab('music')} />
        <TabButton icon={<Gamepad2 size={24} />} active={activeTab === 'game'} onClick={() => setActiveTab('game')} />
        <TabButton icon={<Settings size={24} />} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
      </div>
    </div>
  );
};

const TabButton = ({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`p-4 rounded-2xl transition-all duration-300 ${active ? 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-300 scale-105 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
  >
    {icon}
  </button>
);

const ArrowRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
)

const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
)

// --- Main App Wrapper ---

export default function App() {
  const [session, setSession] = useState(API.getSession());

  // Listen for session updates triggered by storage.ts
  useEffect(() => {
    const handleSessionUpdate = () => {
      setSession(API.getSession());
    };
    window.addEventListener('duospace-session-update', handleSessionUpdate);
    return () => window.removeEventListener('duospace-session-update', handleSessionUpdate);
  }, []);

  const refreshSession = () => {
    setSession(API.getSession());
  };

  // Sync Dark Mode
  useEffect(() => {
    const isDark = session?.user.settings.theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [session]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={
          session ? <Dashboard /> : <AuthView onLogin={refreshSession} />
        } />
        <Route path="/space/:id" element={<SpaceView />} />
      </Routes>
    </HashRouter>
  );
  }
