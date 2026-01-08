import { clusterBombs, missiles, nuke, applyPowerup } from './powerupLogic';

/* =====================================================
   CPU AI – COMPLETE IMPLEMENTATION
===================================================== */

let turnCounter = 0;

/* =====================================================
   AI PROFILES
===================================================== */

const AI_PROFILES = {
  easy: {
    heatmapCooldown: Infinity,
    destroyMistakeChance: 0.4,
    cheatCooldown: Infinity,
    inferenceWeight: 0,
    powerupChance: 0,  // Easy mode: no powerups
    availablePowerups: []  // No powerups
  },
  medium: {
    heatmapCooldown: 8,
    destroyMistakeChance: 0.2,
    cheatCooldown: Infinity,
    inferenceWeight: 0.3,
    powerupChance: 0.25,  // 25% - More aggressive powerup usage
    availablePowerups: ['cluster', 'missile']  // Limited powerups
  },
  hard: {
    heatmapCooldown: 3,  // Much faster heatmap updates (was 6)
    destroyMistakeChance: 0.01,  // Almost never makes mistakes (was 0.05)
    cheatCooldown: Infinity,
    inferenceWeight: 0.9,  // Very intelligent targeting (was 0.7)
    powerupChance: 0.50,  // 50% - Very aggressive powerup usage (was 0.40)
    availablePowerups: ['cluster', 'missile', 'nuke']  // ALL powerups including nuke!
  },
  god: {
    heatmapCooldown: 2,  // Fastest heatmap (was 4)
    destroyMistakeChance: 0,  // Perfect play
    cheatCooldown: 3,  // Can cheat every 3 turns
    inferenceWeight: 1,  // Maximum intelligence
    powerupChance: 0.60,  // 60% - Extreme powerup usage
    availablePowerups: ['cluster', 'missile', 'nuke']  // ALL powerups + cheating
  }
};

/* =====================================================
   CPU STATE
===================================================== */

let cpuState = {
  mode: 'search',
  target: {
    shipId: null,
    hits: [],
    direction: null
  },
  lastHeatmapTurn: -Infinity,
  lastCheatTurn: -Infinity,
  powerups: {
    cluster: { available: 2, lastUsed: -Infinity, cooldown: 4 },
    missile: { available: 1, lastUsed: -Infinity, cooldown: 5 },
    nuke:    { available: 1, lastUsed: -Infinity, cooldown: 8 }
  }
};

export const resetCPUState = () => {
  turnCounter = 0;
  cpuState = {
    mode: 'search',
    target: {
      shipId: null,
      hits: [],
      direction: null
    },
    lastHeatmapTurn: -Infinity,
    lastCheatTurn: -Infinity,
    powerups: {
      cluster: { available: 2, lastUsed: -Infinity, cooldown: 4 },
      missile: { available: 1, lastUsed: -Infinity, cooldown: 5 },
      nuke:    { available: 1, lastUsed: -Infinity, cooldown: 8 }
    }
  };
};

/* =====================================================
   BASIC HELPERS
===================================================== */

const randomUnstruck = (cpuStrikes) => {
  const pool = [];
  for (let i = 0; i < 100; i++) {
    if (!cpuStrikes.includes(i)) pool.push(i);
  }
  return pool[Math.floor(Math.random() * pool.length)];
};

const getAdjacent = (p) => {
  const r = Math.floor(p / 10);
  const c = p % 10;
  return [
    r > 0 ? p - 10 : null,
    r < 9 ? p + 10 : null,
    c > 0 ? p - 1 : null,
    c < 9 ? p + 1 : null
  ].filter(Boolean);
};

const determineDirection = ([a, b]) =>
  Math.floor(a / 10) === Math.floor(b / 10)
    ? 'horizontal'
    : 'vertical';

/* =====================================================
   HEATMAP + HUMAN INFERENCE
===================================================== */

