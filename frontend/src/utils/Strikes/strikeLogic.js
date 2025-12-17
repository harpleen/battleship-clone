export const handleStrike = (idx, strikes, battleships) => {
    if (strikes.includes(idx)) {
        return {
            success: false,
            message: 'Already attacked this position!',
            isHit: false
        };
    }

    const isHit = battleships.includes(idx);
    
    return {
        success: true,
        message: isHit ? 'HIT! 💥' : 'MISS! 💨',
        isHit: isHit,
        position: idx
    };
};

export const cpuStrike = (strikes, battleships) => {
    const availablePositions = Array.from({ length: 100 }, (_, i) => i)
        .filter(pos => !strikes.includes(pos));
    
    if (availablePositions.length === 0) {
        return null;
    }

    const randomPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    const row = Math.floor(randomPos / 10);
    const col = randomPos % 10;
    const isHit = battleships.includes(randomPos);

    return {
        position: randomPos,
        row: row,
        col: col,
        isHit: isHit,
        message: isHit 
            ? `CPU HIT 💥`
            : `CPU MISSED 💨`
    };
};

export const checkGameOver = (strikes, battleships) => {
    const hits = strikes.filter(pos => battleships.includes(pos));
    return hits.length === battleships.length;
};
