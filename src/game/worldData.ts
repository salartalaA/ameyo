import type {
  Building,
  Crosswalk,
  DistrictId,
  DistrictZone,
  Interactable,
  PropKind,
  Puddle,
  Rect,
  RoadSegment,
  Vec2,
  WorldProp,
} from './types';

export const WORLD_WIDTH = 4800;
export const WORLD_HEIGHT = 3600;

// Player spawns on the open sidewalk/parking apron right outside the 24H Konbini
export const PLAYER_SPAWN: Vec2 = { x: 1050, y: 1082 };
// Lime-green sportbike starts parked beside a warm streetlamp near the Konbini parking bay
export const MOTORCYCLE_SPAWN: Vec2 = { x: 1170, y: 1088 };
export const MOTORCYCLE_SPAWN_ANGLE = 0; // facing east toward Central Blvd

export const CANAL_RECT: Rect = { x: 0, y: 1960, w: WORLD_WIDTH, h: 150 };
export const BRIDGE_RECT: Rect = { x: 1444, y: 1945, w: 176, h: 180 };
export const BRIDGE_RECT_EAST: Rect = { x: 3330, y: 1945, w: 176, h: 180 };
export const CANAL_BRIDGES: Rect[] = [BRIDGE_RECT, BRIDGE_RECT_EAST];

export const DISTRICTS: DistrictZone[] = [
  {
    id: 'residential',
    name: 'Shizuku Residential',
    jpName: '雫住宅街',
    rect: { x: 0, y: 0, w: 1530, h: 740 },
  },
  {
    id: 'entertainment',
    name: 'Yoru Neon Quarter',
    jpName: '夜歓楽街',
    rect: { x: 1530, y: 0, w: 1670, h: 1180 },
  },
  {
    id: 'commercial',
    name: 'Ameyo Station Front',
    jpName: '雨夜駅前商業区',
    rect: { x: 0, y: 740, w: 1604, h: 1020 },
  },
  {
    id: 'quiet',
    name: 'Kawa Riverside & Park',
    jpName: '川辺公園',
    rect: { x: 0, y: 1760, w: WORLD_WIDTH, h: 640 },
  },
  {
    id: 'market',
    name: 'Minato Market Row',
    jpName: '港町市場街',
    rect: { x: 3200, y: 0, w: 1600, h: 1760 },
  },
  {
    id: 'hills',
    name: 'Hinode Hill Park',
    jpName: '朝日丘公園',
    rect: { x: 0, y: 2400, w: WORLD_WIDTH, h: 1200 },
  },
];

// Roads: horizontal and vertical avenues
export const ROADS: RoadSegment[] = [
  // Horizontal roads
  { x: 0, y: 440, w: WORLD_WIDTH, h: 120, axis: 'h' },   // North Crosstown
  { x: 0, y: 1120, w: WORLD_WIDTH, h: 144, axis: 'h' },  // Main Station Blvd
  { x: 0, y: 1760, w: WORLD_WIDTH, h: 112, axis: 'h' },  // Riverside Road
  // Vertical roads
  { x: 560, y: 0, w: 120, h: 1872, axis: 'v' },          // West Residential St
  { x: 1460, y: 0, w: 144, h: 2400, axis: 'v' },         // Central Blvd + Bridge
  { x: 2360, y: 0, w: 128, h: 1872, axis: 'v' },         // East Neon Ave
  { x: 3560, y: 0, w: 110, h: 1872, axis: 'v' },         // Minato Market St
  { x: 4380, y: 0, w: 110, h: 1872, axis: 'v' },         // Harbor East St
  { x: 3360, y: 1872, w: 120, h: 148, axis: 'v' },       // East Bridge approach
  // South-of-canal continuations (Hinode Hills)
  { x: 1460, y: 2120, w: 144, h: 1480, axis: 'v' },      // Central Blvd South
  { x: 2360, y: 2120, w: 128, h: 1480, axis: 'v' },      // East Ave South
  { x: 3360, y: 2120, w: 120, h: 1480, axis: 'v' },      // East Bridge South
  // Horizontal roads
  { x: 2488, y: 1440, w: 2312, h: 120, axis: 'h' },      // Harbor Road (market link)
  { x: 0, y: 2900, w: WORLD_WIDTH, h: 110, axis: 'h' },  // Hill Road
];

// Sidewalk aprons around roads & plazas
export const SIDEWALKS: Rect[] = [
  // Along North Crosstown
  { x: 0, y: 400, w: WORLD_WIDTH, h: 40 },
  { x: 0, y: 560, w: WORLD_WIDTH, h: 40 },
  // Along Main Station Blvd
  { x: 0, y: 1056, w: WORLD_WIDTH, h: 64 },
  { x: 0, y: 1264, w: WORLD_WIDTH, h: 56 },
  // Along Riverside Road
  { x: 0, y: 1720, w: WORLD_WIDTH, h: 40 },
  { x: 0, y: 1872, w: WORLD_WIDTH, h: 44 },
  // Along West St
  { x: 520, y: 0, w: 40, h: 1872 },
  { x: 680, y: 0, w: 40, h: 1872 },
  // Along Central Blvd
  { x: 1412, y: 0, w: 48, h: 1945 },
  { x: 1604, y: 0, w: 48, h: 1945 },
  { x: 1412, y: 2120, w: 48, h: 280 },
  { x: 1604, y: 2120, w: 48, h: 280 },
  // Along East Neon Ave
  { x: 2316, y: 0, w: 44, h: 1872 },
  { x: 2488, y: 0, w: 44, h: 1872 },
  // Konbini Parking Apron
  { x: 840, y: 980, w: 420, h: 140 },
  // Entertainment Arcade Plaza
  { x: 1652, y: 560, w: 660, h: 80 },
  // South Park Plaza
  { x: 1180, y: 2120, w: 720, h: 200 },
  // Harbor Road sidewalks (market link)
  { x: 2360, y: 1400, w: 2440, h: 40 },
  { x: 2360, y: 1560, w: 2440, h: 40 },
  // Minato Market St sidewalks
  { x: 3516, y: 0, w: 44, h: 1872 },
  { x: 3670, y: 0, w: 46, h: 1872 },
  // Harbor East St sidewalks
  { x: 4336, y: 0, w: 44, h: 1872 },
  { x: 4490, y: 0, w: 46, h: 1872 },
  // East bridge approach sidewalks
  { x: 3316, y: 1872, w: 44, h: 148 },
  { x: 3480, y: 1872, w: 44, h: 148 },
  // South-of-canal road sidewalks (Hinode Hills)
  { x: 1412, y: 2120, w: 48, h: 1480 },
  { x: 1604, y: 2120, w: 48, h: 1480 },
  { x: 2316, y: 2120, w: 44, h: 1480 },
  { x: 2488, y: 2120, w: 44, h: 1480 },
  { x: 3316, y: 2120, w: 44, h: 1480 },
  { x: 3480, y: 2120, w: 44, h: 1480 },
  { x: 0, y: 2860, w: WORLD_WIDTH, h: 40 },
  { x: 0, y: 3010, w: WORLD_WIDTH, h: 40 },
];

export const CROSSWALKS: Crosswalk[] = [
  // Main Blvd x West St
  { x: 564, y: 1094, w: 112, h: 24, orientation: 'h' },
  { x: 564, y: 1266, w: 112, h: 24, orientation: 'h' },
  { x: 534, y: 1124, w: 24, h: 136, orientation: 'v' },
  { x: 682, y: 1124, w: 24, h: 136, orientation: 'v' },
  // Main Blvd x Central Blvd
  { x: 1464, y: 1094, w: 136, h: 24, orientation: 'h' },
  { x: 1464, y: 1266, w: 136, h: 24, orientation: 'h' },
  { x: 1434, y: 1124, w: 24, h: 136, orientation: 'v' },
  { x: 1606, y: 1124, w: 24, h: 136, orientation: 'v' },
  // Main Blvd x East Neon Ave
  { x: 2364, y: 1094, w: 120, h: 24, orientation: 'h' },
  { x: 2364, y: 1266, w: 120, h: 24, orientation: 'h' },
  { x: 2334, y: 1124, w: 24, h: 136, orientation: 'v' },
  { x: 2490, y: 1124, w: 24, h: 136, orientation: 'v' },
  // North Crosstown x Central Blvd
  { x: 1464, y: 414, w: 136, h: 24, orientation: 'h' },
  { x: 1464, y: 562, w: 136, h: 24, orientation: 'h' },
  { x: 1434, y: 444, w: 24, h: 112, orientation: 'v' },
  { x: 1606, y: 444, w: 24, h: 112, orientation: 'v' },
  // Riverside x Central Blvd
  { x: 1464, y: 1734, w: 136, h: 24, orientation: 'h' },
  { x: 1464, y: 1874, w: 136, h: 24, orientation: 'h' },
  // Harbor Rd x Minato Market St
  { x: 3516, y: 1414, w: 154, h: 24, orientation: 'h' },
  { x: 3516, y: 1562, w: 154, h: 24, orientation: 'h' },
  { x: 3520, y: 1412, w: 24, h: 156, orientation: 'v' },
  { x: 3680, y: 1412, w: 24, h: 156, orientation: 'v' },
  // Harbor Rd x Harbor East St
  { x: 4336, y: 1414, w: 154, h: 24, orientation: 'h' },
  { x: 4336, y: 1562, w: 154, h: 24, orientation: 'h' },
  { x: 4340, y: 1412, w: 24, h: 156, orientation: 'v' },
  { x: 4500, y: 1412, w: 24, h: 156, orientation: 'v' },
  // Hill Rd x Central Blvd South
  { x: 1412, y: 2874, w: 192, h: 24, orientation: 'h' },
  { x: 1412, y: 3012, w: 192, h: 24, orientation: 'h' },
  { x: 1420, y: 2860, w: 24, h: 150, orientation: 'v' },
  { x: 1620, y: 2860, w: 24, h: 150, orientation: 'v' },
  // Hill Rd x East Ave South
  { x: 2316, y: 2874, w: 172, h: 24, orientation: 'h' },
  { x: 2316, y: 3012, w: 172, h: 24, orientation: 'h' },
  { x: 2320, y: 2860, w: 24, h: 150, orientation: 'v' },
  { x: 2500, y: 2860, w: 24, h: 150, orientation: 'v' },
  // Hill Rd x East Bridge South
  { x: 3316, y: 2874, w: 164, h: 24, orientation: 'h' },
  { x: 3316, y: 3012, w: 164, h: 24, orientation: 'h' },
  { x: 3320, y: 2860, w: 24, h: 150, orientation: 'v' },
  { x: 3496, y: 2860, w: 24, h: 150, orientation: 'v' },
];