const generateHeatmap = (cpuStrikes, remainingShips, inferenceWeight) => {
  const heat = Array(100).fill(0);

  for (const size of remainingShips) {
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c <= 10 - size; c++) {
        const cells = Array.from({ length: size }, (_, i) => r * 10 + c + i);
        if (cells.every(p => !cpuStrikes.includes(p))) {
          cells.forEach(p => {
            heat[p] += 1 + inferenceWeight * (p % 10 < 2 || p % 10 > 7);
          });
        }
      }
    }

    for (let c = 0; c < 10; c++) {
      for (let r = 0; r <= 10 - size; r++) {
        const cells = Array.from({ length: size }, (_, i) => (r + i) * 10 + c);
        if (cells.every(p => !cpuStrikes.includes(p))) {
          cells.forEach(p => {
            heat[p] += 1 + inferenceWeight * (p < 20 || p > 79);
          });
        }
      }
    }
  }

  return heat;
};

const bestHeatmapTarget = (heat, cpuStrikes) => {
  let best = null;
  let score = -1;
  for (let i = 0; i < 100; i++) {
    if (!cpuStrikes.includes(i) && heat[i] > score) {
      score = heat[i];
      best = i;
    }
  }
  return best;
};

/* =====================================================
   DESTROY MODE (SHIP LOCK)
===================================================== */

const getNextTargetOnShip = (cpuStrikes, profile) => {
  const { hits, direction } = cpuState.target;
  if (!hits.length) return null;

  if (Math.random() < profile.destroyMistakeChance) {
    return randomUnstruck(cpuStrikes);
  }

  if (direction) {
    const sorted = [...hits].sort((a, b) => a - b);
    const deltas = direction === 'horizontal' ? [-1, 1] : [-10, 10];

    for (const d of deltas) {
      const p = d < 0 ? sorted[0] + d : sorted.at(-1) + d;
      if (p >= 0 && p < 100 && !cpuStrikes.includes(p)) return p;
    }
  }

  for (const h of hits) {
    const adj = getAdjacent(h).filter(p => !cpuStrikes.includes(p));
    if (adj.length) return adj[0];
  }

  return null;
};

/* =====================================================
   POWERUP DECISION
===================================================== */

const canUsePowerup = (type) => {
  const p = cpuState.powerups[type];
  return (
    p &&
    p.available > 0 &&
    turnCounter - p.lastUsed >= p.cooldown
  );
};

const choosePowerup = (difficulty) => {
  const profile = AI_PROFILES[difficulty];

  if (Math.random() > profile.powerupChance) return null;

  // Get available powerups for this difficulty
  const available = profile.availablePowerups || [];
  
  // Shuffle available powerups for random selection
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  
  // Try each powerup in random order
  for (const powerup of shuffled) {
    if (canUsePowerup(powerup)) {
      return powerup;
    }
  }

  return null;
};

/* =====================================================
   STATE UPDATE (AFTER CPU HIT RESOLVES)
===================================================== */

export const updateCPUState = (pos, hit, cpuStrikes, playerBattleships) => {
  if (!hit || !playerBattleships) return;

  const ship = playerBattleships.ships.find(s => s.positions.includes(pos));
  if (!ship) return;

  const shipId = ship.positions.join(',');

  // If already tracking a different ship, check if current ship is more damaged
  if (cpuState.target.shipId && cpuState.target.shipId !== shipId) {
    const currentShipHits = cpuState.target.hits.length;
    const newShipHits = ship.positions.filter(p => cpuStrikes.includes(p)).length;
    
    // Only switch if new ship has more hits (more damaged = higher priority)
    if (newShipHits <= currentShipHits) return;
    
    // Switch to more damaged ship
    cpuState.target = { shipId: null, hits: [], direction: null };
  }

  // Track this ship
  cpuState.target.shipId = shipId;
  if (!cpuState.target.hits.includes(pos)) {
    cpuState.target.hits.push(pos);
  }

  // Determine mode based on hits
  if (cpuState.target.hits.length >= 2 && !cpuState.target.direction) {
    cpuState.target.direction = determineDirection(cpuState.target.hits);
    cpuState.mode = 'destroy';
  } else if (cpuState.target.hits.length >= 1) {
    cpuState.mode = 'target';
  }

  // Check if ship is sunk
  if (ship.positions.every(p => cpuStrikes.includes(p))) {
    cpuState.mode = 'search';
    cpuState.target = { shipId: null, hits: [], direction: null };
  }
};

