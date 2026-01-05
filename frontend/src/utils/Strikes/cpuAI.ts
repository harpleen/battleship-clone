let aiState = {
  lastHit: null,
  huntMode: false,
  hitSequence: [],
  shipDirection: null
};

export const resetAIState = () => {
  aiState = {
    lastHit: null,
    huntMode: false,
    hitSequence: [],
    shipDirection: null
  };
};

// ========== EASY  ==========
// Random but avoids obvious misses
const easyAI = (cpuStrikes) => {
  const available = [];
  
  for (let i = 0; i < 100; i++) {
    if (!cpuStrikes.includes(i)) {
      available.push(i);
    }
  }
  
  if (available.length === 0) return null;
  
  // Slightly smarter: prefer cells not surrounded by too many misses
  const scored = available.map(pos => {
    const adjacent = getAdjacentCells(pos);
    const missCount = adjacent.filter(adj => cpuStrikes.includes(adj)).length;
    return { pos, score: 4 - missCount }; // Higher score = better target
  });
  
  // Sort by score and pick from top 30%
  scored.sort((a, b) => b.score - a.score);
  const topCandidates = scored.slice(0, Math.max(1, Math.floor(scored.length * 0.3)));
  
  return topCandidates[Math.floor(Math.random() * topCandidates.length)].pos;
};

// ========== MEDIUM   ==========
// Hunt mode after hit, finish ships
const mediumAI = (cpuStrikes, playerBattleships) => {
  // If we have hits, try to finish the ship
  if (aiState.hitSequence.length > 0) {
    // Try all adjacent cells of all hits
    const allAdjacent = new Set();
    aiState.hitSequence.forEach(hit => {
      const adjacent = getAdjacentCells(hit);
      adjacent.forEach(cell => {
        if (!cpuStrikes.includes(cell)) {
          allAdjacent.add(cell);
        }
      });
    });
    
    if (allAdjacent.size > 0) {
      const targets = Array.from(allAdjacent);
      return targets[Math.floor(Math.random() * targets.length)];
    }
  }

  // Random strike
  return easyAI(cpuStrikes);
};

// ========== HARD  ==========
// Directional targeting + checkerboard strategy
const hardAI = (cpuStrikes, playerBattleships) => {
  // If we have 2+ hits, determine direction and continue
  if (aiState.hitSequence.length >= 2) {
    const direction = determineDirection(aiState.hitSequence);
    
    console.log(' Hit Sequence:', aiState.hitSequence);
    console.log(' Direction:', direction);
    
    if (direction) {
      const targets = getDirectionalTargets(aiState.hitSequence, direction);
      console.log(' Directional Targets:', targets);
      
      const validTargets = targets.filter(pos => !cpuStrikes.includes(pos) && pos >= 0 && pos < 100);
      
      if (validTargets.length > 0) {
        console.log('Shooting along direction:', validTargets[0]);
        return validTargets[0];
      }
    }
  }

  // If we have 1 hit, shoot around it (prioritize line formation)
  if (aiState.hitSequence.length === 1) {
    const adjacent = getAdjacentCells(aiState.hitSequence[0]);
    const validTargets = adjacent.filter(pos => !cpuStrikes.includes(pos));

    if (validTargets.length > 0) {
      console.log(' Shooting around single hit:', validTargets[0]);
      return validTargets[0];
    }
  }

 
  const checkerboard = getCheckerboardCells();
  const validCheckerboard = checkerboard.filter(pos => !cpuStrikes.includes(pos));

  if (validCheckerboard.length > 0) {

    const centerWeighted = validCheckerboard.map(pos => {
      const row = Math.floor(pos / 10);
      const col = pos % 10;
      const distanceFromCenter = Math.abs(row - 4.5) + Math.abs(col - 4.5);
      return { pos, weight: 10 - distanceFromCenter };
    });
    
    centerWeighted.sort((a, b) => b.weight - a.weight);
    const topTargets = centerWeighted.slice(0, Math.max(1, Math.floor(centerWeighted.length * 0.2)));
    
    return topTargets[Math.floor(Math.random() * topTargets.length)].pos;
  }

  // Fallback to smart random
  return easyAI(cpuStrikes);
};

// ========== HELPER FUNCTIONS ==========