export const BUILDINGS: Building[] = [
  // === COMMERCIAL DISTRICT (Center-West) ===
  {
    id: 'konbini_amemart',
    kind: 'konbini',
    name: 'AME-MART 24H',
    jpLabel: '雨夜コンビニ',
    district: 'commercial',
    x: 860,
    y: 780,
    w: 280,
    h: 190,
    roofHeight: 54,
    wallColor: '#253147',
    trimColor: '#e2e8f0',
    roofColor: '#1a2335',
    accentColor: '#22d3ee',
    warmLights: true,
    doorX: 980,
    doorY: 970,
    signs: [
      {
        offsetX: 16,
        offsetY: 46,
        w: 248,
        h: 22,
        text: 'AME-MART 24H OPEN',
        color: '#22d3ee',
        glowColor: 'rgba(34,211,238,0.55)',
      },
    ],
  },
  {
    id: 'ramen_ichiban',
    kind: 'ramen',
    name: 'Yoru Ichiban Ramen',
    jpLabel: '一番ラーメン',
    district: 'commercial',
    x: 200,
    y: 830,
    w: 240,
    h: 190,
    roofHeight: 56,
    wallColor: '#362624',
    trimColor: '#d97706',
    roofColor: '#1f191d',
    accentColor: '#ef4444',
    warmLights: true,
    doorX: 315,
    doorY: 1020,
    signs: [
      {
        offsetX: 28,
        offsetY: 54,
        w: 184,
        h: 22,
        text: 'ラーメン 一番',
        color: '#fb923c',
        glowColor: 'rgba(251,146,60,0.6)',
      },
    ],
  },
  {
    id: 'cafe_tsuki',
    kind: 'cafe',
    name: 'Kissaten Tsuki',
    jpLabel: '喫茶 月',
    district: 'commercial',
    x: 780,
    y: 1350,
    w: 230,
    h: 190,
    roofHeight: 52,
    wallColor: '#2d2938',
    trimColor: '#fbbf24',
    roofColor: '#1b1926',
    accentColor: '#fbbf24',
    warmLights: true,
    doorX: 890,
    doorY: 1540,
    signs: [
      {
        offsetX: 36,
        offsetY: 54,
        w: 158,
        h: 20,
        text: 'COFFEE · 喫茶 月',
        color: '#fde68a',
        glowColor: 'rgba(251,191,36,0.5)',
      },
    ],
  },
  {
    id: 'bookshop_hoshino',
    kind: 'cafe',
    name: 'Hoshino Books & Records',
    jpLabel: '星野古書店',
    district: 'commercial',
    x: 1100,
    y: 1350,
    w: 250,
    h: 190,
    roofHeight: 54,
    wallColor: '#243140',
    trimColor: '#94a3b8',
    roofColor: '#17202b',
    accentColor: '#38bdf8',
    warmLights: true,
    doorX: 1220,
    doorY: 1540,
    signs: [
      {
        offsetX: 30,
        offsetY: 56,
        w: 190,
        h: 20,
        text: 'BOOKS & VINYL',
        color: '#7dd3fc',
        glowColor: 'rgba(56,189,248,0.45)',
      },
    ],
  },

  // === RESIDENTIAL DISTRICT (NW) ===
  {
    id: 'apt_shizuku_a',
    kind: 'apartment',
    name: 'Shizuku Heights A',
    jpLabel: 'コーポ雫 A',
    district: 'residential',
    x: 120,
    y: 110,
    w: 340,
    h: 230,
    roofHeight: 74,
    wallColor: '#2a3447',
    trimColor: '#64748b',
    roofColor: '#182132',
    accentColor: '#f59e0b',
    warmLights: true,
    signs: [],
  },
  {
    id: 'apt_shizuku_b',
    kind: 'apartment',
    name: 'Shizuku Heights B',
    jpLabel: 'コーポ雫 B',
    district: 'residential',
    x: 780,
    y: 120,
    w: 320,
    h: 220,
    roofHeight: 72,
    wallColor: '#273245',
    trimColor: '#64748b',
    roofColor: '#171f2e',
    accentColor: '#fbbf24',
    warmLights: true,
    signs: [],
  },
  {
    id: 'house_mori',
    kind: 'house',
    name: 'Mori Residence',
    jpLabel: '森家',
    district: 'residential',
    x: 1160,
    y: 160,
    w: 190,
    h: 170,
    roofHeight: 54,
    wallColor: '#2e3344',
    trimColor: '#94a3b8',
    roofColor: '#1e2436',
    accentColor: '#fde047',
    warmLights: true,
    signs: [],
  },
  {
    id: 'house_tanaka',
    kind: 'house',
    name: 'Tanaka House',
    jpLabel: '田中家',
    district: 'residential',
    x: 160,
    y: 620,
    w: 210,
    h: 160,
    roofHeight: 50,
    wallColor: '#2c3446',
    trimColor: '#94a3b8',
    roofColor: '#1c2333',
    accentColor: '#fbbf24',
    warmLights: true,
    signs: [],
  },
  {
    id: 'apt_midori',
    kind: 'apartment',
    name: 'Midori Terrace',
    jpLabel: 'みどり荘',
    district: 'residential',
    x: 780,
    y: 610,
    w: 260,
    h: 130,
    roofHeight: 46,
    wallColor: '#24303e',
    trimColor: '#64748b',
    roofColor: '#151e29',
    accentColor: '#34d399',
    warmLights: true,
    signs: [],
  },

  // === ENTERTAINMENT DISTRICT (NE) ===
  {
    id: 'arcade_galaxy',
    kind: 'arcade',
    name: 'AME-CADE 24H',
    jpLabel: 'ゲームセンター雨夜',
    district: 'entertainment',
    x: 1700,
    y: 110,
    w: 320,
    h: 240,
    roofHeight: 74,
    wallColor: '#1f233b',
    trimColor: '#f472b6',
    roofColor: '#13162a',
    accentColor: '#ec4899',
    warmLights: true,
    doorX: 1860,
    doorY: 350,
    signs: [
      {
        offsetX: 28,
        offsetY: 76,
        w: 264,
        h: 26,
        text: 'GAME ARCADE 24H',
        color: '#f472b6',
        glowColor: 'rgba(244,114,182,0.65)',
        flicker: true,
      },
      {
        offsetX: 268,
        offsetY: 112,
        w: 32,
        h: 96,
        text: 'ゲーム',
        color: '#22d3ee',
        glowColor: 'rgba(34,211,238,0.6)',
        vertical: true,
      },
    ],
  },
  {
    id: 'karaoke_night',
    kind: 'karaoke',
    name: 'Karaoke Blue Moon',
    jpLabel: 'カラオケ蒼月',
    district: 'entertainment',
    x: 2080,
    y: 130,
    w: 210,
    h: 220,
    roofHeight: 68,
    wallColor: '#212942',
    trimColor: '#38bdf8',
    roofColor: '#141a2e',
    accentColor: '#38bdf8',
    warmLights: true,
    doorX: 2180,
    doorY: 350,
    signs: [
      {
        offsetX: 22,
        offsetY: 70,
        w: 166,
        h: 24,
        text: 'KARAOKE 蒼月',
        color: '#38bdf8',
        glowColor: 'rgba(56,189,248,0.6)',
        flicker: true,
      },
    ],
  },
  {
    id: 'izakaya_akari',
    kind: 'izakaya',
    name: 'Izakaya Akari',
    jpLabel: '居酒屋 あかり',
    district: 'entertainment',
    x: 1710,
    y: 660,
    w: 260,
    h: 210,
    roofHeight: 60,
    wallColor: '#33242b',
    trimColor: '#f97316',
    roofColor: '#1d151b',
    accentColor: '#fb7185',
    warmLights: true,
    doorX: 1840,
    doorY: 870,
    signs: [
      {
        offsetX: 30,
        offsetY: 60,
        w: 200,
        h: 24,
        text: '居酒屋 あかり',
        color: '#fb923c',
        glowColor: 'rgba(251,146,60,0.65)',
      },
    ],
  },
  {
    id: 'music_bar_echo',
    kind: 'karaoke',
    name: 'Jazz & Vinyl Echo',
    jpLabel: 'ジャズ喫茶エコー',
    district: 'entertainment',
    x: 2580,
    y: 640,
    w: 280,
    h: 220,
    roofHeight: 64,
    wallColor: '#22263b',
    trimColor: '#eab308',
    roofColor: '#151828',
    accentColor: '#facc15',
    warmLights: true,
    doorX: 2720,
    doorY: 860,
    signs: [
      {
        offsetX: 36,
        offsetY: 64,
        w: 208,
        h: 24,
        text: 'JAZZ BAR ECHO',
        color: '#fde047',
        glowColor: 'rgba(250,204,21,0.55)',
      },
    ],
  },
  {
    id: 'hotel_neon',
    kind: 'arcade',
    name: 'Capsule Inn Shiori',
    jpLabel: 'カプセルホテル栞',
    district: 'entertainment',
    x: 2580,
    y: 110,
    w: 300,
    h: 240,
    roofHeight: 76,
    wallColor: '#1f293d',
    trimColor: '#a78bfa',
    roofColor: '#121827',
    accentColor: '#c084fc',
    warmLights: true,
    signs: [
      {
        offsetX: 40,
        offsetY: 78,
        w: 220,
        h: 24,
        text: 'CAPSULE INN 24H',
        color: '#c084fc',
        glowColor: 'rgba(192,132,252,0.55)',
      },
    ],
  },

  {
    id: 'karaoke_box_tsukiyo',
    kind: 'karaoke',
    name: 'Karaoke Box Tsukiyo',
    jpLabel: 'カラオケツキヨ',
    district: 'commercial',
    x: 1200,
    y: 800,
    w: 170,
    h: 150,
    roofHeight: 48,
    wallColor: '#263247',
    trimColor: '#38bdf8',
    roofColor: '#141d2d',
    accentColor: '#38bdf8',
    warmLights: true,
    doorX: 1290,
    doorY: 946,
    signs: [
      {
        offsetX: 18,
        offsetY: 52,
        w: 134,
        h: 22,
        text: 'カラオケ 24H',
        color: '#7dd3fc',
        glowColor: 'rgba(56,189,248,0.58)',
        flicker: true,
      },
      {
        offsetX: 140,
        offsetY: 76,
        w: 24,
        h: 68,
        text: 'ツキヨ',
        color: '#f472b6',
        glowColor: 'rgba(244,114,182,0.55)',
        vertical: true,
      },
    ],
  },
  {
    id: 'pachinko_zeus',
    kind: 'arcade',
    name: 'Pachinko Zeus',
    jpLabel: 'パチンコゼウス',
    district: 'entertainment',
    x: 1720,
    y: 890,
    w: 240,
    h: 130,
    roofHeight: 42,
    wallColor: '#20263b',
    trimColor: '#facc15',
    roofColor: '#121728',
    accentColor: '#facc15',
    warmLights: true,
    doorX: 1842,
    doorY: 1008,
    signs: [
      {
        offsetX: 24,
        offsetY: 46,
        w: 192,
        h: 24,
        text: 'PACHINKO ZEUS',
        color: '#fde047',
        glowColor: 'rgba(250,204,21,0.6)',
        flicker: true,
      },
    ],
  },
  {
    id: 'apt_shizuku_c',
    kind: 'apartment',
    name: 'Shizuku Heights C',
    jpLabel: 'コーポ雫 C',
    district: 'residential',
    x: 120,
    y: 830,
    w: 220,
    h: 190,
    roofHeight: 64,
    wallColor: '#2b3244',
    trimColor: '#64748b',
    roofColor: '#17202e',
    accentColor: '#fbbf24',
    warmLights: true,
    signs: [],
  },
  {
    id: 'kissaten_hinata',
    kind: 'cafe',
    name: 'Kissaten Hinata',
    jpLabel: '喫茶 ひなた',
    district: 'commercial',
    x: 140,
    y: 1360,
    w: 240,
    h: 170,
    roofHeight: 52,
    wallColor: '#33302d',
    trimColor: '#fbbf24',
    roofColor: '#1d1a18',
    accentColor: '#fbbf24',
    warmLights: true,
    doorX: 250,
    doorY: 1518,
    signs: [
      {
        offsetX: 34,
        offsetY: 58,
        w: 172,
        h: 20,
        text: '喫茶 ひなた',
        color: '#fde68a',
        glowColor: 'rgba(251,191,36,0.48)',
      },
    ],
  },

  // === QUIET DISTRICT (South-East Gas Station & South Park Shrine) ===
  {
    id: 'gas_station_ame',
    kind: 'gas_station',
    name: 'AME OIL 24H',
    jpLabel: '雨夜給油所',
    district: 'quiet',
    x: 1960,
    y: 1380,
    w: 310,
    h: 220,
    roofHeight: 54,
    wallColor: '#253143',
    trimColor: '#f8fafc',
    roofColor: '#1b2638',
    accentColor: '#34d399',
    warmLights: true,
    doorX: 2115,
    doorY: 1600,
    signs: [
      {
        offsetX: 35,
        offsetY: 88,
        w: 240,
        h: 22,
        text: 'AME OIL · SELF 24H',
        color: '#34d399',
        glowColor: 'rgba(52,211,153,0.55)',
      },
    ],
  },
  {
    id: 'shrine_kawa',
    kind: 'shrine',
    name: 'Kawa Inari Shrine',
    jpLabel: '川辺稲荷神社',
    district: 'quiet',
    x: 1960,
    y: 2145,
    w: 210,
    h: 165,
    roofHeight: 54,
    wallColor: '#3b2427',
    trimColor: '#ef4444',
    roofColor: '#241a21',
    accentColor: '#f87171',
    warmLights: true,
    doorX: 2065,
    doorY: 2310,
    signs: [],
  },

  // === MINATO MARKET ROW (East Wing) ===
  {
    id: 'market_hall_minato',
    kind: 'cafe',
    name: 'Minato Central Market',
    jpLabel: '港町市場',
    district: 'market',
    x: 3210,
    y: 50,
    w: 300,
    h: 330,
    roofHeight: 62,
    wallColor: '#2c3a4d',
    trimColor: '#7dd3fc',
    roofColor: '#182335',
    accentColor: '#38bdf8',
    warmLights: true,
    doorX: 3350,
    doorY: 375,
    signs: [
      {
        offsetX: 30,
        offsetY: 70,
        w: 240,
        h: 24,
        text: 'MINATO MARKET',
        color: '#7dd3fc',
        glowColor: 'rgba(56,189,248,0.6)',
      },
      {
        offsetX: 262,
        offsetY: 100,
        w: 26,
        h: 80,
        text: '市場',
        color: '#fbbf24',
        glowColor: 'rgba(251,191,36,0.55)',
        vertical: true,
      },
    ],
  },
  {
    id: 'arcade_minato',
    kind: 'arcade',
    name: 'Port Side Arcade',
    jpLabel: '港サイドゲーム',
    district: 'market',
    x: 3690,
    y: 50,
    w: 300,
    h: 330,
    roofHeight: 66,
    wallColor: '#242b45',
    trimColor: '#f472b6',
    roofColor: '#151a2e',
    accentColor: '#f472b6',
    warmLights: true,
    doorX: 3830,
    doorY: 375,
    signs: [
      {
        offsetX: 34,
        offsetY: 76,
        w: 232,
        h: 24,
        text: 'PORT ARCADE 24H',
        color: '#f472b6',
        glowColor: 'rgba(244,114,182,0.62)',
        flicker: true,
      },
    ],
  },
  {
    id: 'karaoke_minato',
    kind: 'karaoke',
    name: 'Karaoke Minato Bay',
    jpLabel: 'カラオケ港湾',
    district: 'market',
    x: 4030,
    y: 50,
    w: 290,
    h: 330,
    roofHeight: 64,
    wallColor: '#1f2b3d',
    trimColor: '#34d399',
    roofColor: '#131c2a',
    accentColor: '#34d399',
    warmLights: true,
    doorX: 4170,
    doorY: 375,
    signs: [
      {
        offsetX: 30,
        offsetY: 72,
        w: 230,
        h: 24,
        text: 'KARAOKE 港湾',
        color: '#6ee7b7',
        glowColor: 'rgba(52,211,153,0.55)',
        flicker: true,
      },
    ],
  },
  {
    id: 'capsule_minato',
    kind: 'arcade',
    name: 'Capsule Inn Minato',
    jpLabel: 'カプセル港',
    district: 'market',
    x: 4510,
    y: 50,
    w: 270,
    h: 330,
    roofHeight: 72,
    wallColor: '#222c42',
    trimColor: '#fbbf24',
    roofColor: '#141b2b',
    accentColor: '#fbbf24',
    warmLights: true,
    signs: [
      {
        offsetX: 34,
        offsetY: 80,
        w: 202,
        h: 24,
        text: 'CAPSULE INN 港',
        color: '#fde68a',
        glowColor: 'rgba(251,191,36,0.55)',
      },
    ],
  },
  {
    id: 'net_cafe_yoru',
    kind: 'cafe',
    name: 'Net Cafe Yoru',
    jpLabel: '夜ネットカフェ',
    district: 'market',
    x: 2920,
    y: 70,
    w: 240,
    h: 310,
    roofHeight: 58,
    wallColor: '#2b2f45',
    trimColor: '#a78bfa',
    roofColor: '#181b2c',
    accentColor: '#a78bfa',
    warmLights: true,
    doorX: 3030,
    doorY: 375,
    signs: [
      {
        offsetX: 28,
        offsetY: 62,
        w: 184,
        h: 22,
        text: 'NET CAFE 夜',
        color: '#c4b5fd',
        glowColor: 'rgba(167,139,250,0.55)',
      },
    ],
  },
  {
    id: 'ramen_minato',
    kind: 'ramen',
    name: 'Minato Ramen Dojo',
    jpLabel: '港ラーメン道場',
    district: 'market',
    x: 3210,
    y: 620,
    w: 300,
    h: 320,
    roofHeight: 60,
    wallColor: '#3a2a24',
    trimColor: '#fb923c',
    roofColor: '#211814',
    accentColor: '#ef4444',
    warmLights: true,
    doorX: 3350,
    doorY: 935,
    signs: [
      {
        offsetX: 32,
        offsetY: 66,
        w: 236,
        h: 24,
        text: '港ラーメン 道場',
        color: '#fb923c',
        glowColor: 'rgba(251,146,60,0.6)',
      },
    ],
  },
  {
    id: 'izakaya_uotan',
    kind: 'izakaya',
    name: 'Izakaya Uotan',
    jpLabel: '居酒屋魚譚',
    district: 'market',
    x: 3690,
    y: 620,
    w: 300,
    h: 320,
    roofHeight: 58,
    wallColor: '#33262b',
    trimColor: '#f97316',
    roofColor: '#1d151b',
    accentColor: '#fb7185',
    warmLights: true,
    doorX: 3830,
    doorY: 935,
    signs: [
      {
        offsetX: 34,
        offsetY: 64,
        w: 232,
        h: 24,
        text: '居酒屋 魚譚',
        color: '#fdba74',
        glowColor: 'rgba(251,146,60,0.62)',
      },
    ],
  },
  {
    id: 'sushi_ame',
    kind: 'cafe',
    name: 'Sushi Ame Counter',
    jpLabel: '鮨雨カウンター',
    district: 'market',
    x: 4030,
    y: 620,
    w: 290,
    h: 320,
    roofHeight: 56,
    wallColor: '#243447',
    trimColor: '#e2e8f0',
    roofColor: '#16202f',
    accentColor: '#7dd3fc',
    warmLights: true,
    doorX: 4170,
    doorY: 935,
    signs: [
      {
        offsetX: 32,
        offsetY: 62,
        w: 226,
        h: 22,
        text: '鮨雨 SUSHI AME',
        color: '#bae6fd',
        glowColor: 'rgba(125,211,252,0.55)',
      },
    ],
  },
  {
    id: 'konbini_minato',
    kind: 'konbini',
    name: 'Minato Mart 24H',
    jpLabel: '港マート',
    district: 'market',
    x: 4510,
    y: 620,
    w: 270,
    h: 320,
    roofHeight: 56,
    wallColor: '#25324a',
    trimColor: '#e2e8f0',
    roofColor: '#17202f',
    accentColor: '#22d3ee',
    warmLights: true,
    doorX: 4640,
    doorY: 935,
    signs: [
      {
        offsetX: 30,
        offsetY: 66,
        w: 210,
        h: 22,
        text: 'MINATO MART 24H',
        color: '#67e8f9',
        glowColor: 'rgba(34,211,238,0.55)',
      },
    ],
  },

  // === HINODE HILL PARK (South of Canal) ===
  {
    id: 'house_hill_w1',
    kind: 'house',
    name: 'Hill Cottage',
    jpLabel: '丘の家',
    district: 'hills',
    x: 700,
    y: 2500,
    w: 240,
    h: 220,
    roofHeight: 56,
    wallColor: '#2e3547',
    trimColor: '#94a3b8',
    roofColor: '#1e2436',
    accentColor: '#fde047',
    warmLights: true,
    signs: [],
  },
  {
    id: 'house_hill_w2',
    kind: 'house',
    name: 'Hinode Residence',
    jpLabel: '日の出荘',
    district: 'hills',
    x: 1000,
    y: 2550,
    w: 230,
    h: 200,
    roofHeight: 52,
    wallColor: '#2c3446',
    trimColor: '#94a3b8',
    roofColor: '#1c2333',
    accentColor: '#fbbf24',
    warmLights: true,
    signs: [],
  },
  {
    id: 'konbini_hill',
    kind: 'konbini',
    name: 'Hilltop Mart',
    jpLabel: '丘の上マート',
    district: 'hills',
    x: 1150,
    y: 3250,
    w: 260,
    h: 270,
    roofHeight: 54,
    wallColor: '#26364c',
    trimColor: '#e2e8f0',
    roofColor: '#17202f',
    accentColor: '#38bdf8',
    warmLights: true,
    doorX: 1280,
    doorY: 3515,
    signs: [
      {
        offsetX: 30,
        offsetY: 60,
        w: 200,
        h: 22,
        text: 'HILLTOP MART',
        color: '#7dd3fc',
        glowColor: 'rgba(56,189,248,0.55)',
      },
    ],
  },
  {
    id: 'apt_hinode_a',
    kind: 'apartment',
    name: 'Hinode Terrace A',
    jpLabel: '日の出荘 A',
    district: 'hills',
    x: 1800,
    y: 2450,
    w: 300,
    h: 300,
    roofHeight: 70,
    wallColor: '#273245',
    trimColor: '#64748b',
    roofColor: '#171f2e',
    accentColor: '#fbbf24',
    warmLights: true,
    signs: [],
  },
  {
    id: 'ramen_soba_hill',
    kind: 'ramen',
    name: 'Soba Hill Shop',
    jpLabel: 'そば処丘',
    district: 'hills',
    x: 2560,
    y: 2460,
    w: 280,
    h: 300,
    roofHeight: 58,
    wallColor: '#36302a',
    trimColor: '#fbbf24',
    roofColor: '#201c18',
    accentColor: '#f59e0b',
    warmLights: true,
    doorX: 2700,
    doorY: 2755,
    signs: [
      {
        offsetX: 34,
        offsetY: 62,
        w: 212,
        h: 22,
        text: 'そば処 丘',
        color: '#fde68a',
        glowColor: 'rgba(251,191,36,0.55)',
      },
    ],
  },
  {
    id: 'house_hill_e',
    kind: 'house',
    name: 'East Hill House',
    jpLabel: '東の丘家',
    district: 'hills',
    x: 4200,
    y: 2500,
    w: 260,
    h: 220,
    roofHeight: 54,
    wallColor: '#2e3344',
    trimColor: '#94a3b8',
    roofColor: '#1e2436',
    accentColor: '#fde047',
    warmLights: true,
    signs: [],
  },
  {
    id: 'tea_house_hill',
    kind: 'cafe',
    name: 'Hilltop Tea House',
    jpLabel: '茶屋丘',
    district: 'hills',
    x: 3600,
    y: 2500,
    w: 280,
    h: 300,
    roofHeight: 60,
    wallColor: '#33302d',
    trimColor: '#fbbf24',
    roofColor: '#1d1a18',
    accentColor: '#fbbf24',
    warmLights: true,
    doorX: 3740,
    doorY: 2795,
    signs: [
      {
        offsetX: 36,
        offsetY: 66,
        w: 208,
        h: 22,
        text: '茶屋 丘 · TEA',
        color: '#fde68a',
        glowColor: 'rgba(251,191,36,0.5)',
      },
    ],
  },
  {
    id: 'shrine_hinode',
    kind: 'shrine',
    name: 'Hinode Inari Shrine',
    jpLabel: '日の出稲荷',
    district: 'hills',
    x: 3000,
    y: 3180,
    w: 220,
    h: 170,
    roofHeight: 56,
    wallColor: '#3b2427',
    trimColor: '#ef4444',
    roofColor: '#241a21',
    accentColor: '#f87171',
    warmLights: true,
    doorX: 3110,
    doorY: 3345,
    signs: [],
  },
  {
    id: 'cafe_hill',
    kind: 'cafe',
    name: 'Hill Breeze Cafe',
    jpLabel: '丘風カフェ',
    district: 'hills',
    x: 2560,
    y: 3200,
    w: 280,
    h: 280,
    roofHeight: 56,
    wallColor: '#2d2938',
    trimColor: '#38bdf8',
    roofColor: '#1b1926',
    accentColor: '#38bdf8',
    warmLights: true,
    doorX: 2700,
    doorY: 3475,
    signs: [
      {
        offsetX: 36,
        offsetY: 62,
        w: 208,
        h: 22,
        text: 'HILL CAFE',
        color: '#7dd3fc',
        glowColor: 'rgba(56,189,248,0.5)',
      },
    ],
  },
  {
    id: 'apt_hill_c',
    kind: 'apartment',
    name: 'Hinode Heights C',
    jpLabel: '日の出ヒルズ C',
    district: 'hills',
    x: 3600,
    y: 3200,
    w: 300,
    h: 280,
    roofHeight: 68,
    wallColor: '#24303e',
    trimColor: '#64748b',
    roofColor: '#151e29',
    accentColor: '#34d399',
    warmLights: true,
    signs: [],
  },
  {
    id: 'arcade_hill',
    kind: 'arcade',
    name: 'Hilltop Arcade',
    jpLabel: '丘のゲーム',
    district: 'hills',
    x: 4300,
    y: 3200,
    w: 280,
    h: 280,
    roofHeight: 64,
    wallColor: '#20263b',
    trimColor: '#facc15',
    roofColor: '#121728',
    accentColor: '#facc15',
    warmLights: true,
    doorX: 4440,
    doorY: 3475,
    signs: [
      {
        offsetX: 34,
        offsetY: 70,
        w: 212,
        h: 24,
        text: 'HILLTOP ARCADE',
        color: '#fde047',
        glowColor: 'rgba(250,204,21,0.6)',
        flicker: true,
      },
    ],
  },
];

