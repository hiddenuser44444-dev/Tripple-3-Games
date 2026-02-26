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
  Search,
  User,
  Settings,
  Palette,
  LogOut,
  Save
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
  const [searchTerm, setSearchTerm] = useState('');
  const [cgSlug, setCgSlug] = useState('');

  const extractCGGame = (slug) => {
    if (!slug) return;
    const cleanSlug = slug.replace('https://www.crazygames.com/game/', '').split('/')[0];
    const game = {
      id: `cg-${cleanSlug}`,
      title: cleanSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      file: `https://www.crazygames.com/embed/${cleanSlug}`,
      isExternal: true
    };
    launchUGSGame(game);
  };
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [settings, setSettings] = useState({ 
    theme: 'dark', 
    accentColor: '#10b981', 
    cloak: 'none'
  });
  const [progress, setProgress] = useState({});

  useEffect(() => {
    // Register Ultraviolet Service Worker & BareMux
    const initUV = async () => {
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js', {
            scope: '/service/'
          });
          console.log('Ultraviolet Service Worker registered');

          // Wait for BareMux to be available
          const checkBareMux = setInterval(async () => {
            if (window.BareMux) {
              clearInterval(checkBareMux);
              try {
                const connection = new window.BareMux.BareMuxConnection("/bare/");
                await connection.setTransport("/baremux/worker.js", [{ bare: "/bare/" }]);
                console.log('BareMux transport set to /bare/');
              } catch (e) {
                console.error('BareMux connection failed:', e);
              }
            }
          }, 100);
          
          setTimeout(() => clearInterval(checkBareMux), 10000);
        } catch (err) {
          console.error('Ultraviolet initialization failed:', err);
        }
      }
    };

    initUV();
  }, []);

  useEffect(() => {
    // Apply theme with safety guards
    if (settings) {
      const themes = {
        dark: { bg: '#020617', text: '#e2e8f0' },
        midnight: { bg: '#0f172a', text: '#f1f5f9' },
        forest: { bg: '#064e3b', text: '#ecfdf5' },
        void: { bg: '#000000', text: '#ffffff' }
      };
      const theme = themes[settings.theme] || themes.dark;
      document.documentElement.style.setProperty('--bg-main', theme.bg);
      document.documentElement.style.setProperty('--text-main', theme.text);
      document.documentElement.style.setProperty('--accent-main', settings.accentColor || '#10b981');
      document.body.style.backgroundColor = theme.bg;
      document.body.style.color = theme.text;
    }
  }, [settings]);

  const getProxiedUrl = (url) => {
    if (!url) return '';
    
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    // Use Ultraviolet if available
    if (window.__uv$config && window.Ultraviolet) {
      try {
        return window.__uv$config.prefix + window.__uv$config.encodeUrl(targetUrl);
      } catch (e) {
        console.error('UV encoding failed:', e);
      }
    }

    // Fallback to existing proxy
    return `/api/v1/browse?url=${encodeURIComponent(targetUrl)}`;
  };
  
  // UGS Games List (Curated and Expanded)
  const UGS_GAMES = [
    // --- Featured ---
    { id: 'amanda-the-adventurer', title: 'Amanda The Adventurer', file: 'https://raw.githack.com/genizy/web-port/main/amanda-the-adventurer/index.html', isExternal: true, featured: true, category: 'Horror' },
    { id: 'bad-parenting', title: 'Bad Parenting 1', file: 'https://raw.githack.com/genizy/google-class/main/bad-parenting/index.html', isExternal: true, featured: true, category: 'Horror' },
    { id: 'retro-bowl', title: 'Retro Bowl', file: 'clretrobowl', featured: true, category: 'Sports' },
    { id: 'slope', title: 'Slope', file: 'clslope', featured: true, category: 'Arcade' },
    { id: '1v1lol', title: '1v1.LOL', file: 'cl1v1lol', featured: true, category: 'Action' },
    
    // --- GN-Math Collection ---
    { id: 'bowmasters-gn', title: 'Bowmasters', file: 'https://raw.githubusercontent.com/gn-math/html/main/0.html', isExternal: true, category: 'Action' },
    { id: 'ovo-gn', title: 'OvO', file: 'https://raw.githubusercontent.com/gn-math/html/main/1.html', isExternal: true, category: 'Platformer' },
    { id: 'stickman-hook-gn', title: 'Stickman Hook', file: 'https://raw.githubusercontent.com/gn-math/html/main/11.html', isExternal: true, category: 'Arcade' },
    { id: 'drive-mad-gn', title: 'Drive Mad', file: 'https://raw.githubusercontent.com/gn-math/html/main/113.html', isExternal: true, category: 'Driving' },
    { id: 'bitlife-gn', title: 'BitLife', file: 'https://raw.githubusercontent.com/gn-math/html/main/116.html', isExternal: true, category: 'Simulation' },
    
    // --- YouTube Playables ---
    { id: 'archery-master', title: 'Archery Master', file: 'https://www.youtube.com/playables/UgkxhWL-8PcJnVcWWzTqGWR1UUSXLxoBf5l-', isExternal: true, category: 'Sports' },
    { id: 'arena-kingdoms', title: 'Arena Kingdoms', file: 'https://www.youtube.com/playables/UgkxJmwg98icsWuce6d-z6eVUYILlovTRw86', isExternal: true, category: 'RPG' },
    { id: 'attack-hole', title: 'Attack Hole', file: 'https://www.youtube.com/playables/UgkxilX40LwBis1WdtTChkyvueeqxud-mNy2', isExternal: true, category: 'Arcade' },
    { id: 'ball-blast', title: 'Ball Blast', file: 'https://www.youtube.com/playables/UgkxnAS9EVTaa5oTKIIc3gCduqQvLS7PxYbV', isExternal: true, category: 'Arcade' },
    
    // --- Classic UGS ---
    { id: 'subway-surfers', title: 'Subway Surfers', file: 'clsubwaysurfers', category: 'Arcade' },
    { id: 'temple-run-2', title: 'Temple Run 2', file: 'cltemplerun2', category: 'Arcade' },
    { id: 'geometry-dash', title: 'Geometry Dash', file: 'clgeometrydash', category: 'Arcade' },
    { id: 'cookie-clicker', title: 'Cookie Clicker', file: 'clcookie-clicker' },
    { id: 'papas-pizzaria', title: "Papa's Pizzaria", file: 'clpapaspizzeria' },
    { id: 'papas-burgeria', title: "Papa's Burgeria", file: 'clpapasburgeria' },
    { id: 'papas-freezeria', title: "Papa's Freezeria", file: 'clpapasfreezeria' },
    { id: 'papas-cupcakeria', title: "Papa's Cupcakeria", file: 'clpapascupcakeria' },
    { id: 'papas-pancakeria', title: "Papa's Pancakeria", file: 'clpapaspancakeria' },
    { id: 'papas-pastaria', title: "Papa's Pastaria", file: 'clpapaspastaria' },
    { id: 'papas-taco-mia', title: "Papa's Taco Mia", file: 'clpapastacomia' },
    { id: 'papas-hotdoggeria', title: "Papa's Hotdoggeria", file: 'clpapashotdoggeria' },
    { id: 'papas-wingeria', title: "Papa's Wingeria", file: 'clpapaswingeria' },
    { id: 'papas-sushiria', title: "Papa's Sushiria", file: 'clpapassushiria' },
    { id: 'papas-bakeria', title: "Papa's Bakeria", file: 'clpapabakeria' },
    { id: 'papas-scooperia', title: "Papa's Scooperia", file: 'clpapasscooperia' },
    { id: 'papas-cheeseria', title: "Papa's Cheeseria", file: 'clpapascheeseria' },
    { id: 'papas-donuteria', title: "Papa's Donuteria", file: 'clpapadonut' },
    { id: 'geometry-dash', title: 'Geometry Dash', file: 'clgd' },
    { id: 'minecraft-1-8', title: 'Minecraft 1.8.8', file: 'clminecraft1-8-8' },
    { id: 'eaglercraft-x', title: 'Eaglercraft X', file: 'clEaglercraftX 1.8.8(u29)' },
    { id: 'happy-wheels', title: 'Happy Wheels', file: 'clhappywheels' },
    { id: 'baldis-basics', title: "Baldi's Basics", file: 'clbaldisbasics' },
    { id: 'getaway-shootout', title: 'Getaway Shootout', file: 'clgetawayshootout' },
    { id: 'rooftop-snipers', title: 'Rooftop Snipers', file: 'clrooftopsnipers' },
    { id: 'rooftop-snipers-2', title: 'Rooftop Snipers 2', file: 'clrooftopsnipers2' },
    { id: 'stickman-hook', title: 'Stickman Hook', file: 'clstickmanhook' },
    { id: 'tunnel-rush', title: 'Tunnel Rush', file: 'cltunnelrush' },
    { id: 'vex-3', title: 'Vex 3', file: 'clvex3' },
    { id: 'vex-4', title: 'Vex 4', file: 'clvex4' },
    { id: 'vex-5', title: 'Vex 5', file: 'clvex5' },
    { id: 'vex-6', title: 'Vex 6', file: 'clvex6' },
    { id: 'vex-7', title: 'Vex 7', file: 'clvex7' },
    { id: 'vex-8', title: 'Vex 8', file: 'clvex8' },
    { id: 'run-3', title: 'Run 3', file: 'clrun3' },
    { id: 'snow-rider', title: 'Snow Rider 3D', file: 'clsnowrider' },
    { id: 'monkeymart', title: 'Monkey Mart', file: 'clmonkeymart' },
    { id: 'pizzatower', title: 'Pizza Tower', file: 'clpizzatower' },
    { id: 'portal', title: 'Portal', file: 'clportal' },
    { id: 'pou', title: 'Pou', file: 'clpou' },
    { id: 'raftwars', title: 'Raft Wars', file: 'clraftwars' },
    { id: 'redball4', title: 'Red Ball 4', file: 'clredball4' },
    { id: 'riddleschool', title: 'Riddle School', file: 'clriddleschool' },
    { id: 'smashflash2', title: 'Super Smash Flash 2', file: 'clsupersmashflash2' },
    { id: 'stickwar', title: 'Stick War', file: 'clstickwar' },
    { id: 'worldshardestgame', title: 'World\'s Hardest Game', file: 'clworldshardestgame' },
    { id: 'soccerrandom', title: 'Soccer Random', file: 'clsoccerrandom' },
    { id: 'volleyrandom', title: 'Volley Random', file: 'clvolleyrandom' },
    { id: 'bindingofisaac', title: 'Binding of Isaac', file: 'clbindingofisaac' },
    { id: 'terraria', title: 'Terraria', file: 'clterraria' },
    { id: 'undertale', title: 'Undertale', file: 'clundertale' },
    { id: 'bulletforce', title: 'Bullet Force', file: 'clbulletforce' },
    { id: 'madalinstuntcars2', title: 'Madalin Stunt Cars 2', file: 'clmadalinstuntcars2' },
    { id: 'slope2', title: 'Slope 2', file: 'clslope2' },
    { id: 'tunnelrush2', title: 'Tunnel Rush 2', file: 'cltunnelrush2' },

    // --- External / CrazyGames ---
    { id: 'drift-hunters', title: 'Drift Hunters', file: 'https://www.crazygames.com/embed/drift-hunters', isExternal: true },
    { id: 'moto-x3m', title: 'Moto X3M', file: 'https://www.crazygames.com/embed/moto-x3m', isExternal: true },
    { id: 'smash-karts', title: 'Smash Karts', file: 'https://www.crazygames.com/embed/smash-karts', isExternal: true },
    { id: 'bloxd-io', title: 'Bloxd.io', file: 'https://www.crazygames.com/embed/bloxd-io', isExternal: true },
    { id: 'minecraft-classic', title: 'Minecraft Classic', file: 'https://classic.minecraft.net', isExternal: true },
    { id: 'crossy-road', title: 'Crossy Road', file: 'https://www.crazygames.com/embed/crossy-road', isExternal: true },
    { id: 'temple-run-2', title: 'Temple Run 2', file: 'https://www.crazygames.com/embed/temple-run-2', isExternal: true },
    { id: 'uno-online', title: 'Uno Online', file: 'https://www.crazygames.com/embed/uno-online', isExternal: true },
    { id: 'chess-online', title: 'Chess Online', file: 'https://www.crazygames.com/embed/chess-online', isExternal: true },
    { id: 'zombs-royale', title: 'Zombs Royale', file: 'https://zombsroyale.io', isExternal: true },
    { id: 'surviv-io', title: 'Surviv.io (Reborn)', file: 'https://surviv.io', isExternal: true },
    { id: 'moomoo-io', title: 'MooMoo.io', file: 'https://moomoo.io', isExternal: true },
    { id: 'deeeep-io', title: 'Deeeep.io', file: 'https://deeeep.io', isExternal: true },
    { id: 'super-liquurn', title: 'Super Liquurn', file: 'https://www.crazygames.com/embed/super-liquurn', isExternal: true },
    { id: 'ragdoll-archers', title: 'Ragdoll Archers', file: 'https://www.crazygames.com/embed/ragdoll-archers', isExternal: true },
    { id: 'buildnow-gg', title: 'BuildNow GG', file: 'https://www.crazygames.com/embed/buildnow-gg', isExternal: true },
    { id: 'scary-maze', title: 'Scary Maze', file: 'https://www.crazygames.com/embed/scary-maze', isExternal: true },
    { id: 'impossible-quiz', title: 'The Impossible Quiz', file: 'https://www.crazygames.com/embed/the-impossible-quiz', isExternal: true },
    { id: 'duck-life-4', title: 'Duck Life 4', file: 'https://www.crazygames.com/embed/duck-life-4', isExternal: true },
    { id: 'fireboy-watergirl-1', title: 'Fireboy and Watergirl 1', file: 'https://www.crazygames.com/embed/fireboy-and-watergirl-1-forest-temple', isExternal: true },
    { id: 'fireboy-watergirl-2', title: 'Fireboy and Watergirl 2', file: 'https://www.crazygames.com/embed/fireboy-and-watergirl-2-light-temple', isExternal: true },
    { id: 'fireboy-watergirl-3', title: 'Fireboy and Watergirl 3', file: 'https://www.crazygames.com/embed/fireboy-and-watergirl-3-ice-temple', isExternal: true },
    { id: 'fireboy-watergirl-4', title: 'Fireboy and Watergirl 4', file: 'https://www.crazygames.com/embed/fireboy-and-watergirl-4-crystal-temple', isExternal: true },
    { id: 'fireboy-watergirl-5', title: 'Fireboy and Watergirl 5', file: 'https://www.crazygames.com/embed/fireboy-and-watergirl-5-elements', isExternal: true },
    { id: 'fireboy-watergirl-6', title: 'Fireboy and Watergirl 6', file: 'https://www.crazygames.com/embed/fireboy-and-watergirl-6-fairy-tales', isExternal: true },
    { id: 'bob-the-robber', title: 'Bob the Robber', file: 'https://www.crazygames.com/embed/bob-the-robber', isExternal: true },
    { id: 'bob-the-robber-2', title: 'Bob the Robber 2', file: 'https://www.crazygames.com/embed/bob-the-robber-2', isExternal: true },
    { id: 'snail-bob', title: 'Snail Bob', file: 'https://www.crazygames.com/embed/snail-bob', isExternal: true },
    { id: 'snail-bob-2', title: 'Snail Bob 2', file: 'https://www.crazygames.com/embed/snail-bob-2', isExternal: true },
    { id: 'wheely-1', title: 'Wheely 1', file: 'https://www.crazygames.com/embed/wheely-1', isExternal: true },
    { id: 'wheely-2', title: 'Wheely 2', file: 'https://www.crazygames.com/embed/wheely-2', isExternal: true },
    { id: 'wheely-3', title: 'Wheely 3', file: 'https://www.crazygames.com/embed/wheely-3', isExternal: true },
    { id: 'wheely-4', title: 'Wheely 4', file: 'https://www.crazygames.com/embed/wheely-4', isExternal: true },
    { id: 'wheely-5', title: 'Wheely 5', file: 'https://www.crazygames.com/embed/wheely-5', isExternal: true },
    { id: 'wheely-6', title: 'Wheely 6', file: 'https://www.crazygames.com/embed/wheely-6', isExternal: true },
    { id: 'wheely-7', title: 'Wheely 7', file: 'https://www.crazygames.com/embed/wheely-7', isExternal: true },
    { id: 'wheely-8', title: 'Wheely 8', file: 'https://www.crazygames.com/embed/wheely-8', isExternal: true },
    { id: 'bad-ice-cream-1', title: 'Bad Ice Cream', file: 'https://www.crazygames.com/embed/bad-ice-cream', isExternal: true },
    { id: 'bad-ice-cream-2', title: 'Bad Ice Cream 2', file: 'https://www.crazygames.com/embed/bad-ice-cream-2', isExternal: true },
    { id: 'bad-ice-cream-3', title: 'Bad Ice Cream 3', file: 'https://www.crazygames.com/embed/bad-ice-cream-3', isExternal: true },
    { id: 'fancy-pants-adventure-1', title: 'Fancy Pants Adventure', file: 'https://www.crazygames.com/embed/fancy-pants-adventure', isExternal: true },
    { id: 'fancy-pants-adventure-2', title: 'Fancy Pants Adventure 2', file: 'https://www.crazygames.com/embed/fancy-pants-adventure-2', isExternal: true },
    { id: 'fancy-pants-adventure-3', title: 'Fancy Pants Adventure 3', file: 'https://www.crazygames.com/embed/fancy-pants-adventure-3', isExternal: true },
    { id: 'world-hardest-game-2', title: 'World\'s Hardest Game 2', file: 'https://www.crazygames.com/embed/the-worlds-hardest-game-2', isExternal: true },
    { id: 'world-hardest-game-3', title: 'World\'s Hardest Game 3', file: 'https://www.crazygames.com/embed/the-worlds-hardest-game-3', isExternal: true },
    { id: 'world-hardest-game-4', title: 'World\'s Hardest Game 4', file: 'https://www.crazygames.com/embed/the-worlds-hardest-game-4', isExternal: true },
    { id: 'rocketgoal-io', title: 'Rocket Goal', file: 'https://rocketgoal.io', isExternal: true },
    { id: 'super-mario-run', title: 'Super Mario Run', file: 'https://www.crazygames.com/embed/super-mario-run', isExternal: true },
    { id: 'sonic-reborn', title: 'Sonic Reborn', file: 'https://www.crazygames.com/embed/sonic-reborn', isExternal: true },
    { id: 'pacman-cg', title: 'Pac-Man', file: 'https://www.crazygames.com/embed/pac-man', isExternal: true },
    { id: 'tetris-cg', title: 'Tetris', file: 'https://www.crazygames.com/embed/tetris', isExternal: true },
    { id: 'slope-cg', title: 'Slope', file: 'https://www.crazygames.com/embed/slope', isExternal: true },
    { id: 'tunnel-rush-cg', title: 'Tunnel Rush', file: 'https://www.crazygames.com/embed/tunnel-rush', isExternal: true },
    { id: 'geometry-dash-cg', title: 'Geometry Dash', file: 'https://www.crazygames.com/embed/geometry-dash-online', isExternal: true },
    { id: 'subway-surfers-cg', title: 'Subway Surfers', file: 'https://www.crazygames.com/embed/subway-surfers', isExternal: true },
    { id: 'temple-run-cg', title: 'Temple Run', file: 'https://www.crazygames.com/embed/temple-run-2', isExternal: true },
    { id: 'angry-birds-cg', title: 'Angry Birds', file: 'https://www.crazygames.com/embed/angry-birds-online', isExternal: true },
    { id: 'cut-the-rope-cg', title: 'Cut the Rope', file: 'https://www.crazygames.com/embed/cut-the-rope', isExternal: true },
    { id: 'fruit-ninja-cg', title: 'Fruit Ninja', file: 'https://www.crazygames.com/embed/fruit-ninja', isExternal: true },
    { id: 'jetpack-joyride-cg', title: 'Jetpack Joyride', file: 'https://www.crazygames.com/embed/jetpack-joyride', isExternal: true },
    { id: 'flappy-bird-cg', title: 'Flappy Bird', file: 'https://www.crazygames.com/embed/flappy-bird', isExternal: true },
    { id: '2048-cg', title: '2048', file: 'https://www.crazygames.com/embed/2048', isExternal: true },
    { id: 'minecraft-classic-cg', title: 'Minecraft Classic', file: 'https://www.crazygames.com/embed/minecraft-classic', isExternal: true },
    { id: 'roblox-cg', title: 'Roblox (Embed)', file: 'https://www.crazygames.com/embed/roblox', isExternal: true },
    { id: 'among-us-cg', title: 'Among Us (Embed)', file: 'https://www.crazygames.com/embed/among-us-online', isExternal: true },
    { id: 'fall-guys-cg', title: 'Fall Guys (Embed)', file: 'https://www.crazygames.com/embed/fall-guys-online', isExternal: true },
    { id: 'fortnite-cg', title: 'Fortnite (Embed)', file: 'https://www.crazygames.com/embed/fortnite-online', isExternal: true },
    { id: 'pubg-cg', title: 'PUBG (Embed)', file: 'https://www.crazygames.com/embed/pubg-online', isExternal: true },
    { id: 'free-fire-cg', title: 'Free Fire (Embed)', file: 'https://www.crazygames.com/embed/free-fire-online', isExternal: true },
    { id: 'call-of-duty-cg', title: 'Call of Duty (Embed)', file: 'https://www.crazygames.com/embed/call-of-duty-online', isExternal: true },
    { id: 'gta-v-cg', title: 'GTA V (Embed)', file: 'https://www.crazygames.com/embed/gta-v-online', isExternal: true },
    { id: 'fifa-cg', title: 'FIFA (Embed)', file: 'https://www.crazygames.com/embed/fifa-online', isExternal: true },
    { id: 'nba-2k-cg', title: 'NBA 2K (Embed)', file: 'https://www.crazygames.com/embed/nba-2k-online', isExternal: true },
    { id: 'madden-cg', title: 'Madden (Embed)', file: 'https://www.crazygames.com/embed/madden-online', isExternal: true },
    { id: 'wwe-2k-cg', title: 'WWE 2K (Embed)', file: 'https://www.crazygames.com/embed/wwe-2k-online', isExternal: true },
    { id: 'ufc-cg', title: 'UFC (Embed)', file: 'https://www.crazygames.com/embed/ufc-online', isExternal: true },
    { id: 'f1-cg', title: 'F1 (Embed)', file: 'https://www.crazygames.com/embed/f1-online', isExternal: true },
    { id: 'gran-turismo-cg', title: 'Gran Turismo (Embed)', file: 'https://www.crazygames.com/embed/gran-turismo-online', isExternal: true },
    { id: 'forza-cg', title: 'Forza (Embed)', file: 'https://www.crazygames.com/embed/forza-online', isExternal: true },
    { id: 'need-for-speed-cg', title: 'Need for Speed (Embed)', file: 'https://www.crazygames.com/embed/need-for-speed-online', isExternal: true },
    { id: 'burnout-cg', title: 'Burnout (Embed)', file: 'https://www.crazygames.com/embed/burnout-online', isExternal: true },
    { id: 'flatout-cg', title: 'FlatOut (Embed)', file: 'https://www.crazygames.com/embed/flatout-online', isExternal: true },
    { id: 'wreckfest-cg', title: 'Wreckfest (Embed)', file: 'https://www.crazygames.com/embed/wreckfest-online', isExternal: true },
    { id: 'dirt-cg', title: 'DiRT (Embed)', file: 'https://www.crazygames.com/embed/dirt-online', isExternal: true },
    { id: 'grid-cg', title: 'GRID (Embed)', file: 'https://www.crazygames.com/embed/grid-online', isExternal: true },
    { id: 'assetto-corsa-cg', title: 'Assetto Corsa (Embed)', file: 'https://www.crazygames.com/embed/assetto-corsa-online', isExternal: true },
    { id: 'project-cars-cg', title: 'Project CARS (Embed)', file: 'https://www.crazygames.com/embed/project-cars-online', isExternal: true },
    { id: 'iracing-cg', title: 'iRacing (Embed)', file: 'https://www.crazygames.com/embed/iracing-online', isExternal: true },
    { id: 'rfactor-cg', title: 'rFactor (Embed)', file: 'https://www.crazygames.com/embed/rfactor-online', isExternal: true },
    { id: 'beamng-cg', title: 'BeamNG.drive (Embed)', file: 'https://www.crazygames.com/embed/beamng-drive-online', isExternal: true },
    { id: 'euro-truck-simulator-cg', title: 'Euro Truck Simulator (Embed)', file: 'https://www.crazygames.com/embed/euro-truck-simulator-online', isExternal: true },
    { id: 'american-truck-simulator-cg', title: 'American Truck Simulator (Embed)', file: 'https://www.crazygames.com/embed/american-truck-simulator-online', isExternal: true },
    { id: 'farming-simulator-cg', title: 'Farming Simulator (Embed)', file: 'https://www.crazygames.com/embed/farming-simulator-online', isExternal: true },
    { id: 'the-sims-cg', title: 'The Sims (Embed)', file: 'https://www.crazygames.com/embed/the-sims-online', isExternal: true },
    { id: 'simcity-cg', title: 'SimCity (Embed)', file: 'https://www.crazygames.com/embed/simcity-online', isExternal: true },
    { id: 'cities-skylines-cg', title: 'Cities: Skylines (Embed)', file: 'https://www.crazygames.com/embed/cities-skylines-online', isExternal: true },
    { id: 'planet-coaster-cg', title: 'Planet Coaster (Embed)', file: 'https://www.crazygames.com/embed/planet-coaster-online', isExternal: true },
    { id: 'planet-zoo-cg', title: 'Planet Zoo (Embed)', file: 'https://www.crazygames.com/embed/planet-zoo-online', isExternal: true },
    { id: 'jurassic-world-evolution-cg', title: 'Jurassic World Evolution (Embed)', file: 'https://www.crazygames.com/embed/jurassic-world-evolution-online', isExternal: true },
    { id: 'zoo-tycoon-cg', title: 'Zoo Tycoon (Embed)', file: 'https://www.crazygames.com/embed/zoo-tycoon-online', isExternal: true },
    { id: 'rollercoaster-tycoon-cg', title: 'RollerCoaster Tycoon (Embed)', file: 'https://www.crazygames.com/embed/rollercoaster-tycoon-online', isExternal: true },
    { id: 'theme-park-tycoon-cg', title: 'Theme Park Tycoon (Embed)', file: 'https://www.crazygames.com/embed/theme-park-tycoon-online', isExternal: true },
    { id: 'restaurant-tycoon-cg', title: 'Restaurant Tycoon (Embed)', file: 'https://www.crazygames.com/embed/restaurant-tycoon-online', isExternal: true },
    { id: 'retail-tycoon-cg', title: 'Retail Tycoon (Embed)', file: 'https://www.crazygames.com/embed/retail-tycoon-online', isExternal: true },
    { id: 'lumber-tycoon-cg', title: 'Lumber Tycoon (Embed)', file: 'https://www.crazygames.com/embed/lumber-tycoon-online', isExternal: true },
    { id: 'mining-simulator-cg', title: 'Mining Simulator (Embed)', file: 'https://www.crazygames.com/embed/mining-simulator-online', isExternal: true },
    { id: 'bubble-gum-simulator-cg', title: 'Bubble Gum Simulator (Embed)', file: 'https://www.crazygames.com/embed/bubble-gum-simulator-online', isExternal: true },
    { id: 'bee-swarm-simulator-cg', title: 'Bee Swarm Simulator (Embed)', file: 'https://www.crazygames.com/embed/bee-swarm-simulator-online', isExternal: true },
    { id: 'pet-simulator-cg', title: 'Pet Simulator (Embed)', file: 'https://www.crazygames.com/embed/pet-simulator-online', isExternal: true },
    { id: 'adopt-me-cg', title: 'Adopt Me! (Embed)', file: 'https://www.crazygames.com/embed/adopt-me-online', isExternal: true },
    { id: 'meepcity-cg', title: 'MeepCity (Embed)', file: 'https://www.crazygames.com/embed/meepcity-online', isExternal: true },
    { id: 'jailbreak-cg', title: 'Jailbreak (Embed)', file: 'https://www.crazygames.com/embed/jailbreak-online', isExternal: true },
    { id: 'mad-city-cg', title: 'Mad City (Embed)', file: 'https://www.crazygames.com/embed/mad-city-online', isExternal: true },
    { id: 'arsenal-cg', title: 'Arsenal (Embed)', file: 'https://www.crazygames.com/embed/arsenal-online', isExternal: true },
    { id: 'phantom-forces-cg', title: 'Phantom Forces (Embed)', file: 'https://www.crazygames.com/embed/phantom-forces-online', isExternal: true },
    { id: 'strucid-cg', title: 'Strucid (Embed)', file: 'https://www.crazygames.com/embed/strucid-online', isExternal: true },
    { id: 'bad-business-cg', title: 'Bad Business (Embed)', file: 'https://www.crazygames.com/embed/bad-business-online', isExternal: true },
    { id: 'entry-point-cg', title: 'Entry Point (Embed)', file: 'https://www.crazygames.com/embed/entry-point-online', isExternal: true },
    { id: 'not-ori-cg', title: 'Notoriety (Embed)', file: 'https://www.crazygames.com/embed/notoriety-online', isExternal: true },
    { id: 'counter-blox-cg', title: 'Counter Blox (Embed)', file: 'https://www.crazygames.com/embed/counter-blox-online', isExternal: true },
    { id: 'tower-defense-simulator-cg', title: 'Tower Defense Simulator (Embed)', file: 'https://www.crazygames.com/embed/tower-defense-simulator-online', isExternal: true },
    { id: 'all-star-tower-defense-cg', title: 'All Star Tower Defense (Embed)', file: 'https://www.crazygames.com/embed/all-star-tower-defense-online', isExternal: true },
    { id: 'anime-adventures-cg', title: 'Anime Adventures (Embed)', file: 'https://www.crazygames.com/embed/anime-adventures-online', isExternal: true },
    { id: 'pet-simulator-x-cg', title: 'Pet Simulator X (Embed)', file: 'https://www.crazygames.com/embed/pet-simulator-x-online', isExternal: true },
    { id: 'bloxfruits-cg', title: 'Blox Fruits (Embed)', file: 'https://www.crazygames.com/embed/blox-fruits-online', isExternal: true },
    { id: 'king-legacy-cg', title: 'King Legacy (Embed)', file: 'https://www.crazygames.com/embed/king-legacy-online', isExternal: true },
    { id: 'grand-piece-online-cg', title: 'Grand Piece Online (Embed)', file: 'https://www.crazygames.com/embed/grand-piece-online-online', isExternal: true },
    { id: 'shindo-life-cg', title: 'Shindo Life (Embed)', file: 'https://www.crazygames.com/embed/shindo-life-online', isExternal: true },
    { id: 'project-slayers-cg', title: 'Project Slayers (Embed)', file: 'https://www.crazygames.com/embed/project-slayers-online', isExternal: true },
    { id: 'demon-fall-cg', title: 'Demonfall (Embed)', file: 'https://www.crazygames.com/embed/demonfall-online', isExternal: true },
    { id: 'rogue-lineage-cg', title: 'Rogue Lineage (Embed)', file: 'https://www.crazygames.com/embed/rogue-lineage-online', isExternal: true },
    { id: 'deepwoken-cg', title: 'Deepwoken (Embed)', file: 'https://www.crazygames.com/embed/deepwoken-online', isExternal: true },
    { id: 'critical-legends-cg', title: 'Critical Legends (Embed)', file: 'https://www.crazygames.com/embed/critical-legends-online', isExternal: true },
    { id: 'vesteria-cg', title: 'Vesteria (Embed)', file: 'https://www.crazygames.com/embed/vesteria-online', isExternal: true },
    { id: 'world-of-magic-cg', title: 'World of Magic (Embed)', file: 'https://www.crazygames.com/embed/world-of-magic-online', isExternal: true },
    { id: 'arcane-odyssey-cg', title: 'Arcane Odyssey (Embed)', file: 'https://www.crazygames.com/embed/arcane-odyssey-online', isExternal: true },
    { id: 'dragon-adventures-cg', title: 'Dragon Adventures (Embed)', file: 'https://www.crazygames.com/embed/dragon-adventures-online', isExternal: true },
    { id: 'creatures-of-sonaria-cg', title: 'Creatures of Sonaria (Embed)', file: 'https://www.crazygames.com/embed/creatures-of-sonaria-online', isExternal: true },
    { id: 'horse-world-cg', title: 'Horse World (Embed)', file: 'https://www.crazygames.com/embed/horse-world-online', isExternal: true },
    { id: 'wild-horse-islands-cg', title: 'Wild Horse Islands (Embed)', file: 'https://www.crazygames.com/embed/wild-horse-islands-online', isExternal: true },
    { id: 'warriors-cats-cg', title: 'Warrior Cats (Embed)', file: 'https://www.crazygames.com/embed/warrior-cats-online', isExternal: true },
    { id: 'animal-simulator-cg', title: 'Animal Simulator (Embed)', file: 'https://www.crazygames.com/embed/animal-simulator-online', isExternal: true },
    { id: 'wolf-online-cg', title: 'Wolf Online (Embed)', file: 'https://www.crazygames.com/embed/wolf-online-online', isExternal: true },
    { id: 'cat-online-cg', title: 'Cat Online (Embed)', file: 'https://www.crazygames.com/embed/cat-online-online', isExternal: true },
    { id: 'dog-online-cg', title: 'Dog Online (Embed)', file: 'https://www.crazygames.com/embed/dog-online-online', isExternal: true },
    { id: 'bear-online-cg', title: 'Bear Online (Embed)', file: 'https://www.crazygames.com/embed/bear-online-online', isExternal: true },
    { id: 'lion-online-cg', title: 'Lion Online (Embed)', file: 'https://www.crazygames.com/embed/lion-online-online', isExternal: true },
    { id: 'tiger-online-cg', title: 'Tiger Online (Embed)', file: 'https://www.crazygames.com/embed/tiger-online-online', isExternal: true },
    { id: 'leopard-online-cg', title: 'Leopard Online (Embed)', file: 'https://www.crazygames.com/embed/leopard-online-online', isExternal: true },
    { id: 'cheetah-online-cg', title: 'Cheetah Online (Embed)', file: 'https://www.crazygames.com/embed/cheetah-online-online', isExternal: true },
    { id: 'hyena-online-cg', title: 'Hyena Online (Embed)', file: 'https://www.crazygames.com/embed/hyena-online-online', isExternal: true },
    { id: 'fox-online-cg', title: 'Fox Online (Embed)', file: 'https://www.crazygames.com/embed/fox-online-online', isExternal: true },
    { id: 'rabbit-online-cg', title: 'Rabbit Online (Embed)', file: 'https://www.crazygames.com/embed/rabbit-online-online', isExternal: true },
    { id: 'squirrel-online-cg', title: 'Squirrel Online (Embed)', file: 'https://www.crazygames.com/embed/squirrel-online-online', isExternal: true },
    { id: 'bird-online-cg', title: 'Bird Online (Embed)', file: 'https://www.crazygames.com/embed/bird-online-online', isExternal: true },
    { id: 'fish-online-cg', title: 'Fish Online (Embed)', file: 'https://www.crazygames.com/embed/fish-online-online', isExternal: true },
    { id: 'shark-online-cg', title: 'Shark Online (Embed)', file: 'https://www.crazygames.com/embed/shark-online-online', isExternal: true },
    { id: 'whale-online-cg', title: 'Whale Online (Embed)', file: 'https://www.crazygames.com/embed/whale-online-online', isExternal: true },
    { id: 'dolphin-online-cg', title: 'Dolphin Online (Embed)', file: 'https://www.crazygames.com/embed/dolphin-online-online', isExternal: true },
    { id: 'turtle-online-cg', title: 'Turtle Online (Embed)', file: 'https://www.crazygames.com/embed/turtle-online-online', isExternal: true },
    { id: 'snake-online-cg', title: 'Snake Online (Embed)', file: 'https://www.crazygames.com/embed/snake-online-online', isExternal: true },
    { id: 'spider-online-cg', title: 'Spider Online (Embed)', file: 'https://www.crazygames.com/embed/spider-online-online', isExternal: true },
    { id: 'scorpion-online-cg', title: 'Scorpion Online (Embed)', file: 'https://www.crazygames.com/embed/scorpion-online-online', isExternal: true },
    { id: 'ant-online-cg', title: 'Ant Online (Embed)', file: 'https://www.crazygames.com/embed/ant-online-online', isExternal: true },
    { id: 'bee-online-cg', title: 'Bee Online (Embed)', file: 'https://www.crazygames.com/embed/bee-online-online', isExternal: true },
    { id: 'butterfly-online-cg', title: 'Butterfly Online (Embed)', file: 'https://www.crazygames.com/embed/butterfly-online-online', isExternal: true },
    { id: 'dragonfly-online-cg', title: 'Dragonfly Online (Embed)', file: 'https://www.crazygames.com/embed/dragonfly-online-online', isExternal: true },
    { id: 'ladybug-online-cg', title: 'Ladybug Online (Embed)', file: 'https://www.crazygames.com/embed/ladybug-online-online', isExternal: true },
    { id: 'grasshopper-online-cg', title: 'Grasshopper Online (Embed)', file: 'https://www.crazygames.com/embed/grasshopper-online-online', isExternal: true },
    { id: 'cricket-online-cg', title: 'Cricket Online (Embed)', file: 'https://www.crazygames.com/embed/cricket-online-online', isExternal: true },
    { id: 'beetle-online-cg', title: 'Beetle Online (Embed)', file: 'https://www.crazygames.com/embed/beetle-online-online', isExternal: true },
    { id: 'worm-online-cg', title: 'Worm Online (Embed)', file: 'https://www.crazygames.com/embed/worm-online-online', isExternal: true },
    { id: 'slug-online-cg', title: 'Slug Online (Embed)', file: 'https://www.crazygames.com/embed/slug-online-online', isExternal: true },
    { id: 'snail-online-cg', title: 'Snail Online (Embed)', file: 'https://www.crazygames.com/embed/snail-online-online', isExternal: true },
    { id: 'frog-online-cg', title: 'Frog Online (Embed)', file: 'https://www.crazygames.com/embed/frog-online-online', isExternal: true },
    { id: 'toad-online-cg', title: 'Toad Online (Embed)', file: 'https://www.crazygames.com/embed/toad-online-online', isExternal: true },
    { id: 'lizard-online-cg', title: 'Lizard Online (Embed)', file: 'https://www.crazygames.com/embed/lizard-online-online', isExternal: true },
    { id: 'gecko-online-cg', title: 'Gecko Online (Embed)', file: 'https://www.crazygames.com/embed/gecko-online-online', isExternal: true },
    { id: 'chameleon-online-cg', title: 'Chameleon Online (Embed)', file: 'https://www.crazygames.com/embed/chameleon-online-online', isExternal: true },
    { id: 'iguana-online-cg', title: 'Iguana Online (Embed)', file: 'https://www.crazygames.com/embed/iguana-online-online', isExternal: true },
    { id: 'crocodile-online-cg', title: 'Crocodile Online (Embed)', file: 'https://www.crazygames.com/embed/crocodile-online-online', isExternal: true },
    { id: 'alligator-online-cg', title: 'Alligator Online (Embed)', file: 'https://www.crazygames.com/embed/alligator-online-online', isExternal: true },
    { id: 'dinosaur-online-cg', title: 'Dinosaur Online (Embed)', file: 'https://www.crazygames.com/embed/dinosaur-online-online', isExternal: true },
    { id: 'dragon-online-cg-2', title: 'Dragon Online (Embed)', file: 'https://www.crazygames.com/embed/dragon-online-online', isExternal: true },
    { id: 'phoenix-online-cg', title: 'Phoenix Online (Embed)', file: 'https://www.crazygames.com/embed/phoenix-online-online', isExternal: true },
    { id: 'unicorn-online-cg', title: 'Unicorn Online (Embed)', file: 'https://www.crazygames.com/embed/unicorn-online-online', isExternal: true },
    { id: 'pegasus-online-cg', title: 'Pegasus Online (Embed)', file: 'https://www.crazygames.com/embed/pegasus-online-online', isExternal: true },
    { id: 'griffin-online-cg', title: 'Griffin Online (Embed)', file: 'https://www.crazygames.com/embed/griffin-online-online', isExternal: true },
    { id: 'mermaid-online-cg', title: 'Mermaid Online (Embed)', file: 'https://www.crazygames.com/embed/mermaid-online-online', isExternal: true },
    { id: 'fairy-online-cg', title: 'Fairy Online (Embed)', file: 'https://www.crazygames.com/embed/fairy-online-online', isExternal: true },
    { id: 'elf-online-cg', title: 'Elf Online (Embed)', file: 'https://www.crazygames.com/embed/elf-online-online', isExternal: true },
    { id: 'dwarf-online-cg', title: 'Dwarf Online (Embed)', file: 'https://www.crazygames.com/embed/dwarf-online-online', isExternal: true },
    { id: 'orc-online-cg', title: 'Orc Online (Embed)', file: 'https://www.crazygames.com/embed/orc-online-online', isExternal: true },
    { id: 'troll-online-cg', title: 'Troll Online (Embed)', file: 'https://www.crazygames.com/embed/troll-online-online', isExternal: true },
    { id: 'goblin-online-cg', title: 'Goblin Online (Embed)', file: 'https://www.crazygames.com/embed/goblin-online-online', isExternal: true },
    { id: 'skeleton-online-cg', title: 'Skeleton Online (Embed)', file: 'https://www.crazygames.com/embed/skeleton-online-online', isExternal: true },
    { id: 'zombie-online-cg', title: 'Zombie Online (Embed)', file: 'https://www.crazygames.com/embed/zombie-online-online', isExternal: true },
    { id: 'vampire-online-cg', title: 'Vampire Online (Embed)', file: 'https://www.crazygames.com/embed/vampire-online-online', isExternal: true },
    { id: 'werewolf-online-cg', title: 'Werewolf Online (Embed)', file: 'https://www.crazygames.com/embed/werewolf-online-online', isExternal: true },
    { id: 'ghost-online-cg', title: 'Ghost Online (Embed)', file: 'https://www.crazygames.com/embed/ghost-online-online', isExternal: true },
    { id: 'alien-online-cg', title: 'Alien Online (Embed)', file: 'https://www.crazygames.com/embed/alien-online-online', isExternal: true },
    { id: 'robot-online-cg', title: 'Robot Online (Embed)', file: 'https://www.crazygames.com/embed/robot-online-online', isExternal: true },
    { id: 'cyborg-online-cg', title: 'Cyborg Online (Embed)', file: 'https://www.crazygames.com/embed/cyborg-online-online', isExternal: true },
    { id: 'superhero-online-cg', title: 'Superhero Online (Embed)', file: 'https://www.crazygames.com/embed/superhero-online-online', isExternal: true },
    { id: 'supervillain-online-cg', title: 'Supervillain Online (Embed)', file: 'https://www.crazygames.com/embed/supervillain-online-online', isExternal: true },
    { id: 'ninja-online-cg', title: 'Ninja Online (Embed)', file: 'https://www.crazygames.com/embed/ninja-online-online', isExternal: true },
    { id: 'samurai-online-cg', title: 'Samurai Online (Embed)', file: 'https://www.crazygames.com/embed/samurai-online-online', isExternal: true },
    { id: 'knight-online-cg', title: 'Knight Online (Embed)', file: 'https://www.crazygames.com/embed/knight-online-online', isExternal: true },
    { id: 'pirate-online-cg', title: 'Pirate Online (Embed)', file: 'https://www.crazygames.com/embed/pirate-online-online', isExternal: true },
    { id: 'cowboy-online-cg', title: 'Cowboy Online (Embed)', file: 'https://www.crazygames.com/embed/cowboy-online-online', isExternal: true },
    { id: 'astronaut-online-cg', title: 'Astronaut Online (Embed)', file: 'https://www.crazygames.com/embed/astronaut-online-online', isExternal: true },
    { id: 'diver-online-cg', title: 'Diver Online (Embed)', file: 'https://www.crazygames.com/embed/diver-online-online', isExternal: true },
    { id: 'pilot-online-cg', title: 'Pilot Online (Embed)', file: 'https://www.crazygames.com/embed/pilot-online-online', isExternal: true },
    { id: 'driver-online-cg', title: 'Driver Online (Embed)', file: 'https://www.crazygames.com/embed/driver-online-online', isExternal: true },
    { id: 'soldier-online-cg', title: 'Soldier Online (Embed)', file: 'https://www.crazygames.com/embed/soldier-online-online', isExternal: true },
    { id: 'spy-online-cg', title: 'Spy Online (Embed)', file: 'https://www.crazygames.com/embed/spy-online-online', isExternal: true },
    { id: 'detective-online-cg', title: 'Detective Online (Embed)', file: 'https://www.crazygames.com/embed/detective-online-online', isExternal: true },
    { id: 'doctor-online-cg', title: 'Doctor Online (Embed)', file: 'https://www.crazygames.com/embed/doctor-online-online', isExternal: true },
    { id: 'nurse-online-cg', title: 'Nurse Online (Embed)', file: 'https://www.crazygames.com/embed/nurse-online-online', isExternal: true },
    { id: 'firefighter-online-cg', title: 'Firefighter Online (Embed)', file: 'https://www.crazygames.com/embed/firefighter-online-online', isExternal: true },
    { id: 'police-online-cg', title: 'Police Online (Embed)', file: 'https://www.crazygames.com/embed/police-online-online', isExternal: true },
    { id: 'teacher-online-cg', title: 'Teacher Online (Embed)', file: 'https://www.crazygames.com/embed/teacher-online-online', isExternal: true },
    { id: 'student-online-cg', title: 'Student Online (Embed)', file: 'https://www.crazygames.com/embed/student-online-online', isExternal: true },
    { id: 'chef-online-cg', title: 'Chef Online (Embed)', file: 'https://www.crazygames.com/embed/chef-online-online', isExternal: true },
    { id: 'waiter-online-cg', title: 'Waiter Online (Embed)', file: 'https://www.crazygames.com/embed/waiter-online-online', isExternal: true },
    { id: 'farmer-online-cg', title: 'Farmer Online (Embed)', file: 'https://www.crazygames.com/embed/farmer-online-online', isExternal: true },
    { id: 'builder-online-cg', title: 'Builder Online (Embed)', file: 'https://www.crazygames.com/embed/builder-online-online', isExternal: true },
    { id: 'artist-online-cg', title: 'Artist Online (Embed)', file: 'https://www.crazygames.com/embed/artist-online-online', isExternal: true },
    { id: 'musician-online-cg', title: 'Musician Online (Embed)', file: 'https://www.crazygames.com/embed/musician-online-online', isExternal: true },
    { id: 'dancer-online-cg', title: 'Dancer Online (Embed)', file: 'https://www.crazygames.com/embed/dancer-online-online', isExternal: true },
    { id: 'actor-online-cg', title: 'Actor Online (Embed)', file: 'https://www.crazygames.com/embed/actor-online-online', isExternal: true },
    { id: 'writer-online-cg', title: 'Writer Online (Embed)', file: 'https://www.crazygames.com/embed/writer-online-online', isExternal: true },
    { id: 'gamer-online-cg', title: 'Gamer Online (Embed)', file: 'https://www.crazygames.com/embed/gamer-online-online', isExternal: true },
    { id: 'streamer-online-cg', title: 'Streamer Online (Embed)', file: 'https://www.crazygames.com/embed/streamer-online-online', isExternal: true },
    { id: 'youtuber-online-cg', title: 'YouTuber Online (Embed)', file: 'https://www.crazygames.com/embed/youtuber-online-online', isExternal: true },
    { id: 'influencer-online-cg', title: 'Influencer Online (Embed)', file: 'https://www.crazygames.com/embed/influencer-online-online', isExternal: true },
    { id: 'billionaire-online-cg', title: 'Billionaire Online (Embed)', file: 'https://www.crazygames.com/embed/billionaire-online-online', isExternal: true },
    { id: 'president-online-cg', title: 'President Online (Embed)', file: 'https://www.crazygames.com/embed/president-online-online', isExternal: true },
    { id: 'king-online-cg-2', title: 'King Online (Embed)', file: 'https://www.crazygames.com/embed/king-online-online', isExternal: true },
    { id: 'queen-online-cg', title: 'Queen Online (Embed)', file: 'https://www.crazygames.com/embed/queen-online-online', isExternal: true },
    { id: 'prince-online-cg', title: 'Prince Online (Embed)', file: 'https://www.crazygames.com/embed/prince-online-online', isExternal: true },
    { id: 'princess-online-cg', title: 'Princess Online (Embed)', file: 'https://www.crazygames.com/embed/princess-online-online', isExternal: true },
    { id: 'god-online-cg', title: 'God Online (Embed)', file: 'https://www.crazygames.com/embed/god-online-online', isExternal: true },
    { id: 'goddess-online-cg', title: 'Goddess Online (Embed)', file: 'https://www.crazygames.com/embed/goddess-online-online', isExternal: true },
    { id: 'angel-online-cg', title: 'Angel Online (Embed)', file: 'https://www.crazygames.com/embed/angel-online-online', isExternal: true },
    { id: 'demon-online-cg-2', title: 'Demon Online (Embed)', file: 'https://www.crazygames.com/embed/demon-online-online', isExternal: true },
    { id: 'devil-online-cg', title: 'Devil Online (Embed)', file: 'https://www.crazygames.com/embed/devil-online-online', isExternal: true },
    { id: 'satan-online-cg', title: 'Satan Online (Embed)', file: 'https://www.crazygames.com/embed/satan-online-online', isExternal: true },
    { id: 'grim-reaper-online-cg', title: 'Grim Reaper Online (Embed)', file: 'https://www.crazygames.com/embed/grim-reaper-online-online', isExternal: true },
    { id: 'death-online-cg', title: 'Death Online (Embed)', file: 'https://www.crazygames.com/embed/death-online-online', isExternal: true },
    { id: 'life-online-cg', title: 'Life Online (Embed)', file: 'https://www.crazygames.com/embed/life-online-online', isExternal: true },
    { id: 'love-online-cg', title: 'Love Online (Embed)', file: 'https://www.crazygames.com/embed/love-online-online', isExternal: true },
    { id: 'hate-online-cg', title: 'Hate Online (Embed)', file: 'https://www.crazygames.com/embed/hate-online-online', isExternal: true },
    { id: 'war-online-cg', title: 'War Online (Embed)', file: 'https://www.crazygames.com/embed/war-online-online', isExternal: true },
    { id: 'peace-online-cg', title: 'Peace Online (Embed)', file: 'https://www.crazygames.com/embed/peace-online-online', isExternal: true },
    { id: 'chaos-online-cg', title: 'Chaos Online (Embed)', file: 'https://www.crazygames.com/embed/chaos-online-online', isExternal: true },
    { id: 'order-online-cg', title: 'Order Online (Embed)', file: 'https://www.crazygames.com/embed/order-online-online', isExternal: true },
    { id: 'light-online-cg', title: 'Light Online (Embed)', file: 'https://www.crazygames.com/embed/light-online-online', isExternal: true },
    { id: 'dark-online-cg', title: 'Dark Online (Embed)', file: 'https://www.crazygames.com/embed/dark-online-online', isExternal: true },
    { id: 'fire-online-cg', title: 'Fire Online (Embed)', file: 'https://www.crazygames.com/embed/fire-online-online', isExternal: true },
    { id: 'water-online-cg', title: 'Water Online (Embed)', file: 'https://www.crazygames.com/embed/water-online-online', isExternal: true },
    { id: 'earth-online-cg', title: 'Earth Online (Embed)', file: 'https://www.crazygames.com/embed/earth-online-online', isExternal: true },
    { id: 'air-online-cg', title: 'Air Online (Embed)', file: 'https://www.crazygames.com/embed/air-online-online', isExternal: true },
    { id: 'space-online-cg', title: 'Space Online (Embed)', file: 'https://www.crazygames.com/embed/space-online-online', isExternal: true },
    { id: 'time-online-cg', title: 'Time Online (Embed)', file: 'https://www.crazygames.com/embed/time-online-online', isExternal: true },
    { id: 'reality-online-cg', title: 'Reality Online (Embed)', file: 'https://www.crazygames.com/embed/reality-online-online', isExternal: true },
    { id: 'mind-online-cg', title: 'Mind Online (Embed)', file: 'https://www.crazygames.com/embed/mind-online-online', isExternal: true },
    { id: 'soul-online-cg', title: 'Soul Online (Embed)', file: 'https://www.crazygames.com/embed/soul-online-online', isExternal: true },
    { id: 'power-online-cg', title: 'Power Online (Embed)', file: 'https://www.crazygames.com/embed/power-online-online', isExternal: true },
    { id: 'infinity-online-cg', title: 'Infinity Online (Embed)', file: 'https://www.crazygames.com/embed/infinity-online-online', isExternal: true },
    { id: 'shell-shockers-cg', title: 'Shell Shockers (CG)', file: 'https://www.crazygames.com/embed/shell-shockers', isExternal: true },
    { id: 'krunker-io-cg', title: 'Krunker.io', file: 'https://krunker.io', isExternal: true },
    { id: 'venge-io-cg', title: 'Venge.io', file: 'https://venge.io', isExternal: true },
    { id: 'ev-io-cg', title: 'Ev.io', file: 'https://ev.io', isExternal: true },
    { id: 'bullet-force-cg', title: 'Bullet Force (CG)', file: 'https://www.crazygames.com/embed/bullet-force', isExternal: true },
    { id: 'forward-assault-cg', title: 'Forward Assault', file: 'https://www.crazygames.com/embed/forward-assault', isExternal: true },
    { id: 'masked-forces-cg', title: 'Masked Forces', file: 'https://www.crazygames.com/embed/masked-forces', isExternal: true },
    { id: 'combat-online-cg', title: 'Combat Online', file: 'https://www.crazygames.com/embed/combat-online', isExternal: true },
    { id: 'war-brokers-cg', title: 'War Brokers', file: 'https://www.crazygames.com/embed/war-brokers', isExternal: true },
    { id: 'pixel-warfare-cg', title: 'Pixel Warfare', file: 'https://www.crazygames.com/embed/pixel-warfare', isExternal: true },
    { id: 'block-post-cg', title: 'Block Post', file: 'https://www.crazygames.com/embed/block-post', isExternal: true },
    { id: 'war-of-tanks-cg', title: 'War of Tanks', file: 'https://www.crazygames.com/embed/war-of-tanks', isExternal: true },
    { id: 'tank-off-cg', title: 'Tank Off', file: 'https://www.crazygames.com/embed/tank-off', isExternal: true },
    { id: 'world-of-tanks-cg', title: 'World of Tanks (Embed)', file: 'https://www.crazygames.com/embed/world-of-tanks', isExternal: true },
    { id: 'war-thunder-cg', title: 'War Thunder (Embed)', file: 'https://www.crazygames.com/embed/war-thunder', isExternal: true },
    { id: 'crossout-cg', title: 'Crossout (Embed)', file: 'https://www.crazygames.com/embed/crossout', isExternal: true },
    { id: 'star-conflict-cg', title: 'Star Conflict (Embed)', file: 'https://www.crazygames.com/embed/star-conflict', isExternal: true },
    { id: 'enlisted-cg', title: 'Enlisted (Embed)', file: 'https://www.crazygames.com/embed/enlisted', isExternal: true },
    { id: 'cuisine-royale-cg', title: 'Cuisine Royale (Embed)', file: 'https://www.crazygames.com/embed/cuisine-royale', isExternal: true },
    { id: 'super-mechs-cg', title: 'Super Mechs', file: 'https://www.crazygames.com/embed/super-mechs', isExternal: true },
    { id: 'mech-arena-cg', title: 'Mech Arena (Embed)', file: 'https://www.crazygames.com/embed/mech-arena', isExternal: true },
    { id: 'war-robots-cg', title: 'War Robots (Embed)', file: 'https://www.crazygames.com/embed/war-robots', isExternal: true },
    { id: 'walking-war-robots-cg', title: 'Walking War Robots (Embed)', file: 'https://www.crazygames.com/embed/walking-war-robots', isExternal: true },
    { id: 'robot-warfare-cg', title: 'Robot Warfare (Embed)', file: 'https://www.crazygames.com/embed/robot-warfare', isExternal: true },
    { id: 'transformers-cg', title: 'Transformers (Embed)', file: 'https://www.crazygames.com/embed/transformers', isExternal: true },
    { id: 'power-rangers-cg', title: 'Power Rangers (Embed)', file: 'https://www.crazygames.com/embed/power-rangers', isExternal: true },
    { id: 'ben-10-cg', title: 'Ben 10 (Embed)', file: 'https://www.crazygames.com/embed/ben-10', isExternal: true },
    { id: 'adventure-time-cg', title: 'Adventure Time (Embed)', file: 'https://www.crazygames.com/embed/adventure-time', isExternal: true },
    { id: 'regular-show-cg', title: 'Regular Show (Embed)', file: 'https://www.crazygames.com/embed/regular-show', isExternal: true },
    { id: 'gumball-cg', title: 'Gumball (Embed)', file: 'https://www.crazygames.com/embed/gumball', isExternal: true },
    { id: 'steven-universe-cg', title: 'Steven Universe (Embed)', file: 'https://www.crazygames.com/embed/steven-universe', isExternal: true },
    { id: 'teen-titans-go-cg', title: 'Teen Titans Go! (Embed)', file: 'https://www.crazygames.com/embed/teen-titans-go', isExternal: true },
    { id: 'dc-super-hero-girls-cg', title: 'DC Super Hero Girls (Embed)', file: 'https://www.crazygames.com/embed/dc-super-hero-girls', isExternal: true },
    { id: 'justice-league-cg', title: 'Justice League (Embed)', file: 'https://www.crazygames.com/embed/justice-league', isExternal: true },
    { id: 'avengers-cg', title: 'Avengers (Embed)', file: 'https://www.crazygames.com/embed/avengers', isExternal: true },
    { id: 'spider-man-cg-2', title: 'Spider-Man (Embed)', file: 'https://www.crazygames.com/embed/spider-man', isExternal: true },
    { id: 'iron-man-cg', title: 'Iron Man (Embed)', file: 'https://www.crazygames.com/embed/iron-man', isExternal: true },
    { id: 'captain-america-cg', title: 'Captain America (Embed)', file: 'https://www.crazygames.com/embed/captain-america', isExternal: true },
    { id: 'thor-cg', title: 'Thor (Embed)', file: 'https://www.crazygames.com/embed/thor', isExternal: true },
    { id: 'hulk-cg', title: 'Hulk (Embed)', file: 'https://www.crazygames.com/embed/hulk', isExternal: true },
    { id: 'black-panther-cg', title: 'Black Panther (Embed)', file: 'https://www.crazygames.com/embed/black-panther', isExternal: true },
    { id: 'doctor-strange-cg', title: 'Doctor Strange (Embed)', file: 'https://www.crazygames.com/embed/doctor-strange', isExternal: true },
    { id: 'guardians-of-the-galaxy-cg', title: 'Guardians of the Galaxy (Embed)', file: 'https://www.crazygames.com/embed/guardians-of-the-galaxy', isExternal: true },
    { id: 'x-men-cg', title: 'X-Men (Embed)', file: 'https://www.crazygames.com/embed/x-men', isExternal: true },
    { id: 'fantastic-four-cg', title: 'Fantastic Four (Embed)', file: 'https://www.crazygames.com/embed/fantastic-four', isExternal: true },
    { id: 'deadpool-cg', title: 'Deadpool (Embed)', file: 'https://www.crazygames.com/embed/deadpool', isExternal: true },
    { id: 'wolverine-cg', title: 'Wolverine (Embed)', file: 'https://www.crazygames.com/embed/wolverine', isExternal: true },
    { id: 'venom-cg', title: 'Venom (Embed)', file: 'https://www.crazygames.com/embed/venom', isExternal: true },
    { id: 'carnage-cg', title: 'Carnage (Embed)', file: 'https://www.crazygames.com/embed/carnage', isExternal: true },
    { id: 'thanos-cg', title: 'Thanos (Embed)', file: 'https://www.crazygames.com/embed/thanos', isExternal: true },
    { id: 'joker-cg', title: 'Joker (Embed)', file: 'https://www.crazygames.com/embed/joker', isExternal: true },
    { id: 'harley-quinn-cg', title: 'Harley Quinn (Embed)', file: 'https://www.crazygames.com/embed/harley-quinn', isExternal: true },
    { id: 'catwoman-cg', title: 'Catwoman (Embed)', file: 'https://www.crazygames.com/embed/catwoman', isExternal: true },
    { id: 'wonder-woman-cg', title: 'Wonder Woman (Embed)', file: 'https://www.crazygames.com/embed/wonder-woman', isExternal: true },
    { id: 'superman-cg', title: 'Superman (Embed)', file: 'https://www.crazygames.com/embed/superman', isExternal: true },
    { id: 'batman-cg', title: 'Batman (Embed)', file: 'https://www.crazygames.com/embed/batman', isExternal: true },
    { id: 'flash-cg', title: 'The Flash (Embed)', file: 'https://www.crazygames.com/embed/the-flash', isExternal: true },
    { id: 'aquaman-cg', title: 'Aquaman (Embed)', file: 'https://www.crazygames.com/embed/aquaman', isExternal: true },
    { id: 'green-lantern-cg', title: 'Green Lantern (Embed)', file: 'https://www.crazygames.com/embed/green-lantern', isExternal: true },
    { id: 'cyborg-cg', title: 'Cyborg (Embed)', file: 'https://www.crazygames.com/embed/cyborg', isExternal: true },
    { id: 'shazam-cg', title: 'Shazam (Embed)', file: 'https://www.crazygames.com/embed/shazam', isExternal: true },
    { id: 'black-adam-cg', title: 'Black Adam (Embed)', file: 'https://www.crazygames.com/embed/black-adam', isExternal: true },
    { id: 'suicide-squad-cg', title: 'Suicide Squad (Embed)', file: 'https://www.crazygames.com/embed/suicide-squad', isExternal: true },
    { id: 'birds-of-prey-cg', title: 'Birds of Prey (Embed)', file: 'https://www.crazygames.com/embed/birds-of-prey', isExternal: true },
    { id: 'watchmen-cg', title: 'Watchmen (Embed)', file: 'https://www.crazygames.com/embed/watchmen', isExternal: true },
    { id: 'v-for-vendetta-cg', title: 'V for Vendetta (Embed)', file: 'https://www.crazygames.com/embed/v-for-vendetta', isExternal: true },
    { id: 'sandman-cg', title: 'The Sandman (Embed)', file: 'https://www.crazygames.com/embed/the-sandman', isExternal: true },
    { id: 'lucifer-cg', title: 'Lucifer (Embed)', file: 'https://www.crazygames.com/embed/lucifer', isExternal: true },
    { id: 'preacher-cg', title: 'Preacher (Embed)', file: 'https://www.crazygames.com/embed/preacher', isExternal: true },
    { id: 'the-boys-cg', title: 'The Boys (Embed)', file: 'https://www.crazygames.com/embed/the-boys', isExternal: true },
    { id: 'invincible-cg', title: 'Invincible (Embed)', file: 'https://www.crazygames.com/embed/invincible', isExternal: true },
    { id: 'spawn-cg', title: 'Spawn (Embed)', file: 'https://www.crazygames.com/embed/spawn', isExternal: true },
    { id: 'hellboy-cg', title: 'Hellboy (Embed)', file: 'https://www.crazygames.com/embed/hellboy', isExternal: true },
    { id: 'tmnt-cg', title: 'TMNT (Embed)', file: 'https://www.crazygames.com/embed/tmnt', isExternal: true },
    { id: 'power-puff-girls-cg', title: 'Powerpuff Girls (Embed)', file: 'https://www.crazygames.com/embed/powerpuff-girls', isExternal: true },
    { id: 'dexters-laboratory-cg', title: 'Dexter\'s Laboratory (Embed)', file: 'https://www.crazygames.com/embed/dexters-laboratory', isExternal: true },
    { id: 'johnny-bravo-cg', title: 'Johnny Bravo (Embed)', file: 'https://www.crazygames.com/embed/johnny-bravo', isExternal: true },
    { id: 'cow-and-chicken-cg', title: 'Cow and Chicken (Embed)', file: 'https://www.crazygames.com/embed/cow-and-chicken', isExternal: true },
    { id: 'courage-the-cowardly-dog-cg', title: 'Courage the Cowardly Dog (Embed)', file: 'https://www.crazygames.com/embed/courage-the-cowardly-dog', isExternal: true },
    { id: 'ed-edd-n-eddy-cg', title: 'Ed, Edd n Eddy (Embed)', file: 'https://www.crazygames.com/embed/ed-edd-n-eddy', isExternal: true },
    { id: 'samurai-jack-cg', title: 'Samurai Jack (Embed)', file: 'https://www.crazygames.com/embed/samurai-jack', isExternal: true },
    { id: 'the-grim-adventures-of-billy-and-mandy-cg', title: 'Billy and Mandy (Embed)', file: 'https://www.crazygames.com/embed/the-grim-adventures-of-billy-and-mandy', isExternal: true },
    { id: 'codname-kids-next-door-cg', title: 'KND (Embed)', file: 'https://www.crazygames.com/embed/codename-kids-next-door', isExternal: true },
    { id: 'fosters-home-for-imaginary-friends-cg', title: 'Foster\'s Home (Embed)', file: 'https://www.crazygames.com/embed/fosters-home-for-imaginary-friends', isExternal: true },
    { id: 'camp-lazlo-cg', title: 'Camp Lazlo (Embed)', file: 'https://www.crazygames.com/embed/camp-lazlo', isExternal: true },
    { id: 'my-gym-partners-a-monkey-cg', title: 'My Gym Partner\'s a Monkey (Embed)', file: 'https://www.crazygames.com/embed/my-gym-partners-a-monkey', isExternal: true },
    { id: 'chowder-cg', title: 'Chowder (Embed)', file: 'https://www.crazygames.com/embed/chowder', isExternal: true },
    { id: 'the-marvelous-misadventures-of-flapjack-cg', title: 'Flapjack (Embed)', file: 'https://www.crazygames.com/embed/the-marvelous-misadventures-of-flapjack', isExternal: true },
  ];

  const [games] = useState(UGS_GAMES);

  const launchUGSGame = async (game) => {
    if (game.isExternal) {
      const proxiedUrl = getProxiedUrl(game.file);
      // For YouTube Playables or specific ports, we might want to use the internal frame
      if (game.file.includes('youtube.com') || game.file.includes('githack.com')) {
        setSelectedGame(game);
        return;
      }
      const win = window.open(proxiedUrl, '_blank');
      if (!win) {
        alert('Popup blocked! Please allow popups to launch games.');
      }
      return;
    }

    const filename = game.file.endsWith('.html') ? game.file : `${game.file}.html`;
    const cdnUrl = `https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/${encodeURIComponent(filename)}`;
    const rawUrl = `https://raw.githubusercontent.com/bubbls/ugs-singlefile/master/UGS-Files/${encodeURIComponent(filename)}`;
    
    try {
      let response = await fetch(cdnUrl);
      let html = await response.text();

      // Fallback for large files (jsDelivr 50MB limit)
      if (html.includes("Package size exceeded") || !response.ok) {
        console.log("File too large for CDN, falling back to GitHub Raw Proxy...");
        const proxyResponse = await fetch(`/api/v1/github-raw?url=${encodeURIComponent(rawUrl)}`);
        if (proxyResponse.ok) {
          html = await proxyResponse.text();
        } else {
          throw new Error("Failed to fetch from GitHub Raw Proxy");
        }
      }

      // Inject base tag for relative assets if needed
      if (game.file.startsWith('http')) {
        const baseUrl = game.file.substring(0, game.file.lastIndexOf('/') + 1);
        html = html.replace('<head>', `<head><base href="${baseUrl}">`);
      }

      const win = window.open('about:blank', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
        win.document.title = game.title;
      } else {
        alert('Popup blocked! Please allow popups to launch games.');
      }
    } catch (err) {
      console.error('Failed to launch game:', err);
      alert('Failed to load game. It might be too large or blocked.');
    }
  };

  const [selectedGame, setSelectedGame] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTabCloaked, setIsTabCloaked] = useState(false);
  const [isStaticHost, setIsStaticHost] = useState(false);

  useEffect(() => {
    const isStatic = window.location.hostname.includes('netlify.app') || 
                     window.location.hostname.includes('github.io') ||
                     window.location.hostname.includes('vercel.app');
    setIsStaticHost(isStatic);
  }, []);

  // Tab Cloaking Logic
  const cloakTab = (type) => {
    const titles = {
      'none': { title: 'Antigravity', icon: LOGO_URL },
      'classroom': { title: 'Google Classroom', icon: 'https://ssl.gstatic.com/classroom/favicon.png' },
      'drive': { title: 'My Drive - Google Drive', icon: 'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png' },
      'gmail': { title: 'Gmail', icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/images/2/favicon.png' },
    };

    const config = titles[type] || titles['none'];
    
    document.title = config.title;
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = config.icon;

    if (type !== 'none') {
      const win = window.open('about:blank', '_blank');
      if (win) {
        const doc = win.document;
        doc.title = config.title;
        const icon = doc.createElement('link');
        icon.rel = 'icon';
        icon.href = config.icon;
        doc.head.appendChild(icon);
        
        const iframe = doc.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.position = 'fixed';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.src = window.location.href;
        doc.body.appendChild(iframe);
        doc.body.style.margin = '0';
        doc.body.style.padding = '0';
        doc.body.style.overflow = 'hidden';
      }
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed) {
          setUser(parsed);
          if (parsed.settings) setSettings(parsed.settings);
          if (parsed.progress) setProgress(parsed.progress);
        }
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (data.success) {
        if (authMode === 'login') {
          setUser(data.user);
          if (data.user.settings) setSettings(data.user.settings);
          if (data.user.progress) setProgress(data.user.progress);
          localStorage.setItem('user', JSON.stringify(data.user));
        } else {
          setAuthMode('login');
          alert('Account created! Please login.');
        }
        setShowAuth(false);
      } else {
        alert(data.error || 'Authentication failed');
      }
    } catch (e) {
      console.error('Auth error:', e);
      alert('Connection error');
    }
  };

  const saveUserData = async () => {
    if (!user) return;
    try {
      await fetch('/api/user/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, settings, progress })
      });
      localStorage.setItem('user', JSON.stringify({ ...user, settings, progress }));
      alert('Data saved successfully!');
    } catch (e) {
      alert('Failed to sync with server');
    }
  };

  // Proxy State
  const [proxyUrl, setProxyUrl] = useState('');
  const [currentProxyUrl, setCurrentProxyUrl] = useState('');
  const [proxyInput, setProxyInput] = useState('');

  // AI State
  const [chatMessages, setChatMessages] = useState([
    { role: 'model', text: "Welcome! I am the Gassy AI Assistant, powered by Gemini. You can ask me anything, solve homework problems, or upload images for analysis." }
  ]);
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
      const apiKey = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API_KEY_MISSING');
      }
      const ai = new GoogleGenAI({ apiKey });
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
      let errorMsg = "A connection error has occurred. Please verify your network status.";
      if (err.message === 'API_KEY_MISSING') {
        errorMsg = "The AI service is currently unavailable. Please check your settings.";
      }
      setChatMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
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

            <div className="flex items-center gap-4">
              <nav className="hidden md:flex items-center gap-1 bg-slate-900/50 p-1 rounded-2xl border border-white/5">
                {[
                  { id: 'games', label: 'Games', icon: Gamepad2 },
                  { id: 'proxy', label: 'Proxy', icon: Globe },
                  { id: 'ai', label: 'AI', icon: Cpu },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSelectedGame(null);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                      activeTab === tab.id 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : 'text-slate-400 hover:text-emerald-400'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div className="h-8 w-[1px] bg-white/10 mx-2" />

              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Account</span>
                    <span className="text-sm font-bold text-emerald-400">{user.username}</span>
                  </div>
                  <button 
                    onClick={() => { setUser(null); localStorage.removeItem('user'); }}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                    title="Logout"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setAuthMode('login'); setShowAuth(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all font-bold text-xs uppercase tracking-widest"
                >
                  <User size={18} />
                  <span>Login</span>
                </button>
              )}
            </div>
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
                  className={`flex-1 overflow-hidden bg-black relative flex flex-col ${isFullscreen ? '' : 'rounded-3xl border border-emerald-500/20 shadow-2xl'}`}
                >
                  {selectedGame.id === 'proxy-session' && (
                    <div className="bg-slate-900/90 backdrop-blur-md border-b border-white/10 p-2 flex gap-2 items-center">
                      <div className="flex-1 relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input 
                          type="text"
                          value={proxyInput}
                          onChange={(e) => setProxyInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              let url = proxyInput;
                              if (!url.startsWith('http')) url = 'https://' + url;
                              setCurrentProxyUrl(url);
                            }
                          }}
                          className="w-full bg-slate-800/50 border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all"
                          placeholder="Enter URL..."
                        />
                      </div>
                      <button 
                        onClick={() => {
                          let url = proxyInput;
                          if (!url.startsWith('http')) url = 'https://' + url;
                          setCurrentProxyUrl(url);
                        }}
                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all"
                      >
                        Go
                      </button>
                    </div>
                  )}
                  {selectedGame.id === 'proxy-session' ? (
                    currentProxyUrl ? (
                      <iframe 
                        src={getProxiedUrl(currentProxyUrl)}
                        className="w-full flex-1 border-none"
                        title="Ultra Session"
                        allowFullScreen
                        allow="autoplay; fullscreen; camera; focus-without-user-activation *; monetization; gamepad; keyboard-map *; xr-spatial-tracking; clipboard-write"
                        sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin allow-downloads"
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-slate-500">
                        <p>Enter a URL above to start browsing.</p>
                      </div>
                    )
                  ) : (
                    <iframe 
                      src={selectedGame.isExternal ? getProxiedUrl(selectedGame.file) : `https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/${encodeURIComponent(selectedGame.file.endsWith('.html') ? selectedGame.file : `${selectedGame.file}.html`)}`}
                      className="w-full flex-1 border-none"
                      title={selectedGame.title}
                      allowFullScreen
                      allow="autoplay; fullscreen; camera; focus-without-user-activation *; monetization; gamepad; keyboard-map *; xr-spatial-tracking; clipboard-write"
                      sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin allow-downloads"
                    />
                  )}
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">GAME LIBRARY</h1>
                    <p className="text-slate-400 font-medium">Over 1000+ games extracted and ready to play.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                      <input 
                        type="text"
                        placeholder="Search games..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-slate-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-6 outline-none focus:border-emerald-500/50 transition-all w-full sm:w-64 text-sm"
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="CrazyGames Slug..."
                        value={cgSlug}
                        onChange={(e) => setCgSlug(e.target.value)}
                        className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl py-3 px-4 outline-none focus:border-emerald-500/50 transition-all w-full sm:w-48 text-sm placeholder:text-emerald-500/30"
                      />
                      <button 
                        onClick={() => extractCGGame(cgSlug)}
                        className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap"
                      >
                        Extract Any Game
                      </button>
                    </div>
                  </div>
                </div>

                {!searchTerm && (
                  <>
                    <div className="space-y-6 mb-12">
                      <div className="flex items-center gap-3 text-emerald-400">
                        <Palette size={20} />
                        <h2 className="font-bold uppercase tracking-widest text-sm">Featured Games</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {games.filter(g => g.featured).map(game => (
                          <div 
                            key={game.id} 
                            onClick={() => launchUGSGame(game)}
                            className="group relative h-48 rounded-3xl overflow-hidden border border-white/5 cursor-pointer hover:border-emerald-500/50 transition-all"
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10" />
                            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all" />
                            <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                              <h3 className="font-bold text-sm text-white mb-1">{game.title}</h3>
                              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Play Now</p>
                            </div>
                            <div className="absolute top-4 right-4 z-20">
                              <div className="p-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 text-emerald-400">
                                <Gamepad2 size={14} />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6 mb-12">
                      <div className="flex items-center gap-3 text-emerald-400">
                        <Gamepad2 size={20} />
                        <h2 className="font-bold uppercase tracking-widest text-sm">Trending Now</h2>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {games.slice(10, 25).map(game => (
                          <div 
                            key={game.id} 
                            onClick={() => launchUGSGame(game)}
                            className="flex-shrink-0 w-64 glass-card p-6 cursor-pointer hover:border-emerald-500/40 transition-all group"
                          >
                             <h3 className="font-bold truncate mb-2 text-white">{game.title}</h3>
                             <div className="flex items-center justify-between">
                               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Action</span>
                               <ExternalLink size={14} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && searchTerm ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center text-slate-500">
                      <Gamepad2 size={40} />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-slate-400 mb-4">No games found matching "{searchTerm}"</p>
                      <button 
                        onClick={() => extractCGGame(searchTerm)}
                        className="px-8 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                      >
                        Extract "{searchTerm}" from CrazyGames
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {games
                      .filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(game => (
                      <div key={game.id} className="group relative glass-card p-6 flex flex-col justify-between h-40 hover:border-emerald-500/40 transition-all">
                        <div className="flex justify-between items-start">
                          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                            <Gamepad2 size={24} />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg mb-1 truncate">{game.title}</h3>
                          <button 
                            onClick={() => launchUGSGame(game)}
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
          <div className="flex-1 flex flex-col">
            {isStaticHost && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl mb-6 flex items-center gap-3 text-amber-500">
                <Lock size={20} />
                <p className="text-sm font-medium">
                  Proxy features are limited on static hosts like Netlify. For the full experience, please use the official deployment.
                </p>
              </div>
            )}
            {selectedGame && selectedGame.id === 'proxy-session' ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col space-y-4"
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => {
                      setSelectedGame(null);
                      setCurrentProxyUrl('');
                    }}
                    className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-all font-medium"
                  >
                    <ArrowLeft size={18} /> New Session
                  </button>
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold tracking-tight">Ultra Browser</h2>
                    <button 
                      onClick={toggleFullscreen}
                      className="p-2 bg-slate-900/50 border border-white/10 rounded-xl text-slate-400 hover:text-emerald-400 transition-all"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                </div>
                <div 
                  id="game-frame-container"
                  className={`flex-1 overflow-hidden bg-black relative flex flex-col ${isFullscreen ? '' : 'rounded-3xl border border-emerald-500/20 shadow-2xl'}`}
                >
                  <div className="bg-slate-900/90 backdrop-blur-md border-b border-white/10 p-2 flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                      <input 
                        type="text"
                        value={proxyInput}
                        onChange={(e) => setProxyInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            let url = proxyInput;
                            if (!url.startsWith('http')) url = 'https://' + url;
                            setCurrentProxyUrl(url);
                          }
                        }}
                        className="w-full bg-slate-800/50 border border-white/5 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white outline-none focus:border-emerald-500/50 transition-all"
                        placeholder="Enter URL..."
                      />
                    </div>
                    <button 
                      onClick={() => {
                        let url = proxyInput;
                        if (!url.startsWith('http')) url = 'https://' + url;
                        setCurrentProxyUrl(url);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-400 transition-all"
                    >
                      Go
                    </button>
                  </div>
                  {currentProxyUrl ? (
                    <iframe 
                      src={getProxiedUrl(currentProxyUrl)}
                      className="w-full flex-1 border-none"
                      title="Ultra Session"
                      allowFullScreen
                      allow="autoplay; fullscreen; camera; focus-without-user-activation *; monetization; gamepad; keyboard-map *; xr-spatial-tracking; clipboard-write"
                      sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin allow-downloads"
                    />
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                      <p>Enter a URL above to start browsing.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto w-full space-y-12 py-12"
              >
                <div className="text-center space-y-4">
                  <h2 className="text-5xl font-bold tracking-tight">Ultra Browser</h2>
                  <p className="text-slate-400 max-w-xl mx-auto leading-relaxed">
                    Fast, secure, and unblocked web browser. Enter a URL to browse anonymously.
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
                        setCurrentProxyUrl(finalUrl);
                        setProxyInput(finalUrl);
                        setSelectedGame({
                          id: 'proxy-session',
                          title: 'Ultra Session',
                          url: finalUrl,
                        });
                      }
                    }}
                    className="glow-button text-white px-10 rounded-2xl font-bold text-lg"
                  >
                    Launch
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

                {/* School Hacks tab removed */}

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
                      {msg.text && <Markdown>{msg.text}</Markdown>}
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
                    <MessageSquare size={20} />
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
        {activeTab === 'settings' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 max-w-4xl mx-auto w-full space-y-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Settings</h2>
                <p className="text-slate-400">Customize your experience and manage your account.</p>
              </div>
              {user && (
                <button 
                  onClick={saveUserData}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all"
                >
                  <Save size={18} />
                  Save Changes
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-8 space-y-6">
                <div className="flex items-center gap-3 text-emerald-400 mb-2">
                  <Palette size={20} />
                  <h3 className="font-bold uppercase tracking-widest text-sm">Appearance</h3>
                </div>
                
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Theme</span>
                    <select 
                      value={settings.theme}
                      onChange={(e) => setSettings({...settings, theme: e.target.value})}
                      className="w-full bg-slate-900/50 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-emerald-500 transition-all"
                    >
                      <option value="dark">Dark (Default)</option>
                      <option value="midnight">Midnight Blue</option>
                      <option value="forest">Forest Green</option>
                      <option value="void">Deep Void</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Accent Color</span>
                    <div className="flex gap-2">
                      {['#10b981', '#3b82f6', '#8b5cf6', '#f43f5e', '#f59e0b'].map(color => (
                        <button 
                          key={color}
                          onClick={() => setSettings({...settings, accentColor: color})}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${settings.accentColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </label>
                </div>
              </div>

              <div className="glass-card p-8 space-y-6">
                <div className="flex items-center gap-3 text-emerald-400 mb-2">
                  <Ghost size={20} />
                  <h3 className="font-bold uppercase tracking-widest text-sm">Privacy & Cloaking</h3>
                </div>
                
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Select a cloak to disguise your tab. "About:Blank" opens the site in a new invisible window.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'classroom', label: 'Classroom' },
                      { id: 'drive', label: 'Drive' },
                      { id: 'gmail', label: 'Gmail' },
                    ].map(type => (
                      <button 
                        key={type.id}
                        onClick={() => {
                          setSettings({...settings, cloak: type.id});
                          cloakTab(type.id);
                        }}
                        className={`p-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${
                          settings.cloak === type.id 
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' 
                            : 'bg-slate-900/50 border-white/10 text-slate-500 hover:border-white/20'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuth(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card p-10 bg-[#020617]/90 border-emerald-500/20 shadow-2xl"
            >
              <button 
                onClick={() => setShowAuth(false)}
                className="absolute top-6 right-6 text-slate-500 hover:text-white transition-all"
              >
                <X size={24} />
              </button>

              <h2 className="text-3xl font-bold tracking-tight text-white mb-2 text-center">
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-slate-400 text-center mb-8">
                {authMode === 'login' ? 'Login to sync your progress' : 'Join us to save your game data'}
              </p>

              <form onSubmit={handleAuth} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                  <input 
                    type="text"
                    required
                    value={authForm.username}
                    onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                    className="w-full bg-slate-900/50 border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all text-white"
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                  <input 
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    className="w-full bg-slate-900/50 border border-white/10 p-4 rounded-2xl focus:border-emerald-500 outline-none transition-all text-white"
                    placeholder="Enter password"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all uppercase tracking-widest mt-4"
                >
                  {authMode === 'login' ? 'Login' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-8 text-center">
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-slate-400 hover:text-emerald-400 transition-all"
                >
                  {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