const getAdjacentCells = (position) => {
  const row = Math.floor(position / 10);
  const col = position % 10;
  const adjacent = [];

  if (row > 0) adjacent.push(position - 10); // Up
  if (row < 9) adjacent.push(position + 10); // Down
  if (col > 0) adjacent.push(position - 1);  // Left
  if (col < 9) adjacent.push(position + 1);  // Right

  return adjacent;
};

const isShipSunk = (hitSequence, allStrikes, battleships) => {
  if (hitSequence.length === 0) return false;

  // Get all cells around the hit sequence
  const surroundingCells = new Set();
  
  hitSequence.forEach(hit => {
    const adjacent = getAdjacentCells(hit);
    adjacent.forEach(cell => {
      if (!hitSequence.includes(cell)) {
        surroundingCells.add(cell);
      }
    });
  });

  // Check if all surrounding cells are either struck or not battleships
  for (let cell of surroundingCells) {
    if (battleships.includes(cell) && !allStrikes.includes(cell)) {
      return false; // Ship not sunk yet
    }
  }

  return true; // Ship is sunk
};

const determineDirection = (hits) => {
  if (hits.length < 2) return null;

  const sorted = [...hits].sort((a, b) => a - b);
  
  // Check horizontal (same row, consecutive columns)
  const rows = sorted.map(pos => Math.floor(pos / 10));
  const allSameRow = rows.every(row => row === rows[0]);
  
  if (allSameRow) {
    const cols = sorted.map(pos => pos % 10);
    let isConsecutive = true;
    for (let i = 1; i < cols.length; i++) {
      if (cols[i] !== cols[i-1] + 1) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive) return 'horizontal';
  }
  
  // Check vertical (same column, consecutive rows)
  const cols = sorted.map(pos => pos % 10);
  const allSameCol = cols.every(col => col === cols[0]);
  
  if (allSameCol) {
    const rows2 = sorted.map(pos => Math.floor(pos / 10));
    let isConsecutive = true;
    for (let i = 1; i < rows2.length; i++) {
      if (rows2[i] !== rows2[i-1] + 1) {
        isConsecutive = false;
        break;
      }
    }
    if (isConsecutive) return 'vertical';
  }

  return null;
};

const getDirectionalTargets = (hits, direction) => {
  const sorted = [...hits].sort((a, b) => a - b);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  
  const targets = [];

  if (direction === 'horizontal') {
    const firstCol = first % 10;
    const lastCol = last % 10;

    // Shoot left from first
    if (firstCol > 0) targets.push(first - 1);
    // Shoot right from last
    if (lastCol < 9) targets.push(last + 1);
  } else if (direction === 'vertical') {
    const firstRow = Math.floor(first / 10);
    const lastRow = Math.floor(last / 10);

    // Shoot up from first
    if (firstRow > 0) targets.push(first - 10);
    // Shoot down from last
    if (lastRow < 9) targets.push(last + 10);
  }

  return targets;
};

const getCheckerboardCells = () => {
  const cells = [];
  
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      if ((row + col) % 2 === 0) {
        cells.push(row * 10 + col);
      }
    }
  }
  
  return cells;
};

// ========== STATE MANAGEMENT ==========

export const updateAIState = (position, isHit, allStrikes, battleships) => {
  if (isHit) {
    aiState.lastHit = position;
    aiState.huntMode = true;
    
    if (!aiState.hitSequence.includes(position)) {
      aiState.hitSequence.push(position);
    }

    // Check if ship is sunk
    if (allStrikes && battleships && isShipSunk(aiState.hitSequence, allStrikes, battleships)) {
      console.log('🚢 Ship sunk! Resetting hunt mode');
      resetHuntMode();
    }
  } else {
    // Miss - keep hunt mode if we have hits
    if (aiState.hitSequence.length === 0) {
      aiState.lastHit = null;
      aiState.huntMode = false;
    }
  }
};

export const resetHuntMode = () => {
  aiState.hitSequence = [];
  aiState.lastHit = null;
  aiState.huntMode = false;
  aiState.shipDirection = null;
};

// ========== MAIN FUNCTION ==========

export const getCPUStrike = (difficulty, cpuStrikes, playerBattleships) => {
  let position;

  switch (difficulty) {
    case 'easy':
      position = easyAI(cpuStrikes);
      break;
    case 'medium':
      position = mediumAI(cpuStrikes, playerBattleships);
      break;
    case 'hard':
      position = hardAI(cpuStrikes, playerBattleships);
      break;
    default:
      position = mediumAI(cpuStrikes, playerBattleships);
  }

  return position;
};