export const PROPS: WorldProp[] = [
  // Street Lamps (warm amber pools along sidewalk edges)
  { id: 'lamp_konbini', kind: 'lamp', x: 1156, y: 1026, w: 16, h: 42, collides: true, lightColor: '#fbbf24', lightRadius: 175 },
  { id: 'lamp_main_1', kind: 'lamp', x: 740, y: 1026, w: 16, h: 42, collides: true, lightColor: '#fbbf24', lightRadius: 165 },
  { id: 'lamp_main_2', kind: 'lamp', x: 1380, y: 1026, w: 16, h: 42, collides: true, lightColor: '#fbbf24', lightRadius: 165 },
  { id: 'lamp_main_3', kind: 'lamp', x: 1660, y: 1026, w: 16, h: 42, collides: true, lightColor: '#38bdf8', lightRadius: 170 },
  { id: 'lamp_main_4', kind: 'lamp', x: 2260, y: 1026, w: 16, h: 42, collides: true, lightColor: '#f472b6', lightRadius: 170 },
  { id: 'lamp_main_5', kind: 'lamp', x: 850, y: 1276, w: 16, h: 42, collides: true, lightColor: '#fbbf24', lightRadius: 165 },
  { id: 'lamp_main_6', kind: 'lamp', x: 1360, y: 1276, w: 16, h: 42, collides: true, lightColor: '#fbbf24', lightRadius: 165 },
  { id: 'lamp_res_1', kind: 'lamp', x: 480, y: 400, w: 16, h: 42, collides: true, lightColor: '#fde68a', lightRadius: 160 },
  { id: 'lamp_res_2', kind: 'lamp', x: 1120, y: 400, w: 16, h: 42, collides: true, lightColor: '#fde68a', lightRadius: 160 },
  { id: 'lamp_ent_1', kind: 'lamp', x: 1960, y: 400, w: 16, h: 42, collides: true, lightColor: '#38bdf8', lightRadius: 175 },
  { id: 'lamp_ent_2', kind: 'lamp', x: 2290, y: 740, w: 16, h: 42, collides: true, lightColor: '#f472b6', lightRadius: 175 },
  { id: 'lamp_river_1', kind: 'lamp', x: 960, y: 1875, w: 16, h: 42, collides: true, lightColor: '#fbbf24', lightRadius: 170 },
  { id: 'lamp_river_2', kind: 'lamp', x: 1380, y: 1875, w: 16, h: 42, collides: true, lightColor: '#fbbf24', lightRadius: 170 },
  { id: 'lamp_river_3', kind: 'lamp', x: 1660, y: 1875, w: 16, h: 42, collides: true, lightColor: '#fbbf24', lightRadius: 170 },
  { id: 'lamp_park_1', kind: 'lamp', x: 1280, y: 2150, w: 16, h: 42, collides: true, lightColor: '#fde68a', lightRadius: 170 },
  { id: 'lamp_park_2', kind: 'lamp', x: 1780, y: 2150, w: 16, h: 42, collides: true, lightColor: '#fde68a', lightRadius: 170 },

  // Glowing Vending Machines
  { id: 'vending_konbini', kind: 'vending', x: 1236, y: 952, w: 32, h: 44, collides: true, lightColor: '#38bdf8', lightRadius: 115, label: 'Konbini Vending Machine' },
  { id: 'vending_res', kind: 'vending', x: 716, y: 310, w: 32, h: 44, collides: true, lightColor: '#7dd3fc', lightRadius: 115, label: 'Quiet Alley Vending Machine' },
  { id: 'vending_arcade', kind: 'vending', x: 2036, y: 316, w: 32, h: 44, collides: true, lightColor: '#f472b6', lightRadius: 115, label: 'Neon Energy Vending Machine' },
  { id: 'vending_river', kind: 'vending', x: 1120, y: 1700, w: 32, h: 44, collides: true, lightColor: '#38bdf8', lightRadius: 115, label: 'Riverside Warm Drink Machine' },

  // Benches (sittable!)
  { id: 'bench_river_1', kind: 'bench', x: 1020, y: 1894, w: 56, h: 24, collides: true, facing: 'down' },
  { id: 'bench_river_2', kind: 'bench', x: 1260, y: 1894, w: 56, h: 24, collides: true, facing: 'down' },
  { id: 'bench_park_1', kind: 'bench', x: 1320, y: 2180, w: 56, h: 24, collides: true, facing: 'up' },
  { id: 'bench_park_2', kind: 'bench', x: 1700, y: 2180, w: 56, h: 24, collides: true, facing: 'up' },
  { id: 'bench_konbini', kind: 'bench', x: 775, y: 1070, w: 56, h: 24, collides: true, facing: 'down' },

  // Traffic Lights at major intersections
  { id: 'tl_main_1', kind: 'traffic_light', x: 1424, y: 1036, w: 18, h: 44, collides: true },
  { id: 'tl_main_2', kind: 'traffic_light', x: 1620, y: 1272, w: 18, h: 44, collides: true },
  { id: 'tl_west_1', kind: 'traffic_light', x: 528, y: 1036, w: 18, h: 44, collides: true },
  { id: 'tl_east_1', kind: 'traffic_light', x: 2324, y: 1036, w: 18, h: 44, collides: true },

  // Manholes (steam rises from these!)
  { id: 'manhole_1', kind: 'manhole', x: 960, y: 1188, w: 28, h: 20, collides: false },
  { id: 'manhole_2', kind: 'manhole', x: 1532, y: 840, w: 28, h: 20, collides: false },
  { id: 'manhole_3', kind: 'manhole', x: 2120, y: 1190, w: 28, h: 20, collides: false },
  { id: 'manhole_4', kind: 'manhole', x: 1280, y: 1812, w: 28, h: 20, collides: false },
  { id: 'manhole_5', kind: 'manhole', x: 620, y: 500, w: 28, h: 20, collides: false },

  // Parked Bicycles (Residential & Sidewalks)
  { id: 'bike_res_1', kind: 'bicycle', x: 472, y: 310, w: 34, h: 20, collides: true },
  { id: 'bike_res_2', kind: 'bicycle', x: 472, y: 336, w: 34, h: 20, collides: true },
  { id: 'bike_konbini', kind: 'bicycle', x: 816, y: 942, w: 34, h: 20, collides: true },
  { id: 'bike_book', kind: 'bicycle', x: 1368, y: 1500, w: 34, h: 20, collides: true },
  { id: 'bike_konbini_2', kind: 'bicycle', x: 1150, y: 1000, w: 34, h: 20, collides: true },
  { id: 'bike_apt_c', kind: 'bicycle', x: 360, y: 1000, w: 34, h: 20, collides: true },
  { id: 'bike_cafe', kind: 'bicycle', x: 398, y: 1490, w: 34, h: 20, collides: true },

  // Konbini block dressing: planters, crates, signage, vending, and curb bollards
  { id: 'planter_konbini_w', kind: 'planter', x: 846, y: 992, w: 30, h: 34, collides: true },
  { id: 'planter_konbini_e', kind: 'planter', x: 1328, y: 992, w: 30, h: 34, collides: true },
  { id: 'crate_konbini_1', kind: 'crate', x: 1204, y: 994, w: 24, h: 24, collides: true },
  { id: 'crate_konbini_2', kind: 'crate', x: 1232, y: 1004, w: 24, h: 24, collides: true },
  { id: 'sign_pole_konbini', kind: 'sign_pole', x: 828, y: 1028, w: 18, h: 66, collides: true, label: 'Station Front' },
  { id: 'vending_konbini_2', kind: 'vending', x: 1290, y: 1002, w: 32, h: 44, collides: true, lightColor: '#f472b6', lightRadius: 110, label: 'Late-Night Snack Machine' },
  { id: 'bollard_konbini_1', kind: 'bollard', x: 878, y: 1100, w: 10, h: 18, collides: true },
  { id: 'bollard_konbini_2', kind: 'bollard', x: 974, y: 1100, w: 10, h: 18, collides: true },
  { id: 'bollard_konbini_3', kind: 'bollard', x: 1070, y: 1100, w: 10, h: 18, collides: true },
  { id: 'bollard_konbini_4', kind: 'bollard', x: 1166, y: 1100, w: 10, h: 18, collides: true },
  { id: 'bollard_konbini_5', kind: 'bollard', x: 1214, y: 1100, w: 10, h: 18, collides: true },

  // Street-level city furniture and parked vehicles
  { id: 'car_main_silver', kind: 'car', x: 1320, y: 1148, w: 72, h: 30, collides: true },
  { id: 'car_main_blue', kind: 'car', x: 1780, y: 1208, w: 72, h: 30, collides: true },
  { id: 'cone_main_1', kind: 'traffic_cone', x: 1388, y: 1168, w: 14, h: 18, collides: false },
  { id: 'cone_main_2', kind: 'traffic_cone', x: 1708, y: 1178, w: 14, h: 18, collides: false },
  { id: 'cone_neon_1', kind: 'traffic_cone', x: 2410, y: 1188, w: 14, h: 18, collides: false },
  { id: 'dumpster_karaoke', kind: 'dumpster', x: 1352, y: 990, w: 42, h: 30, collides: true },
  { id: 'potted_cafe_1', kind: 'potted_plant', x: 172, y: 1508, w: 24, h: 30, collides: true },
  { id: 'potted_cafe_2', kind: 'potted_plant', x: 344, y: 1508, w: 24, h: 30, collides: true },
  { id: 'sign_pole_neon', kind: 'sign_pole', x: 2288, y: 900, w: 18, h: 66, collides: true, label: 'Neon Quarter' },
  { id: 'pole_5', kind: 'utility_pole', x: 500, y: 900, w: 14, h: 52, collides: true },
  { id: 'pole_6', kind: 'utility_pole', x: 2540, y: 900, w: 14, h: 52, collides: true },

  // Wall-mounted equipment on representative facades (non-blocking dressing)
  { id: 'ac_karaoke_1', kind: 'ac_unit', x: 1224, y: 936, w: 24, h: 18, collides: false },
  { id: 'ac_karaoke_2', kind: 'ac_unit', x: 1322, y: 936, w: 24, h: 18, collides: false },
  { id: 'ac_pachinko', kind: 'ac_unit', x: 1800, y: 1004, w: 24, h: 18, collides: false },
  { id: 'ac_konbini', kind: 'ac_unit', x: 1048, y: 954, w: 24, h: 18, collides: false },
  { id: 'vent_cafe', kind: 'vent', x: 330, y: 1508, w: 18, h: 24, collides: false },

  // Phone Booth in Entertainment Quarter
  { id: 'phone_booth_ent', kind: 'phone_booth', x: 2274, y: 580, w: 34, h: 44, collides: true, lightColor: '#22d3ee', lightRadius: 105 },

  // Gas Pumps under AME OIL canopy
  { id: 'gas_pump_1', kind: 'gas_pump', x: 2040, y: 1528, w: 28, h: 36, collides: true, lightColor: '#34d399', lightRadius: 110 },
  { id: 'gas_pump_2', kind: 'gas_pump', x: 2160, y: 1528, w: 28, h: 36, collides: true, lightColor: '#34d399', lightRadius: 110 },

  // Stone Lanterns at Shrine
  { id: 'shrine_lantern_1', kind: 'shrine_lantern', x: 1930, y: 2296, w: 22, h: 34, collides: true, lightColor: '#fb923c', lightRadius: 115 },
  { id: 'shrine_lantern_2', kind: 'shrine_lantern', x: 2180, y: 2296, w: 22, h: 34, collides: true, lightColor: '#fb923c', lightRadius: 115 },

  // Park & Street Trees
  { id: 'tree_1', kind: 'tree', x: 860, y: 1882, w: 48, h: 56, collides: true },
  { id: 'tree_2', kind: 'tree', x: 1140, y: 1882, w: 48, h: 56, collides: true },
  { id: 'tree_3', kind: 'tree', x: 1760, y: 1882, w: 48, h: 56, collides: true },
  { id: 'tree_4', kind: 'tree', x: 1210, y: 2160, w: 54, h: 62, collides: true },
  { id: 'tree_5', kind: 'tree', x: 1830, y: 2160, w: 54, h: 62, collides: true },
  { id: 'tree_6', kind: 'tree', x: 1230, y: 2300, w: 54, h: 62, collides: true },
  { id: 'tree_7', kind: 'tree', x: 1820, y: 2300, w: 54, h: 62, collides: true },
  { id: 'tree_8', kind: 'tree', x: 400, y: 340, w: 48, h: 56, collides: true },
  { id: 'tree_9', kind: 'tree', x: 1130, y: 630, w: 48, h: 56, collides: true },

  // Utility Poles
  { id: 'pole_1', kind: 'utility_pole', x: 500, y: 580, w: 14, h: 52, collides: true },
  { id: 'pole_2', kind: 'utility_pole', x: 700, y: 580, w: 14, h: 52, collides: true },
  { id: 'pole_3', kind: 'utility_pole', x: 1400, y: 580, w: 14, h: 52, collides: true },
  { id: 'pole_4', kind: 'utility_pole', x: 2510, y: 580, w: 14, h: 52, collides: true },

  // === Minato Market Row hand dressing ===
  { id: 'vending_market_1', kind: 'vending', x: 3568, y: 1300, w: 32, h: 44, collides: true, lightColor: '#38bdf8', lightRadius: 115, label: 'Market Drink Machine' },
  { id: 'vending_market_2', kind: 'vending', x: 4310, y: 1300, w: 32, h: 44, collides: true, lightColor: '#f472b6', lightRadius: 115, label: 'Harbor Snack Machine' },
  { id: 'bench_market_1', kind: 'bench', x: 3300, y: 1330, w: 56, h: 24, collides: true, facing: 'down' },
  { id: 'bench_market_2', kind: 'bench', x: 4100, y: 1330, w: 56, h: 24, collides: true, facing: 'down' },
  { id: 'phone_booth_market', kind: 'phone_booth', x: 3650, y: 1330, w: 34, h: 44, collides: true, lightColor: '#22d3ee', lightRadius: 105 },
  { id: 'car_market_1', kind: 'car', x: 3300, y: 1480, w: 72, h: 30, collides: true },
  { id: 'car_market_2', kind: 'car', x: 3950, y: 1490, w: 72, h: 30, collides: true },
  { id: 'car_market_3', kind: 'car', x: 4600, y: 1480, w: 72, h: 30, collides: true },
  { id: 'dumpster_market', kind: 'dumpster', x: 4480, y: 1320, w: 42, h: 30, collides: true },
  { id: 'crate_market_1', kind: 'crate', x: 3580, y: 1340, w: 24, h: 24, collides: true },
  { id: 'crate_market_2', kind: 'crate', x: 3606, y: 1350, w: 24, h: 24, collides: true },
  { id: 'planter_market_1', kind: 'planter', x: 3240, y: 400, w: 30, h: 34, collides: true },
  { id: 'planter_market_2', kind: 'planter', x: 4700, y: 400, w: 30, h: 34, collides: true },
  { id: 'sign_pole_market', kind: 'sign_pole', x: 3520, y: 1420, w: 18, h: 66, collides: true, label: 'Minato Market' },
  { id: 'sign_pole_harbor', kind: 'sign_pole', x: 4520, y: 1420, w: 18, h: 66, collides: true, label: 'Harbor Rd' },
  { id: 'tl_market_1', kind: 'traffic_light', x: 3524, y: 1410, w: 18, h: 44, collides: true },
  { id: 'tl_market_2', kind: 'traffic_light', x: 4496, y: 1410, w: 18, h: 44, collides: true },
  { id: 'tree_market_1', kind: 'tree', x: 4730, y: 1900, w: 48, h: 56, collides: true },
  { id: 'tree_market_2', kind: 'tree', x: 3260, y: 1900, w: 48, h: 56, collides: true },
  { id: 'pole_market_1', kind: 'utility_pole', x: 3400, y: 700, w: 14, h: 52, collides: true },
  { id: 'pole_market_2', kind: 'utility_pole', x: 4700, y: 900, w: 14, h: 52, collides: true },
  { id: 'manhole_market_1', kind: 'manhole', x: 3800, y: 1180, w: 28, h: 20, collides: false },
  { id: 'manhole_market_2', kind: 'manhole', x: 4600, y: 1180, w: 28, h: 20, collides: false },

  // === Hinode Hill hand dressing ===
  { id: 'vending_hill_1', kind: 'vending', x: 1700, y: 2500, w: 32, h: 44, collides: true, lightColor: '#38bdf8', lightRadius: 115, label: 'Hilltop Drink Machine' },
  { id: 'vending_hill_2', kind: 'vending', x: 2900, y: 3100, w: 32, h: 44, collides: true, lightColor: '#fbbf24', lightRadius: 115, label: 'Park Snack Machine' },
  { id: 'bench_hill_1', kind: 'bench', x: 1900, y: 2830, w: 56, h: 24, collides: true, facing: 'up' },
  { id: 'bench_hill_2', kind: 'bench', x: 3050, y: 2830, w: 56, h: 24, collides: true, facing: 'up' },
  { id: 'bench_hill_3', kind: 'bench', x: 1500, y: 3100, w: 56, h: 24, collides: true, facing: 'down' },
  { id: 'car_hill_1', kind: 'car', x: 1700, y: 2940, w: 72, h: 30, collides: true },
  { id: 'car_hill_2', kind: 'car', x: 2800, y: 2950, w: 72, h: 30, collides: true },
  { id: 'car_hill_3', kind: 'car', x: 3900, y: 2940, w: 72, h: 30, collides: true },
  { id: 'shrine_lantern_h1', kind: 'shrine_lantern', x: 2930, y: 3320, w: 22, h: 34, collides: true, lightColor: '#fb923c', lightRadius: 115 },
  { id: 'shrine_lantern_h2', kind: 'shrine_lantern', x: 3220, y: 3320, w: 22, h: 34, collides: true, lightColor: '#fb923c', lightRadius: 115 },
  { id: 'tl_hill_1', kind: 'traffic_light', x: 1420, y: 2860, w: 18, h: 44, collides: true },
  { id: 'tl_hill_2', kind: 'traffic_light', x: 2320, y: 2860, w: 18, h: 44, collides: true },
  { id: 'tl_hill_3', kind: 'traffic_light', x: 3320, y: 2860, w: 18, h: 44, collides: true },
  { id: 'sign_pole_hill', kind: 'sign_pole', x: 1500, y: 3060, w: 18, h: 66, collides: true, label: 'Hinode Park' },
  { id: 'manhole_hill_1', kind: 'manhole', x: 2200, y: 2950, w: 28, h: 20, collides: false },
  { id: 'manhole_hill_2', kind: 'manhole', x: 3800, y: 2950, w: 28, h: 20, collides: false },
  { id: 'pole_hill_1', kind: 'utility_pole', x: 2000, y: 2600, w: 14, h: 52, collides: true },
  { id: 'pole_hill_2', kind: 'utility_pole', x: 3700, y: 2600, w: 14, h: 52, collides: true },
  { id: 'dumpster_hill', kind: 'dumpster', x: 1180, y: 2500, w: 42, h: 30, collides: true },
  { id: 'crate_hill_1', kind: 'crate', x: 2580, y: 2500, w: 24, h: 24, collides: true },
  { id: 'planter_hill_1', kind: 'planter', x: 3060, y: 2500, w: 30, h: 34, collides: true },
  { id: 'potted_hill_1', kind: 'potted_plant', x: 2780, y: 3490, w: 24, h: 30, collides: true },
  { id: 'bicycle_hill_1', kind: 'bicycle', x: 1740, y: 2800, w: 34, h: 20, collides: true },
  { id: 'bicycle_hill_2', kind: 'bicycle', x: 3720, y: 2800, w: 34, h: 20, collides: true },
];

