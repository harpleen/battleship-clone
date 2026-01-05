import { getCPUStrike, updateAIState, resetHuntMode } from './cpuAI';

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

export const cpuStrike = (strikes, battleships, difficulty = 'medium') => {
    const availablePositions = Array.from({ length: 100 }, (_, i) => i)
        .filter(pos => !strikes.includes(pos));
    
    if (availablePositions.length === 0) {
        return null;
    }

    const position = getCPUStrike(difficulty, strikes, battleships);
    
    if (position === null || position === undefined) {
        return null;
    }

    const row = Math.floor(position / 10);
    const col = position % 10;
    const isHit = battleships.includes(position);

    const newStrikes = [...strikes, position];
    updateAIState(position, isHit, newStrikes, battleships);

    return {
        position: position,
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
