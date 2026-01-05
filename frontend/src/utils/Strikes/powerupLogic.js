/**
 * Cluster Bombs - Hits the target square and 4 diagonal squares in an X pattern
 * @param {number} position - The center position (0-99)
 * @returns {number[]} - Array of positions to strike
 */
export const clusterBombs = (position) => {
    const row = Math.floor(position / 10);
    const col = position % 10;
    const strikes = [position]; // Center position
    
    // Diagonal offsets for X pattern: top-left, top-right, bottom-left, bottom-right
    const diagonalOffsets = [
        { rowOffset: -1, colOffset: -1 }, // Top-left
        { rowOffset: -1, colOffset: 1 },  // Top-right
        { rowOffset: 1, colOffset: -1 },  // Bottom-left
        { rowOffset: 1, colOffset: 1 }    // Bottom-right
    ];
    
    diagonalOffsets.forEach(({ rowOffset, colOffset }) => {
        const newRow = row + rowOffset;
        const newCol = col + colOffset;
        
        // Check if the new position is within bounds
        if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
            strikes.push(newRow * 10 + newCol);
        }
    });
    
    return strikes;
};

/**
 * Missiles - Hits the clicked square plus 5 random squares across the board
 * @param {number} position - The clicked position (0-99)
 * @param {number[]} existingStrikes - Already struck positions to avoid duplicates
 * @returns {number[]} - Array of 6 positions to strike (clicked + 5 random)
 */
export const missiles = (position, existingStrikes = []) => {
    const strikes = [position]; // Always include the clicked position
    const availablePositions = [];
    
    // Get all available positions (0-99) that haven't been struck yet and aren't the clicked position
    for (let i = 0; i < 100; i++) {
        if (!existingStrikes.includes(i) && i !== position) {
            availablePositions.push(i);
        }
    }
    
    // Randomly select 5 additional positions
    const numAdditionalMissiles = Math.min(5, availablePositions.length);
    for (let i = 0; i < numAdditionalMissiles; i++) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        strikes.push(availablePositions[randomIndex]);
        availablePositions.splice(randomIndex, 1); // Remove selected position
    }
    
    return strikes;
};

/**
 * Nuke - Hits the entire row and column from the target position
 * @param {number} position - The target position (0-99)
 * @returns {number[]} - Array of positions in the row and column
 */
export const nuke = (position) => {
    const row = Math.floor(position / 10);
    const col = position % 10;
    const strikes = [];
    
    // Add all positions in the same row
    for (let c = 0; c < 10; c++) {
        strikes.push(row * 10 + c);
    }
    
    // Add all positions in the same column (avoid duplicating the center position)
    for (let r = 0; r < 10; r++) {
        const pos = r * 10 + col;
        if (!strikes.includes(pos)) {
            strikes.push(pos);
        }
    }
    
    return strikes;
};

/**
 * Apply powerup strikes to the game
 * @param {number[]} powerupStrikes - Array of positions from powerup
 * @param {number[]} existingStrikes - Current strikes array
 * @param {number[]} battleships - Enemy battleship positions
 * @returns {Object} - Result with new strikes, hits, and messages
 */
export const applyPowerup = (powerupStrikes, existingStrikes, battleships) => {
    const newStrikes = [...existingStrikes];
    const hits = [];
    const misses = [];
    
    powerupStrikes.forEach(pos => {
        if (!existingStrikes.includes(pos)) {
            newStrikes.push(pos);
            
            if (battleships.includes(pos)) {
                hits.push(pos);
            } else {
                misses.push(pos);
            }
        }
    });
    
    return {
        newStrikes,
        hits,
        misses,
        totalHits: hits.length,
        totalMisses: misses.length,
        message: `💥 ${hits.length} HIT${hits.length !== 1 ? 'S' : ''}, ${misses.length} MISS${misses.length !== 1 ? 'ES' : ''}!`
    };
};