// Deterministic seeded scatter of street furniture across the expanded city.
// Keeps the new districts inhabited without hand-placing every lamp and cone.
PROPS.push(...generateCityProps());

export const PUDDLES: Puddle[] = [
  { x: 1030, y: 1185, rx: 46, ry: 22, tint: '#22d3ee' },
  { x: 1180, y: 1142, rx: 34, ry: 16, tint: '#fbbf24' },
  { x: 880, y: 1222, rx: 38, ry: 18, tint: '#fb923c' },
  { x: 1525, y: 1180, rx: 52, ry: 26, tint: '#38bdf8' },
  { x: 1850, y: 500, rx: 48, ry: 22, tint: '#f472b6' },
  { x: 2150, y: 510, rx: 44, ry: 20, tint: '#38bdf8' },
  { x: 1960, y: 1185, rx: 50, ry: 24, tint: '#f472b6' },
  { x: 2420, y: 820, rx: 36, ry: 28, tint: '#fde047' },
  { x: 618, y: 780, rx: 34, ry: 24, tint: '#fde68a' },
  { x: 1520, y: 2030, rx: 42, ry: 22, tint: '#fbbf24' },
  { x: 2110, y: 1670, rx: 44, ry: 20, tint: '#34d399' },
  { x: 1160, y: 1815, rx: 42, ry: 18, tint: '#38bdf8' },
  // Minato Market Row
  { x: 3400, y: 1180, rx: 46, ry: 22, tint: '#38bdf8' },
  { x: 4100, y: 900, rx: 40, ry: 20, tint: '#f472b6' },
  { x: 4650, y: 1500, rx: 44, ry: 20, tint: '#67e8f9' },
  { x: 3300, y: 700, rx: 38, ry: 18, tint: '#fbbf24' },
  { x: 3900, y: 1600, rx: 42, ry: 20, tint: '#fb923c' },
  // Hinode Hill Park
  { x: 900, y: 2700, rx: 48, ry: 24, tint: '#38bdf8' },
  { x: 2100, y: 3300, rx: 44, ry: 22, tint: '#fbbf24' },
  { x: 3100, y: 3400, rx: 46, ry: 22, tint: '#34d399' },
  { x: 4200, y: 2700, rx: 42, ry: 20, tint: '#a78bfa' },
  { x: 700, y: 3350, rx: 40, ry: 20, tint: '#7dd3fc' },
  { x: 4600, y: 3400, rx: 44, ry: 22, tint: '#fbbf24' },
];

