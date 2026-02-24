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
  Minimize2
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

  const getProxiedUrl = (url) => {
    if (!url) return '';
    
    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    // If we are on a static host like Netlify or GitHub Pages, the proxy won't work.
    const isStaticHost = window.location.hostname.includes('netlify.app') || 
                         window.location.hostname.includes('github.io');
    
    if (isStaticHost) {
      return targetUrl; // Try direct load as a fallback
    }

    return `/api/v1/browse?url=${encodeURIComponent(targetUrl)}`;
  };
  
  // UGS Games List (Comprehensive list from the provided source)
  const UGS_GAMES = [
    { id: '1v1lol', title: '1v1.LOL', file: 'cl1v1lol' },
    { id: 'bitlife', title: 'BitLife', file: 'clbitlife' },
    { id: 'retro-bowl', title: 'Retro Bowl', file: 'clretrobowl' },
    { id: 'retro-bowl-college', title: 'Retro Bowl College', file: 'clretrobowlcollege' },
    { id: 'slope', title: 'Slope', file: 'clslope' },
    { id: 'subway-surfers', title: 'Subway Surfers', file: 'clsubwaysurfers' },
    { id: 'basket-bros', title: 'Basket Bros', file: 'clbasketbros' },
    { id: 'baseball-bros', title: 'Baseball Bros', file: 'clbaseballbros' },
    { id: 'soccer-bros', title: 'Soccer Bros', file: 'clsoccerbros' },
    { id: 'shell-shockers', title: 'Shell Shockers', file: 'clshellshock' },
    { id: 'drive-mad', title: 'Drive Mad', file: 'cldrivemad' },
    { id: 'cookie-cliker', title: 'Cookie Clicker', file: 'clcookie-clicker' },
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
    { id: 'minecraft', title: 'Minecraft 1.8.8', file: 'clminecraft1-8-8' },
    { id: 'eaglercraft', title: 'Eaglercraft X', file: 'clEaglercraftX 1.8.8(u29)' },
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
    { id: 'moto-x3m', title: 'Moto X3M', file: 'clmotox3m' },
    { id: 'moto-x3m-winter', title: 'Moto X3M Winter', file: 'clmotox3mwinter' },
    { id: 'moto-x3m-pool-party', title: 'Moto X3M Pool Party', file: 'clmotox3mpoolparty' },
    { id: 'moto-x3m-spooky', title: 'Moto X3M Spooky', file: 'clmotox3mspookyland' },
    { id: 'drift-boss', title: 'Drift Boss', file: 'cldriftboss' },
    { id: 'smash-karts', title: 'Smash Karts', file: 'clsmashkarts' },
    { id: 'just-fall-lol', title: 'Just Fall LOL', file: 'cljustfalllol' },
    { id: 'among-us', title: 'Among Us', file: 'clamongus' },
    { id: 'fnf', title: 'Friday Night Funkin', file: 'clfridaynightfunkin' },
    { id: 'doom', title: 'DOOM', file: 'cldoom' },
    { id: 'doom-2', title: 'DOOM 2', file: 'cldoom2' },
    { id: 'quake', title: 'Quake', file: 'clquake' },
    { id: 'tetris', title: 'Tetris', file: 'cltetris' },
    { id: '2048', title: '2048', file: 'cl2048' },
    { id: 'flappy-bird', title: 'Flappy Bird', file: 'clflappybird' },
    { id: 'pacman', title: 'Pacman', file: 'clpacman' },
    { id: 'super-mario-64', title: 'Super Mario 64', file: 'clsupermario64' },
    { id: 'super-mario-bros', title: 'Super Mario Bros', file: 'clsupermariobros' },
    { id: 'the-legend-of-zelda', title: 'The Legend of Zelda', file: 'cllozt' },
    { id: 'pokemon-emerald', title: 'Pokemon Emerald', file: 'clpokemonemerald' },
    { id: 'pokemon-fire-red', title: 'Pokemon Fire Red', file: 'clpokemonfirered' },
    { id: 'sonic-the-hedgehog', title: 'Sonic The Hedgehog', file: 'clsonicth' },
    { id: 'gta-advance', title: 'GTA Advance', file: 'clgrantheftautoadvance' },
    { id: 'madden-99', title: 'Madden 99', file: 'clmadden99' },
    { id: 'fifa-07', title: 'FIFA 07', file: 'clFIFA07' },
    { id: '10bullets', title: '10 Bullets', file: 'cl10bullets' },
    { id: '10minutestilldawn', title: '10 Minutes Till Dawn', file: 'cl10minutestilldawn' },
    { id: '12minibattles', title: '12 Mini Battles', file: 'cl12minibattles' },
    { id: '1on1soccer', title: '1 on 1 Soccer', file: 'cl1on1soccer' },
    { id: '1v1tennis', title: '1v1 Tennis', file: 'cl1v1tennis' },
    { id: '2048cupcakes', title: '2048 Cupcakes', file: 'cl2048cupcakes' },
    { id: '3dash', title: '3Dash', file: 'cl3dash' },
    { id: '3pandas', title: '3 Pandas', file: 'cl3pandas' },
    { id: '3pandasbrazil', title: '3 Pandas in Brazil', file: 'cl3pandasbrazil' },
    { id: '3pandasfantasy', title: '3 Pandas in Fantasy', file: 'cl3pandasfantasy' },
    { id: '3pandasjapan', title: '3 Pandas in Japan', file: 'cl3pandasjapan' },
    { id: '3pandasnight', title: '3 Pandas Night', file: 'cl3pandasnight' },
    { id: '3slices2', title: '3 Slices 2', file: 'cl3slices2' },
    { id: '40xescape', title: '40xEscape', file: 'cl40xescape' },
    { id: '4thandgoal', title: '4th and Goal', file: 'cl4thandgoal' },
    { id: '500calibercontractz', title: '500 Caliber Contractz', file: 'cl500calibercontractz' },
    { id: '60secondsburgerrun', title: '60 Seconds Burger Run', file: 'cl60secondsburgerrun' },
    { id: '60secondssantarun', title: '60 Seconds Santa Run', file: 'cl60secondssantarun' },
    { id: '8ballclassic', title: '8 Ball Classic', file: 'cl8ballclassic' },
    { id: '8ballpool', title: '8 Ball Pool', file: 'cl8ballpool' },
    { id: '99balls', title: '99 Balls', file: 'cl99balls' },
    { id: 'abandoned3', title: 'Abandoned 3', file: 'clabandoned3' },
    { id: 'absolutemadness', title: 'Absolute Madness', file: 'clabsolutemadness' },
    { id: 'acecombat2', title: 'Ace Combat 2', file: 'clacecombat2' },
    { id: 'acecombat3', title: 'Ace Combat 3', file: 'clacecombat3' },
    { id: 'acegangstertaxi', title: 'Ace Gangster Taxi', file: 'clacegangstertaxi' },
    { id: 'achievementunlocked', title: 'Achievement Unlocked', file: 'clachievementunlocked' },
    { id: 'achievementunlocked2', title: 'Achievement Unlocked 2', file: 'clachievementunlocked2' },
    { id: 'achievementunlocked3', title: 'Achievement Unlocked 3', file: 'clachievementunlocked3' },
    { id: 'achillies', title: 'Achillies', file: 'clachillies' },
    { id: 'achillies2', title: 'Achillies 2', file: 'clachillies2' },
    { id: 'adarkroom', title: 'A Dark Room', file: 'clADarkRoom' },
    { id: 'adayintheoffice', title: 'A Day in the Office', file: 'cladayintheoffice' },
    { id: 'adofai', title: 'A Dance of Fire and Ice', file: 'clADOFAI' },
    { id: 'advancewars', title: 'Advance Wars', file: 'cladvancewars' },
    { id: 'advancewars2', title: 'Advance Wars 2', file: 'cladvancewars2' },
    { id: 'adventneon', title: 'Advent Neon', file: 'cladventneon' },
    { id: 'adventurecapitalist', title: 'Adventure Capitalist', file: 'clAdventureCapatalist' },
    { id: 'agariolite', title: 'Agar.io Lite', file: 'clagariolite' },
    { id: 'ageofwar', title: 'Age of War', file: 'clageofwar' },
    { id: 'ageofwar2', title: 'Age of War 2', file: 'clageofwar2' },
    { id: 'ageofconflict', title: 'Age of Conflict', file: 'clageofconflict' },
    { id: 'ahoysurvival', title: 'Ahoy Survival', file: 'clahoysurvival' },
    { id: 'akoopasrevenge', title: "A Koopa's Revenge", file: 'clakoopasrevenge' },
    { id: 'akoopasrevenge2', title: "A Koopa's Revenge 2", file: 'clakoopasrevenge2' },
    { id: 'alienhominid', title: 'Alien Hominid', file: 'clalienhominid' },
    { id: 'alienskyinvasion', title: 'Alien Sky Invasion', file: 'clalienskyinvasion' },
    { id: 'alientransporter', title: 'Alien Transporter', file: 'clalientransporter' },
    { id: 'alienvspredator', title: 'Alien vs Predator', file: 'clalienvspredator' },
    { id: 'amaze', title: 'Amaze', file: 'clamaze' },
    { id: 'amidstthesky', title: 'Amidst the Sky', file: 'clamidstthesky' },
    { id: 'amigopancho', title: 'Amigo Pancho', file: 'clamigopancho' },
    { id: 'amorphous', title: 'Amorphous', file: 'clamorphous' },
    { id: 'ancientsins', title: 'Ancient Sins', file: 'clancientsins' },
    { id: 'angrybirds', title: 'Angry Birds', file: 'clangrybirds' },
    { id: 'angrybirdsspace', title: 'Angry Birds Space', file: 'clangry-birdsspace' },
    { id: 'animalcrossingwildworld', title: 'Animal Crossing: Wild World', file: 'clanimalcrossingwildworld' },
    { id: 'anotherworld', title: 'Another World', file: 'clanotherworld' },
    { id: 'apotris', title: 'Apotris', file: 'clapotris' },
    { id: 'appleshooter', title: 'Apple Shooter', file: 'clappleshooter' },
    { id: 'appleworm', title: 'Apple Worm', file: 'clappleworm' },
    { id: 'aquaparkio', title: 'Aquapark.io', file: 'claquaparkio' },
    { id: 'archeryworldtour', title: 'Archery World Tour', file: 'clarcheryworldtour' },
    { id: 'armormayhem2', title: 'Armor Mayhem 2', file: 'clarmormayhem2' },
    { id: 'ascent', title: 'Ascent', file: 'clascent' },
    { id: 'asmallworldcup', title: 'A Small World Cup', file: 'clasmallworldcup' },
    { id: 'asteroids', title: 'Asteroids', file: 'clasteroids' },
    { id: 'attackhole', title: 'Attack Hole', file: 'clattackhole' },
    { id: 'aviamasters', title: 'Avia Masters', file: 'claviamasters' },
    { id: 'awesomepirates', title: 'Awesome Pirates', file: 'clAwesomePirates' },
    { id: 'awesomeplanes', title: 'Awesome Planes', file: 'clawesomeplanes' },
    { id: 'awesometanks', title: 'Awesome Tanks', file: 'clawesometanks' },
    { id: 'awesometanks2', title: 'Awesome Tanks 2', file: 'clawesometanks2' },
    { id: 'babeltower', title: 'Babel Tower', file: 'clbabeltower' },
    { id: 'backrooms', title: 'Backrooms', file: 'clbackrooms' },
    { id: 'backyardbaseball', title: 'Backyard Baseball', file: 'clbackyardbaseball' },
    { id: 'backyardsoccer', title: 'Backyard Soccer', file: 'clbackyardsoccer' },
    { id: 'baconmaydie', title: 'Bacon May Die', file: 'clbaconmaydie' },
    { id: 'badicecream', title: 'Bad Ice Cream', file: 'clbadicecream' },
    { id: 'badpiggies', title: 'Bad Piggies', file: 'clbadpiggies' },
    { id: 'ballblast', title: 'Ball Blast', file: 'clballblast' },
    { id: 'banjokazooie', title: 'Banjo-Kazooie', file: 'clbanjokazooie' },
    { id: 'banjotooie', title: 'Banjo-Tooie', file: 'clbanjotooie' },
    { id: 'basketballlegends', title: 'Basketball Legends', file: 'clbasketballlegends' },
    { id: 'basketballstars', title: 'Basketball Stars', file: 'clbasketballstars' },
    { id: 'basketrandom', title: 'Basket Random', file: 'clbasketrandom' },
    { id: 'battlekarts', title: 'Battle Karts', file: 'clbattlekarts' },
    { id: 'bazookaboy', title: 'Bazooka Boy', file: 'clbazookaboy' },
    { id: 'bearbarians', title: 'Bearbarians', file: 'clbearbarians' },
    { id: 'bearsus', title: 'Bearsus', file: 'clbearsus' },
    { id: 'bigtowertinysquare', title: 'Big Tower Tiny Square', file: 'clbigtowertinysquare' },
    { id: 'bloons', title: 'Bloons', file: 'clbloons' },
    { id: 'bloons2', title: 'Bloons 2', file: 'clbloons2' },
    { id: 'bloonsTD1', title: 'Bloons TD 1', file: 'clbloonsTD1' },
    { id: 'bloonsTD2', title: 'Bloons TD 2', file: 'clbloonsTD2' },
    { id: 'bloonsTD3', title: 'Bloons TD 3', file: 'clbloonsTD3' },
    { id: 'bloonsTD4', title: 'Bloons TD 4', file: 'clbloonsTD4' },
    { id: 'bloonsTD5', title: 'Bloons TD 5', file: 'clbloonsTD5' },
    { id: 'bobtherobber', title: 'Bob the Robber', file: 'clbobtherobber' },
    { id: 'bobtherobber2', title: 'Bob the Robber 2', file: 'clbobtherobber2' },
    { id: 'bottleflip3d', title: 'Bottle Flip 3D', file: 'clbottleflip3d' },
    { id: 'boxhead2playrooms', title: 'Boxhead 2Play Rooms', file: 'clboxlalt' },
    { id: 'boxingrandom', title: 'Boxing Random', file: 'clboxingrandom' },
    { id: 'bridgerace', title: 'Bridge Race', file: 'clbridgerace' },
    { id: 'bubbleshooter', title: 'Bubble Shooter', file: 'clbubbleshooter' },
    { id: 'bubbletanks', title: 'Bubble Tanks', file: 'clbubbletanks' },
    { id: 'buckshotroulette', title: 'Buckshot Roulette', file: 'clbuckshotroulette' },
    { id: 'buildnowgg', title: 'BuildNow GG', file: 'clbuildnowgg' },
    { id: 'burritobison', title: 'Burrito Bison', file: 'clburritobison' },
    { id: 'cactusmccoy', title: 'Cactus McCoy', file: 'clcactusmccoy' },
    { id: 'capybaraclicker', title: 'Capybara Clicker', file: 'clcapybaraclicker' },
    { id: 'castlewarsmodern', title: 'Castle Wars Modern', file: 'clcastlewarsmodern' },
    { id: 'catmario', title: 'Cat Mario', file: 'clcatmario' },
    { id: 'celeste', title: 'Celeste', file: 'clceleste' },
    { id: 'chaosfaction2', title: 'Chaos Faction 2', file: 'clchaosfaction2' },
    { id: 'chess', title: 'Chess', file: 'clchess' },
    { id: 'clusterrush', title: 'Cluster Rush', file: 'clclusterrush' },
    { id: 'contra', title: 'Contra', file: 'clcontra' },
    { id: 'cuttherope', title: 'Cut the Rope', file: 'clcuttherope' },
    { id: 'deadzed', title: 'Dead Zed', file: 'cldeadzed' },
    { id: 'deltarune', title: 'Deltarune', file: 'cldeltarune' },
    { id: 'dieinthedungeon', title: 'Die in the Dungeon', file: 'cldieinthedungeon' },
    { id: 'digtochina', title: 'Dig to China', file: 'cldigtochina' },
    { id: 'dogeminer', title: 'Doge Miner', file: 'cldogeminer' },
    { id: 'doodlejump', title: 'Doodle Jump', file: 'cldoodlejump' },
    { id: 'ducklife', title: 'Duck Life', file: 'clducklife' },
    { id: 'ducklife4', title: 'Duck Life 4', file: 'clducklife4' },
    { id: 'earthbound', title: 'Earthbound', file: 'clearthbound' },
    { id: 'electricman2', title: 'Electric Man 2', file: 'clelectricman2' },
    { id: 'fancypants', title: 'Fancy Pants Adventure', file: 'clfancypantsadventure' },
    { id: 'fireboywatergirl', title: 'Fireboy and Watergirl', file: 'clfireboyandwatergirl' },
    { id: 'fnaf', title: 'Five Nights at Freddy\'s', file: 'clFNAF' },
    { id: 'getontop', title: 'Get on Top', file: 'clgetontop' },
    { id: 'granny', title: 'Granny', file: 'clgranny' },
    { id: 'gunmayhem', title: 'Gun Mayhem', file: 'clgunmayhem' },
    { id: 'halflife', title: 'Half-Life', file: 'clhalflife' },
    { id: 'hobo', title: 'Hobo', file: 'clhobo' },
    { id: 'holeio', title: 'Hole.io', file: 'clholeio' },
    { id: 'impossiblequiz', title: 'The Impossible Quiz', file: 'climpossiblequiz' },
    { id: 'infinitecraft', title: 'Infinite Craft', file: 'clinfinitecraft' },
    { id: 'jacksmith', title: 'Jacksmith', file: 'cljacksmith' },
    { id: 'jetpackjoyride', title: 'Jetpack Joyride', file: 'cljetpackjoyride' },
    { id: 'learntofly', title: 'Learn to Fly', file: 'cllearntofly' },
    { id: 'mariobros', title: 'Super Mario Bros', file: 'clsupermariobros' },
    { id: 'metalgearsolid', title: 'Metal Gear Solid', file: 'clmetalgearsolid' },
    { id: 'monkeymart', title: 'Monkey Mart', file: 'clmonkeymart' },
    { id: 'pizzatower', title: 'Pizza Tower', file: 'clpizzatower' },
    { id: 'portal', title: 'Portal', file: 'clportal' },
    { id: 'pou', title: 'Pou', file: 'clpou' },
    { id: 'raftwars', title: 'Raft Wars', file: 'clraftwars' },
    { id: 'redball4', title: 'Red Ball 4', file: 'clredball4' },
    { id: 'riddleschool', title: 'Riddle School', file: 'clriddleschool' },
    { id: 'smashflash2', title: 'Super Smash Flash 2', file: 'clsupersmashflash2' },
    { id: 'sonic', title: 'Sonic the Hedgehog', file: 'clsonicthehedgehog' },
    { id: 'stickwar', title: 'Stick War', file: 'clstickwar' },
    { id: 'templerun2', title: 'Temple Run 2', file: 'cltempleofboom' },
    { id: 'worldshardestgame', title: 'World\'s Hardest Game', file: 'clworldshardestgame' },
    { id: 'soccerrandom', title: 'Soccer Random', file: 'clsoccerrandom' },
    { id: 'volleyrandom', title: 'Volley Random', file: 'clvolleyrandom' },
    { id: '1on1soccer', title: '1 on 1 Soccer', file: 'cl1on1soccer' },
  ];

  const [games] = useState(UGS_GAMES);

  const launchUGSGame = async (game) => {
    const filename = game.file.endsWith('.html') ? game.file : `${game.file}.html`;
    const url = `https://cdn.jsdelivr.net/gh/bubbls/ugs-singlefile/UGS-Files/${encodeURIComponent(filename)}`;
    
    try {
      const response = await fetch(url);
      const html = await response.text();
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
      alert('Failed to load game. It might be blocked or the server is down.');
    }
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
                  <iframe 
                    src={selectedGame.id === 'proxy-session' ? getProxiedUrl(currentProxyUrl) : getProxiedUrl(selectedGame.url)}
                    className="w-full flex-1 border-none"
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
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <h2 className="text-3xl font-bold tracking-tight">Game Library</h2>
                  <div className="relative w-full md:w-72">
                    <input 
                      type="text"
                      placeholder="Search games..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 p-3 pl-10 pr-10 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all text-white"
                    />
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    {searchTerm && (
                      <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {games.filter(g => g.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40 text-center space-y-4">
                    <Gamepad2 size={64} />
                    <p className="text-lg font-medium">No games found matching your search.</p>
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
                  <iframe 
                    src={getProxiedUrl(currentProxyUrl)}
                    className="w-full flex-1 border-none"
                    title="Ultra Session"
                    allowFullScreen
                    allow="autoplay; fullscreen; camera; focus-without-user-activation *; monetization; gamepad; keyboard-map *; xr-spatial-tracking; clipboard-write"
                    sandbox="allow-forms allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin allow-downloads"
                  />
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