/* =====================================================
   MAIN ENTRY
===================================================== */

export const getCPUStrike = (
  difficulty,
  cpuStrikes,
  playerBattleships = null,
  powerupUsage = null
) => {
  turnCounter++;
  const profile = AI_PROFILES[difficulty] ?? AI_PROFILES.medium;

  // Calculate remaining ships from playerBattleships
  const remainingShips = playerBattleships?.ships?.map(s => s.length) || [5, 4, 3, 3, 2];

  /* ---------- DESTROY MODE (HIGHEST PRIORITY) ---------- */
  if (cpuState.mode !== 'search') {
    const p = getNextTargetOnShip(cpuStrikes, profile);
    
    if (p !== null) {
      const msg = cpuState.mode === 'destroy' ? '💀 CPU - Destroy Mode' : '🎯 CPU - Target Mode';
      return { type: 'regular', position: p, message: msg };
    } else {
      // No valid targets found, reset to search mode
      cpuState.mode = 'search';
      cpuState.target = { shipId: null, hits: [], direction: null };
    }
  }

  /* ---------- POWERUP CHECK ---------- */
  const powerup = choosePowerup(difficulty);
  if (powerup) {
    cpuState.powerups[powerup].available--;
    cpuState.powerups[powerup].lastUsed = turnCounter;

    const target = randomUnstruck(cpuStrikes);
    let powerupStrikes;
    let message;

    // Generate powerup strikes based on type
    let powerupType;
    switch (powerup) {
      case 'cluster':
        powerupStrikes = clusterBombs(target);
        powerupType = 'cluster';
        message = '⚠️ CLUSTER BOMBS INCOMING!';
        break;
      case 'missile':
        powerupStrikes = missiles(target, cpuStrikes);
        powerupType = 'missiles'; // Game.jsx expects plural
        message = '🚀 MISSILES INCOMING!';
        break;
      case 'nuke':
        powerupStrikes = nuke(target);
        powerupType = 'nuke';
        message = '☢️ NUKE INCOMING!';
        break;
    }

    // Apply powerup and get results - must pass positions array
    const battleshipPositions = playerBattleships?.positions || [];
    const powerupResult = applyPowerup(powerupStrikes, cpuStrikes, battleshipPositions);

    return {
      type: powerupType,
      target,
      powerupResult,
      message
    };
  }

  /* ---------- CHEATING GOD MODE ---------- */
  if (
    difficulty === 'god' &&
    playerBattleships &&
    turnCounter - cpuState.lastCheatTurn >= profile.cheatCooldown
  ) {
    const ship = playerBattleships.ships.find(s =>
      s.positions.some(p => !cpuStrikes.includes(p))
    );
    if (ship) {
      cpuState.lastCheatTurn = turnCounter;
      return {
        type: 'regular',
        position: ship.positions.find(p => !cpuStrikes.includes(p)),
        message: '👁️ GOD MODE - Calculated Strike'
      };
    }
  }

  /* ---------- HEATMAP SEARCH ---------- */
  if (turnCounter - cpuState.lastHeatmapTurn >= profile.heatmapCooldown) {
    const heat = generateHeatmap(
      cpuStrikes,
      remainingShips,
      profile.inferenceWeight
    );
    const p = bestHeatmapTarget(heat, cpuStrikes);
    cpuState.lastHeatmapTurn = turnCounter;
    if (p !== null) {
      const msg = difficulty === 'easy' ? '💭 CPU Easy - Random Strike' :
                  difficulty === 'medium' ? '🔍 CPU Medium - Searching' :
                  difficulty === 'hard' ? '🔍 CPU Hard - Searching' :
                  '👁️ GOD MODE - Searching';
      return { type: 'regular', position: p, message: msg };
    }
  }

  /* ---------- FALLBACK ---------- */
  const msg = difficulty === 'easy' ? '💭 CPU Easy - Random Strike' :
              difficulty === 'medium' ? '🔍 CPU Medium - Searching' :
              difficulty === 'hard' ? '🔍 CPU Hard - Searching' :
              '👁️ GOD MODE - Searching';
  return { type: 'regular', position: randomUnstruck(cpuStrikes), message: msg };
};