export const INTERACTABLES: Interactable[] = [
  // Vending machines
  {
    id: 'int_vending_konbini',
    kind: 'vending',
    x: 1252,
    y: 992,
    radius: 44,
    prompt: 'Use Vending Machine',
    title: 'Boss Rainy Roast · Hot Coffee',
    description: 'You press the warm amber button. A steaming aluminum can drops into the tray with a metallic clink—sweet espresso warmth in the 2 AM chill.',
    sfx: 'vending',
  },
  {
    id: 'int_vending_res',
    kind: 'vending',
    x: 732,
    y: 350,
    radius: 44,
    prompt: 'Use Vending Machine',
    title: 'Warm Yuzu Honey Tea',
    description: 'The fluorescent panel hums softly against the apartment wall. Citrus steam curls into the drizzle as you hold the warm bottle.',
    sfx: 'vending',
  },
  {
    id: 'int_vending_arcade',
    kind: 'vending',
    x: 2052,
    y: 356,
    radius: 44,
    prompt: 'Use Vending Machine',
    title: 'Midnight Ramune Soda',
    description: 'Neon pink reflects off the glass front. You pop the marble seal—crisp soda fizz competes with the steady hiss of the rain.',
    sfx: 'vending',
  },
  {
    id: 'int_vending_river',
    kind: 'vending',
    x: 1136,
    y: 1740,
    radius: 44,
    prompt: 'Use Vending Machine',
    title: 'Hot Corn Soup',
    description: 'A classic late-night riverside comfort. The glowing blue machine illuminates the damp curb beside the canal.',
    sfx: 'vending',
  },

  // Benches
  {
    id: 'int_bench_river_1',
    kind: 'bench',
    x: 1048,
    y: 1906,
    radius: 42,
    prompt: 'Sit by the Canal',
    title: 'Canal-side Bench',
    description: 'Raindrops stitch silver rings across the dark canal water while distant amber streetlamps ripple below.',
    facing: 'down',
    seatOffset: { x: 0, y: -4 },
    sfx: 'bench',
  },
  {
    id: 'int_bench_river_2',
    kind: 'bench',
    x: 1288,
    y: 1906,
    radius: 42,
    prompt: 'Sit by the Canal',
    title: 'Bridge Overlook Bench',
    description: 'From here you can watch the arched bridge lights shimmer across the wet stone embankment.',
    facing: 'down',
    seatOffset: { x: 0, y: -4 },
    sfx: 'bench',
  },
  {
    id: 'int_bench_park_1',
    kind: 'bench',
    x: 1348,
    y: 2192,
    radius: 42,
    prompt: 'Sit in Quiet Park',
    title: 'Willow Park Bench',
    description: 'Leaves overhead catch the drizzle. Your headphones leak a quiet lo-fi chord progression into the night air.',
    facing: 'up',
    seatOffset: { x: 0, y: -4 },
    sfx: 'bench',
  },
  {
    id: 'int_bench_park_2',
    kind: 'bench',
    x: 1728,
    y: 2192,
    radius: 42,
    prompt: 'Sit in Quiet Park',
    title: 'East Park Bench',
    description: 'The city traffic fades to a distant whisper here, leaving only the rhythm of rain on pavement.',
    facing: 'up',
    seatOffset: { x: 0, y: -4 },
    sfx: 'bench',
  },
  {
    id: 'int_bench_konbini',
    kind: 'bench',
    x: 803,
    y: 1082,
    radius: 42,
    prompt: 'Sit outside Konbini',
    title: 'Station Front Bench',
    description: 'You rest beneath the konbini awning overhang, watching neon streaks blur across Main Street.',
    facing: 'down',
    seatOffset: { x: 0, y: -4 },
    sfx: 'bench',
  },

  // Shops & Locations
  {
    id: 'int_konbini',
    kind: 'shop',
    x: 1000,
    y: 985,
    radius: 52,
    prompt: 'Enter AME-MART 24H',
    title: 'AME-MART 24H Konbini',
    description: 'Automatic glass doors slide open with a gentle chime. Inside: rows of warm oden simmering behind glass, onigiri, umbrellas, and fluorescent warmth at 2:10 AM.',
    sfx: 'shop',
  },
  {
    id: 'int_ramen',
    kind: 'shop',
    x: 320,
    y: 1030,
    radius: 50,
    prompt: 'Visit Ichiban Ramen',
    title: 'Yoru Ichiban Ramen',
    description: 'A red noren curtain sways in the damp breeze. Broth steam fogs the narrow window while a solo late-shift cook tends the counter.',
    sfx: 'shop',
  },
  {
    id: 'int_cafe',
    kind: 'shop',
    x: 895,
    y: 1550,
    radius: 50,
    prompt: 'Peek into Kissaten Tsuki',
    title: 'Kissaten Tsuki (Late-Night Jazz)',
    description: 'Amber Edison bulbs glow over mahogany booths and a quiet espresso bar—still brewing siphon coffee for night owls.',
    sfx: 'shop',
  },
  {
    id: 'int_arcade',
    kind: 'shop',
    x: 1860,
    y: 365,
    radius: 54,
    prompt: 'Enter AME-CADE 24H',
    title: 'AME-CADE 24H',
    description: 'CRT cabinets cast magenta and cyan across the carpeted floor. Synth attract-mode melodies echo faintly out onto the wet plaza.',
    sfx: 'shop',
  },
  {
    id: 'int_izakaya',
    kind: 'shop',
    x: 1840,
    y: 882,
    radius: 50,
    prompt: 'Visit Izakaya Akari',
    title: 'Izakaya Akari',
    description: 'Paper lanterns drip softly with rain. Warm charcoal yakitori smoke drifts from the shuttered side vent.',
    sfx: 'shop',
  },
  {
    id: 'int_phone_booth',
    kind: 'phone_booth',
    x: 2291,
    y: 626,
    radius: 44,
    prompt: 'Inspect Phone Booth',
    title: 'Emerald Payphone Booth',
    description: 'A nostalgic green-framed phone booth lit from within. Rain patters on its glass roof like a tiny shelter in the neon district.',
    sfx: 'chime',
  },
  {
    id: 'int_gas_station',
    kind: 'gas_pump',
    x: 2100,
    y: 1570,
    radius: 64,
    prompt: 'Check Gas Station',
    title: 'AME OIL · Self-Service 24H',
    description: 'Bright white canopy LEDs turn the rain into silver needles. Your green sportbike still has plenty of fuel for a midnight cruise.',
    sfx: 'chime',
  },
  {
    id: 'int_shrine',
    kind: 'shrine',
    x: 2065,
    y: 2315,
    radius: 54,
    prompt: 'Visit Kawa Inari Shrine',
    title: 'Kawa Inari Shrine',
    description: 'Stone lanterns flank a crimson torii gate. You bow quietly as rain taps the cedar eaves—peaceful and timeless.',
    sfx: 'chime',
  },
  {
    id: 'int_market_hall',
    kind: 'shop',
    x: 3350,
    y: 385,
    radius: 54,
    prompt: 'Browse Minato Market',
    title: 'Minato Central Market',
    description: 'Steam rises from fish crates and pickled stalls. The market master waves you toward the warm oden corner before the last train home.',
    sfx: 'shop',
  },
  {
    id: 'int_minato_ramen',
    kind: 'shop',
    x: 3350,
    y: 945,
    radius: 50,
    prompt: 'Visit Minato Ramen',
    title: 'Minato Ramen Dojo',
    description: 'A chalkboard lists tonkotsu and shoyu. Rain drums the awning while the kitchen roars behind the counter.',
    sfx: 'shop',
  },
  {
    id: 'int_konbini_minato',
    kind: 'shop',
    x: 4640,
    y: 945,
    radius: 52,
    prompt: 'Enter Minato Mart',
    title: 'Minato Mart 24H',
    description: 'The harbor konbini glows cyan against the fog. Onigiri, umbrellas, and hot cans line the heated cases.',
    sfx: 'shop',
  },
  {
    id: 'int_vending_market',
    kind: 'vending',
    x: 3584,
    y: 1340,
    radius: 44,
    prompt: 'Use Vending Machine',
    title: 'Harbor Cola · Ice Cold',
    description: 'A frosted can clatters into the tray under the market awning, condensation beading in the humid air.',
    sfx: 'vending',
  },
  {
    id: 'int_bench_market',
    kind: 'bench',
    x: 3328,
    y: 1342,
    radius: 42,
    prompt: 'Sit at Harbor Rd',
    title: 'Harbor Road Bench',
    description: 'Trucks rumble past on the wet asphalt while neon from the market spills across the puddles.',
    facing: 'down',
    seatOffset: { x: 0, y: -4 },
    sfx: 'bench',
  },
  {
    id: 'int_shrine_hinode',
    kind: 'shrine',
    x: 3110,
    y: 3350,
    radius: 54,
    prompt: 'Visit Hinode Shrine',
    title: 'Hinode Inari Shrine',
    description: 'A small hilltop shrine above the park. Fox statues watch the rain, and the city lights glitter far below.',
    sfx: 'chime',
  },
  {
    id: 'int_vending_hill',
    kind: 'vending',
    x: 1716,
    y: 2540,
    radius: 44,
    prompt: 'Use Vending Machine',
    title: 'Hilltop Hot Cocoa',
    description: 'Warm cocoa steams against the hill chill as you lean on the park railing.',
    sfx: 'vending',
  },
  {
    id: 'int_bench_hill',
    kind: 'bench',
    x: 1928,
    y: 2842,
    radius: 42,
    prompt: 'Sit in the Park',
    title: 'Hinode Park Bench',
    description: 'Fireflies of neon reflect off the pond while the hill park sleeps under the rain.',
    facing: 'up',
    seatOffset: { x: 0, y: -4 },
    sfx: 'bench',
  },
];

