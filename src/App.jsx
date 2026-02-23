/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Lock, 
  MessageSquare, 
  Send, 
  Cpu, 
  Image as ImageIcon,
  X,
  Loader2,
  Globe,
  ExternalLink,
  Trash2,
  ArrowLeft,
  Ghost,
  Maximize2,
  Minimize2,
  Wrench
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';

// Provided Logo URL
const LOGO_URL = "https://i.ibb.co/PGyM5NV4/sndflksdf.webp";

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('games');
  
  // Games State
  const [games, setGames] = useState(() => {
    const defaultGames = [
      { id: 'baseball-bros', title: 'Baseball Bros', url: 'https://db.duckmath.org/html/baseball_bros/index.html' },
      { id: 'shell-shockers', title: 'Shell Shockers', url: 'https://mathlete.pages.dev' },
      { id: 'retro-bowl-college', title: 'Retro Bowl College', url: 'https://db.duckmath.org/html/retro_bowl_college/index.html' },
      { id: 'snow-rider', title: 'Snow Rider', url: 'https://db.duckmath.org/html/snow_rider_3d/index.html' },
      { id: 'highway-traffic', title: 'Highway Traffic', url: 'https://db2.duckmath.org/2022/unity/highway-traffic/pre.html' },
      { id: 'basket-bros', title: 'Basket Bros', url: 'https://db.duckmath.org/html/basket_bros/index.html' },
      { id: 'dune', title: 'Dune', url: 'https://db.duckmath.org/html/dune/index.html' },
      { id: 'papas-pizzaria', title: "Papa's Pizzaria", url: 'https://db.duckmath.org/html/papaspizzeria/index.html' },
      { id: 'retro-bowl', title: 'Retro Bowl', url: 'https://duck.ailesson.top/db/html/retro_bowl/index.html' },
      { id: 'rocket-goal', title: 'RocketGoal.io', url: 'https://rocketgoal.io/?sdk=crazy&isNewUser=true&skipPrerollFirstSession=true' }
    ];
    return defaultGames;
  });

  const getProxiedUrl = (url) => {
    if (url.startsWith('/api/proxy')) return url;
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  };

  const [selectedGame, setSelectedGame] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabCloaked, setIsTabCloaked] = useState(false);

  // Tab Cloaking Logic
  useEffect(() => {
    if (isTabCloaked) {
      document.title = "Google Classroom";
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = "https://ssl.gstatic.com/classroom/favicon.png";
      } else {
        const newLink = document.createElement('link');
        newLink.rel = 'icon';
        newLink.href = "https://ssl.gstatic.com/classroom/favicon.png";
        document.head.appendChild(newLink);
      }
    } else {
      document.title = "GGG";
      const link = document.querySelector("link[rel~='icon']");
      if (link) {
        link.href = LOGO_URL;
      }
    }
  }, [isTabCloaked]);

  // Proxy State
  const [proxyUrl, setProxyUrl] = useState('');

  // AI State
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  const CORRECT_PASSWORD = 'gassyg123';

  useEffect(() => {
    localStorage.setItem('gassy_games', JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleUnlock = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsUnlocked(true);
      setError('');
    } else {
      setError('Invalid password.');
      setPassword('');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() && !selectedImage) return;

    const userMessage = { 
      role: 'user', 
      text: chatInput,
      image: selectedImage || undefined
    };
    
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setSelectedImage(null);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const parts = [{ text: chatInput || "Analyze this image." }];
      
      if (userMessage.image) {
        parts.push({
          inlineData: {
            data: userMessage.image.split(',')[1],
            mimeType: "image/png"
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: "You are the Gassy AI Assistant. You are professional, serious, and highly capable. You can solve homework problems, analyze images, and provide detailed explanations. Be concise but thorough.",
        }
      });

      const aiText = response.text || "I apologize, but I am unable to process your request at this time.";
      setChatMessages(prev => [...prev, { role: 'model', text: aiText }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'model', text: "A connection error has occurred. Please verify your network status." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const cloakTab = () => {
    const win = window.open();
    if (!win) {
      alert('Popup blocked! Please allow popups to use the cloak feature.');
      return;
    }
    win.document.body.style.margin = '0';
    win.document.body.style.height = '100vh';
    const iframe = win.document.createElement('iframe');
    iframe.style.border = 'none';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.margin = '0';
    iframe.src = window.location.href;
    win.document.body.appendChild(iframe);
    window.location.replace('https://google.com');
    win.document.title = "Google Classroom";
  };

  const toggleFullscreen = () => {
    const elem = document.getElementById('game-frame-container');
    if (!elem) return;
    
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4 font-sans relative overflow-hidden">
        <div className="ambient-glow top-[-200px] left-[-200px]" />
        <div className="ambient-glow bottom-[-200px] right-[-200px]" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm p-10 glass-card bg-[#020617]/40 border-emerald-500/20 shadow-2xl text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight mb-8 text-white">Login</h1>
          
          <form onSubmit={handleUnlock} className="space-y-6">
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Input Password"
                className="w-full bg-slate-900/50 border border-emerald-500/20 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all text-white placeholder:text-slate-600 text-center"
                autoFocus
              />
            </div>
            
            {error && (
              <p className="text-red-400 text-xs font-medium">{error}</p>
            )}
            
            <button 
              type="submit"
              className="w-full glow-button text-white font-bold py-4 rounded-2xl shadow-lg uppercase tracking-widest"
            >
              Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-emerald-500 selection:text-white flex flex-col">
      <div className="ambient-glow top-0 left-1/4" />
      <div className="ambient-glow bottom-0 right-1/4" />

      {/* Header */}
      {!isFullscreen && (
        <header className="nav-blur sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-0.5 overflow-hidden">
                <img src={LOGO_URL} alt="Logo" className="w-full h-full object-cover rounded-lg" />
              </div>
              <h1 className="font-bold text-xl tracking-tight glow-text">Gassy Goellner Games</h1>
            </div>

            <nav className="hidden md:flex items-center bg-slate-900/50 p-1 rounded-2xl border border-white/5">
              {[
                { id: 'games', label: 'Games', icon: Gamepad2 },
                { id: 'proxy', label: 'Proxy', icon: Globe },
                { id: 'hacks', label: 'School Hacks', icon: Wrench },
                { id: 'ai', label: 'Assistant', icon: Cpu }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedGame(null);
                  }}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>

            <button 
              onClick={() => setIsTabCloaked(!isTabCloaked)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                isTabCloaked 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-900/50 border border-white/10 text-slate-400 hover:text-emerald-400'
              }`}
              title="Disguise Tab as Google Classroom"
            >
              <Lock size={16} />
              <span className="hidden lg:inline">{isTabCloaked ? 'Cloaked' : 'Cloak Tab'}</span>
            </button>

            <button 
              onClick={cloakTab}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-slate-400 hover:text-emerald-400 transition-all text-xs font-bold uppercase tracking-widest"
              title="Open in About:Blank"
            >
              <Ghost size={16} />
              <span className="hidden lg:inline">About:Blank</span>
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 flex flex-col overflow-hidden ${isFullscreen ? 'p-0' : 'max-w-7xl w-full mx-auto p-6'}`}>
        {activeTab === 'games' && (
          <div className="flex-1 flex flex-col">
            {selectedGame ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col space-y-4"
              >
                {!isFullscreen && (
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setSelectedGame(null)}
                      className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-all font-medium"
                    >
                      <ArrowLeft size={18} /> Back to Library
                    </button>
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold tracking-tight">{selectedGame.title}</h2>
                      <button 
                        onClick={toggleFullscreen}
                        className="p-2 bg-slate-900/50 border border-white/10 rounded-xl text-slate-400 hover:text-emerald-400 transition-all"
                        title="Toggle Fullscreen"
                      >
                        <Maximize2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
                <div 
                  id="game-frame-container"
                  className={`flex-1 overflow-hidden bg-black relative ${isFullscreen ? '' : 'rounded-3xl border border-emerald-500/20 shadow-2xl'}`}
                >
                  <iframe 
                    src={getProxiedUrl(selectedGame.url)}
                    className="w-full h-full border-none"
                    title={selectedGame.title}
                    allowFullScreen
                    allow="autoplay; fullscreen; camera; focus-without-user-activation *; monetization; gamepad; keyboard-map *; xr-spatial-tracking; clipboard-write"
                    sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin allow-downloads"
                  />
                  {isFullscreen && (
                    <button 
                      onClick={toggleFullscreen}
                      className="absolute top-4 right-4 p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/60 hover:text-white transition-all opacity-0 hover:opacity-100"
                      title="Exit Fullscreen"
                    >
                      <Minimize2 size={24} />
                    </button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-bold tracking-tight">Game Library</h2>
                </div>

                {games.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40 text-center space-y-4">
                    <Gamepad2 size={64} />
                    <p className="text-lg font-medium">Your library is currently empty.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {games.map(game => (
                      <div key={game.id} className="group relative glass-card p-6 flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                            <Globe size={24} />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1 truncate">{game.title}</h3>
                          <button 
                            onClick={() => setSelectedGame(game)}
                            className="text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                          >
                            Launch <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'proxy' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto w-full space-y-12 py-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-bold tracking-tight">Scramjet Proxy</h2>
              <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
                Fast, modular, and extensible web proxy. Enter a URL to browse anonymously.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 p-2 bg-slate-900/50 border border-white/5 rounded-3xl">
              <div className="relative flex-1">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text"
                  placeholder="Enter URL (e.g., google.com)"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                  className="w-full bg-transparent p-5 pl-14 outline-none text-white font-medium"
                />
              </div>
              <button 
                onClick={() => {
                  if (proxyUrl) {
                    let finalUrl = proxyUrl;
                    if (!proxyUrl.startsWith('http')) {
                      finalUrl = `https://${proxyUrl}`;
                    }
                    setSelectedGame({
                      id: 'proxy-session',
                      title: 'Scramjet Session',
                      url: `/api/proxy?url=${encodeURIComponent(finalUrl)}`,
                    });
                    setActiveTab('games');
                  }
                }}
                className="glow-button text-white px-10 rounded-2xl font-bold text-lg"
              >
                Launch
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'hacks' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto w-full space-y-12 py-12"
          >
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-bold tracking-tight">School Hacks</h2>
              <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
                Drag these buttons to your bookmarks bar to use them on any site.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: "X-GUI",
                  desc: "A powerful GUI for web manipulation and tools.",
                  code: "javascript:(function(){var s=document.createElement('script');s.src='https://gitlab.com/CidCaribou/x-gui/-/raw/main/x-gui.min.js?ref_type=heads';document.body.appendChild(s);})();"
                }
              ].map((hack, i) => (
                <div key={i} className="glass-card p-8 space-y-4 flex flex-col">
                  <h3 className="text-xl font-bold text-emerald-500">{hack.title}</h3>
                  <p className="text-sm text-slate-400 flex-1">{hack.desc}</p>
                  <a 
                    href={hack.code}
                    onClick={(e) => e.preventDefault()}
                    className="glow-button text-white py-3 rounded-xl font-bold text-center cursor-move select-none"
                    title="Drag this to your bookmarks bar"
                  >
                    Drag Me
                  </a>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'ai' && (
          <div className="flex-1 flex flex-col overflow-hidden max-w-5xl w-full mx-auto">
            <div className="flex-1 glass-card flex flex-col overflow-hidden shadow-2xl mb-6">
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                    <div className="w-20 h-20 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Cpu size={40} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-bold">Gassy AI Assistant</p>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">Upload homework or ask any question. I am here to help.</p>
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/10' 
                        : 'bg-slate-900/80 text-slate-200 border border-white/5'
                    }`}>
                      {msg.image && (
                        <img 
                          src={msg.image} 
                          alt="Uploaded content" 
                          className="max-w-full rounded-lg mb-3 border border-white/10" 
                        />
                      )}
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-900/50 px-4 py-3 rounded-2xl flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                      <span className="text-xs text-emerald-500/60 font-medium uppercase tracking-widest">Processing...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="p-6 border-t border-white/5 bg-slate-900/30 space-y-4">
                <AnimatePresence>
                  {selectedImage && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="relative inline-block"
                    >
                      <img src={selectedImage} alt="Selected" className="h-20 w-20 object-cover rounded-xl border border-emerald-500/50" />
                      <button 
                        onClick={() => setSelectedImage(null)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 bg-slate-900/50 border border-white/10 rounded-2xl text-slate-400 hover:text-emerald-400 transition-colors flex items-center justify-center"
                  >
                    <ImageIcon size={20} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me anything..."
                    className="flex-1 bg-slate-900/50 border border-white/10 p-4 rounded-2xl text-sm outline-none focus:border-emerald-500 transition-all text-white"
                  />
                  <button 
                    onClick={handleSendMessage}
                    className="p-4 glow-button text-white rounded-2xl flex items-center justify-center"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {!isFullscreen && (
        <footer className="border-t border-white/5 py-8 bg-[#020617]/50">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center text-[11px] text-slate-600 font-medium uppercase tracking-widest">
            <span>&copy; 2026 Gassy Goellner Games</span>
          </div>
        </footer>
      )}
    </div>
  );
}