export function buildStaticColliders(): Rect[] {
  const colliders: Rect[] = [];

  for (const b of BUILDINGS) {
    // Slightly inset top roof overhang so 3/4 top-down perspective feels natural when walking behind roofs
    colliders.push({
      x: b.x + 6,
      y: b.y + Math.floor(b.roofHeight * 0.45),
      w: b.w - 12,
      h: b.h - Math.floor(b.roofHeight * 0.45),
    });
  }

  for (const p of PROPS) {
    if (!p.collides) continue;
    // Footprint collision at base of prop
    colliders.push({
      x: p.x + 2,
      y: p.y + Math.floor(p.h * 0.45),
      w: Math.max(10, p.w - 4),
      h: Math.max(10, Math.floor(p.h * 0.55)),
    });
  }

  // Canal banks — impassable water except at bridge decks
  const sortedBridges = [...CANAL_BRIDGES].sort((a, b) => a.x - b.x);
  let cursor = 0;
  for (const bridge of sortedBridges) {
    if (bridge.x > cursor) {
      colliders.push({
        x: cursor,
        y: CANAL_RECT.y + 8,
        w: bridge.x - cursor,
        h: CANAL_RECT.h - 16,
      });
    }
    cursor = Math.max(cursor, bridge.x + bridge.w);
  }
  if (cursor < WORLD_WIDTH) {
    colliders.push({
      x: cursor,
      y: CANAL_RECT.y + 8,
      w: WORLD_WIDTH - cursor,
      h: CANAL_RECT.h - 16,
    });
  }

  return colliders;
}

export function getDistrictAtPosition(x: number, y: number): DistrictZone {
  if (y >= 2400) {
    return DISTRICTS[5]; // Hinode Hill Park
  }
  if (x >= 3200 && y < 1760) {
    return DISTRICTS[4]; // Minato Market Row
  }
  if (y >= 1760) {
    return DISTRICTS[3]; // quiet
  }
  if (x >= 1600 && y >= 1180) {
    // Gas station / South-east transition feels quiet or commercial
    return y >= 1320 ? DISTRICTS[3] : DISTRICTS[2];
  }
  for (const d of DISTRICTS) {
    if (
      x >= d.rect.x &&
      x <= d.rect.x + d.rect.w &&
      y >= d.rect.y &&
      y <= d.rect.y + d.rect.h
    ) {
      return d;
    }
  }
  return DISTRICTS[2];
}

export function isOnRoad(x: number, y: number): boolean {
  for (const r of ROADS) {
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      return true;
    }
  }
  return false;
}

export function getDistrictLabelById(id: DistrictId): { name: string; jp: string } {
  const found = DISTRICTS.find((d) => d.id === id);
  return found ? { name: found.name, jp: found.jpName } : { name: 'Ameyo', jp: '雨夜' };
}

// ---------------------------------------------------------------------------
// Deterministic city-prop generator (seeded scatter for the expanded world)
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
  pad = 0
): boolean {
  return ax - pad < bx + bw && ax + aw + pad > bx && ay - pad < by + bh && ay + ah + pad > by;
}

function insideAnyRect(x: number, y: number, rects: Rect[], pad = 0): boolean {
  return rects.some((r) => rectsOverlap(x, y, 1, 1, r.x, r.y, r.w, r.h, pad));
}

function generateCityProps(): WorldProp[] {
  const rng = mulberry32(20261117);
  const props: WorldProp[] = [];
  const placed: Rect[] = [];
  let seq = 0;

  const overlapsBuilding = (x: number, y: number, w: number, h: number, pad: number): boolean => {
    for (const b of BUILDINGS) {
      if (rectsOverlap(x, y, w, h, b.x - pad, b.y - pad, b.w + pad * 2, b.h + pad * 2)) return true;
    }
    return false;
  };
  const overlapsRoad = (x: number, y: number, w: number, h: number, pad: number): boolean => {
    for (const r of ROADS) {
      if (rectsOverlap(x, y, w, h, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2)) return true;
    }
    return false;
  };
  const overlapsPlaced = (x: number, y: number, w: number, h: number, pad: number): boolean => {
    for (const r of placed) {
      if (rectsOverlap(x, y, w, h, r.x - pad, r.y - pad, r.w + pad * 2, r.h + pad * 2)) return true;
    }
    return false;
  };
  const inCanal = (x: number, y: number, w: number, h: number): boolean => {
    return rectsOverlap(x, y, w, h, CANAL_RECT.x, CANAL_RECT.y, CANAL_RECT.w, CANAL_RECT.h, 4);
  };
  const freeSpot = (x: number, y: number, w: number, h: number, pad = 6): boolean => {
    if (x < 8 || y < 8 || x + w > WORLD_WIDTH - 8 || y + h > WORLD_HEIGHT - 8) return false;
    if (inCanal(x, y, w, h)) return false;
    if (overlapsBuilding(x, y, w, h, pad)) return false;
    if (overlapsPlaced(x, y, w, h, 2)) return false;
    return true;
  };
  const reserve = (x: number, y: number, w: number, h: number) => {
    placed.push({ x, y, w, h });
  };
  const addProp = (
    kind: PropKind,
    x: number,
    y: number,
    w: number,
    h: number,
    opts: Partial<WorldProp> = {}
  ): void => {
    props.push({ id: `gen_${kind}_${seq++}`, kind, x: Math.round(x), y: Math.round(y), w, h, collides: opts.collides ?? true, ...opts });
    reserve(x, y, w, h);
  };

  // --- Lamps along every road edge (skipping intersections/buildings) ---
  const lampColors = ['#fbbf24', '#fde68a', '#38bdf8', '#f472b6', '#34d399'];
  for (const road of ROADS) {
    const horizontal = road.axis === 'h';
    const length = horizontal ? road.w : road.h;
    for (let d = 60; d < length - 40; d += 210) {
      for (const side of [-1, 1]) {
        const lx = horizontal ? road.x + d : side < 0 ? road.x - 30 : road.x + road.w + 14;
        const ly = horizontal ? side < 0 ? road.y - 30 : road.y + road.h + 14 : road.y + d;
        if (!freeSpot(lx, ly, 16, 42, 10)) continue;
        if (overlapsRoad(lx, ly, 16, 42, 2)) continue;
        addProp('lamp', lx, ly, 16, 42, {
          lightColor: lampColors[Math.floor(rng() * lampColors.length)],
          lightRadius: 150 + Math.floor(rng() * 40),
        });
      }
    }
  }

  // --- Parked cars along road surfaces ---
  const carColors = ['#94a3b8', '#475569', '#1e293b', '#7c2d12', '#1e3a5f', '#3f3f46'];
  void carColors;
  for (let i = 0; i < 26; i++) {
    const road = ROADS[Math.floor(rng() * ROADS.length)];
    const horizontal = road.axis === 'h';
    const length = horizontal ? road.w : road.h;
    const d = 40 + rng() * (length - 120);
    const lane = rng() < 0.5 ? 0.28 : 0.68;
    const cx = horizontal ? road.x + d : road.x + road.w * lane - 18;
    const cy = horizontal ? road.y + road.h * lane - 15 : road.y + d;
    if (!freeSpot(cx, cy, 72, 30, 4)) continue;
    if (overlapsBuilding(cx, cy, 72, 30, 4)) continue;
    addProp('car', cx, cy, 72, 30, { lightColor: undefined });
  }

  // --- Trees: dense in the hills park, sparse along streets ---
  for (let i = 0; i < 90; i++) {
    const hillsBias = rng() < 0.72;
    const x = 30 + rng() * (WORLD_WIDTH - 90);
    const y = hillsBias ? 2150 + rng() * (WORLD_HEIGHT - 2250) : 300 + rng() * 1500;
    const w = 46 + Math.floor(rng() * 14);
    const h = 54 + Math.floor(rng() * 12);
    if (!freeSpot(x, y, w, h, 8)) continue;
    if (overlapsRoad(x, y, w, h, 6)) continue;
    addProp('tree', x, y, w, h);
  }

  // --- Street clutter scatter (vending, benches, planters, crates, etc.) ---
  const clutter: Array<{ kind: PropKind; w: number; h: number; count: number; collides?: boolean; light?: boolean }> = [
    { kind: 'vending', w: 32, h: 44, count: 14, light: true },
    { kind: 'bench', w: 56, h: 24, count: 10 },
    { kind: 'planter', w: 30, h: 34, count: 16 },
    { kind: 'crate', w: 24, h: 24, count: 14 },
    { kind: 'dumpster', w: 42, h: 30, count: 8 },
    { kind: 'traffic_cone', w: 14, h: 18, count: 22, collides: false },
    { kind: 'bollard', w: 10, h: 18, count: 24 },
    { kind: 'potted_plant', w: 24, h: 30, count: 14 },
    { kind: 'bicycle', w: 34, h: 20, count: 12 },
    { kind: 'ac_unit', w: 24, h: 18, count: 18, collides: false },
    { kind: 'vent', w: 18, h: 24, count: 12, collides: false },
    { kind: 'sign_pole', w: 18, h: 66, count: 8 },
    { kind: 'utility_pole', w: 14, h: 52, count: 10 },
    { kind: 'manhole', w: 28, h: 20, count: 14, collides: false },
  ];
  const lightPalette = ['#38bdf8', '#f472b6', '#fbbf24', '#34d399', '#a78bfa'];
  for (const item of clutter) {
    for (let i = 0; i < item.count; i++) {
      let placedOk = false;
      for (let attempt = 0; attempt < 30 && !placedOk; attempt++) {
        const x = 30 + rng() * (WORLD_WIDTH - 90);
        const y = 260 + rng() * (WORLD_HEIGHT - 420);
        if (!freeSpot(x, y, item.w, item.h, item.kind === 'utility_pole' ? 10 : 6)) continue;
        if (item.kind !== 'manhole' && overlapsRoad(x, y, item.w, item.h, 3)) continue;
        if (item.kind === 'manhole' && !insideAnyRect(x, y, ROADS.map((r) => ({ x: r.x, y: r.y, w: r.w, h: r.h })), 4)) continue;
        addProp(item.kind, x, y, item.w, item.h, {
          collides: item.collides ?? true,
          lightColor: item.light ? lightPalette[Math.floor(rng() * lightPalette.length)] : undefined,
          lightRadius: item.light ? 105 + Math.floor(rng() * 20) : undefined,
          label: item.kind === 'sign_pole' ? ['Market Row', 'Hill Park', 'Harbor Rd', 'Back Alley'][Math.floor(rng() * 4)] : undefined,
        });
        placedOk = true;
      }
    }
  }

  return props;
}
