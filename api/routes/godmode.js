const express = require("express");
const OpenAI = require("openai");

const router = express.Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to convert position to grid coordinates
function positionToCoordinates(position) {
  const row = Math.floor(position / 10);
  const col = position % 10;
  return { row, col };
}

// Helper function to convert coordinates back to position
function coordinatesToPosition(row, col) {
  return row * 10 + col;
}

// Helper function to analyze board patterns
function analyzeBoardState(playerStrikes, cpuStrikes, playerBattleships, cpuBattleships) {
  const analysis = {
    hitPatterns: [],
    missPatterns: [],
    potentialShipAreas: [],
    dangerousAreas: [],
    powerupOpportunities: []
  };

  // Analyze player hit patterns to predict ship locations
  const playerHits = playerStrikes.filter(pos => cpuBattleships.includes(pos));
  const playerMisses = playerStrikes.filter(pos => !cpuBattleships.includes(pos));

  // Group hits by proximity (potential ship clusters)
  playerHits.forEach(hit => {
    const hitCoord = positionToCoordinates(hit);
    const nearbyHits = playerHits.filter(otherHit => {
      if (otherHit === hit) return false;
      const otherCoord = positionToCoordinates(otherHit);
      return Math.abs(hitCoord.row - otherCoord.row) <= 1 && 
             Math.abs(hitCoord.col - otherCoord.col) <= 1;
    });
    
    if (nearbyHits.length > 0) {
      analysis.hitPatterns.push({
        center: hit,
        nearbyHits,
        direction: nearbyHits.length > 0 ? 
          (nearbyHits.some(n => positionToCoordinates(n).row === hitCoord.row) ? 'horizontal' : 'vertical') : 'unknown'
      });
    }
  });

  // Identify areas where player might have ships based on misses
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const pos = coordinatesToPosition(row, col);
      if (!cpuStrikes.includes(pos)) {
        // Check if this area is surrounded by misses (potential ship location)
        const surroundingPositions = [
          coordinatesToPosition(row - 1, col),
          coordinatesToPosition(row + 1, col),
          coordinatesToPosition(row, col - 1),
          coordinatesToPosition(row, col + 1)
        ].filter(p => p >= 0 && p < 100);
        
        const surroundedByMisses = surroundingPositions.filter(p => cpuStrikes.includes(p) && !playerBattleships.includes(p)).length >= 2;
        
        if (surroundedByMisses) {
          analysis.potentialShipAreas.push(pos);
        }
      }
    }
  }

  return analysis;
}

// Generate strategic prompt for OpenAI
function generateStrategicPrompt(gameState) {
  const { playerStrikes, cpuStrikes, playerBattleships, cpuBattleships, powerupUsage, turnCount } = gameState;
  
  const analysis = analyzeBoardState(playerStrikes, cpuStrikes, playerBattleships, cpuBattleships);
  
  const availablePositions = [];
  for (let i = 0; i < 100; i++) {
    if (!cpuStrikes.includes(i)) {
      availablePositions.push(i);
    }
  }

  return {
    role: "system",
    content: `You are a strategic battleship AI playing in GOD MODE. Your goal is to destroy all player ships with maximum efficiency.

CURRENT GAME STATE:
- Board: 10x10 grid (positions 0-99)
- Your strikes: ${cpuStrikes.length} positions
- Player strikes: ${playerStrikes.length} positions  
- Player ships remaining: ${playerBattleships.filter(pos => !cpuStrikes.includes(pos)).length} positions
- Turn: ${turnCount}

STRATEGIC ANALYSIS:
- Hit patterns detected: ${analysis.hitPatterns.length} clusters
- Potential ship areas: ${analysis.potentialShipAreas.length} zones
- Available targets: ${availablePositions.length} positions

POWERUPS AVAILABLE:
- Cluster Bombs: ${powerupUsage.cluster < 2 ? 'YES' : 'USED'} (hits target + 4 diagonals)
- Missiles: ${powerupUsage.missiles < 1 ? 'YES' : 'USED'} (hits 6 random positions)
- Nuke: ${powerupUsage.nuke < 1 ? 'YES' : 'USED'} (hits entire row + column)

RESPONSE FORMAT:
Return a JSON object with:
{
  "strategy": "brief explanation of your choice",
  "target": "single position (0-99) for normal strike OR powerup name",
  "powerup": "cluster/missiles/nuke/null",
  "confidence": 0.0-1.0,
  "reasoning": "detailed tactical analysis"
}

RULES:
1. Prioritize finishing damaged ships over random exploration
2. Use powerups strategically when they can guarantee multiple hits
3. Consider probability density of remaining ship positions
4. Avoid previously struck positions
5. Adapt to player's attack patterns`
  };
}

// Main AI decision endpoint
router.post("/strike", async (req, res) => {
  try {
    const gameState = req.body;
    
    if (!gameState.playerStrikes || !gameState.cpuStrikes || 
        !gameState.playerBattleships || !gameState.cpuBattleships) {
      return res.status(400).json({ error: "Missing required game state data" });
    }

    // Generate strategic prompt
    const systemPrompt = generateStrategicPrompt(gameState);
    
    const userPrompt = {
      role: "user",
      content: JSON.stringify({
        playerStrikes: gameState.playerStrikes,
        cpuStrikes: gameState.cpuStrikes,
        playerBattleships: gameState.playerBattleships,
        cpuBattleships: gameState.cpuBattleships,
        powerupUsage: gameState.powerupUsage || { cluster: 0, missiles: 0, nuke: 0 },
        turnCount: gameState.turnCount || 1,
        availablePowerups: {
          cluster: gameState.powerupUsage?.cluster < 2,
          missiles: gameState.powerupUsage?.missiles < 1,
          nuke: gameState.powerupUsage?.nuke < 1
        }
      })
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [systemPrompt, userPrompt],
      max_tokens: 500,
      temperature: 0.3, // Lower temperature for more strategic consistency
    });

    const aiResponse = completion.choices[0].message.content;
    
    try {
      const decision = JSON.parse(aiResponse);
      
      // Validate the AI's decision
      if (decision.target !== undefined) {
        const target = parseInt(decision.target);
        if (isNaN(target) || target < 0 || target > 99) {
          throw new Error("Invalid target position");
        }
        
        // Check if target is already struck
        if (gameState.cpuStrikes.includes(target)) {
          // Fallback to random available position
          const availablePositions = [];
          for (let i = 0; i < 100; i++) {
            if (!gameState.cpuStrikes.includes(i)) {
              availablePositions.push(i);
            }
          }
          decision.target = availablePositions[Math.floor(Math.random() * availablePositions.length)];
          decision.reasoning += " (fallback: target already struck)";
        }
      }
      
      // Validate powerup usage
      if (decision.powerup && decision.powerup !== "null") {
        const validPowerups = ["cluster", "missiles", "nuke"];
        if (!validPowerups.includes(decision.powerup)) {
          decision.powerup = "null";
          decision.reasoning += " (invalid powerup corrected)";
        }
        
        // Check if powerup is available
        if (decision.powerup === "cluster" && gameState.powerupUsage?.cluster >= 2) {
          decision.powerup = "null";
        }
        if (decision.powerup === "missiles" && gameState.powerupUsage?.missiles >= 1) {
          decision.powerup = "null";
        }
        if (decision.powerup === "nuke" && gameState.powerupUsage?.nuke >= 1) {
          decision.powerup = "null";
        }
      }
      
      res.json({
        success: true,
        decision: decision,
        timestamp: new Date().toISOString()
      });
      
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback to random strike
      const availablePositions = [];
      for (let i = 0; i < 100; i++) {
        if (!gameState.cpuStrikes.includes(i)) {
          availablePositions.push(i);
        }
      }
      
      res.json({
        success: true,
        decision: {
          strategy: "fallback_random",
          target: availablePositions[Math.floor(Math.random() * availablePositions.length)],
          powerup: "null",
          confidence: 0.1,
          reasoning: "AI response parsing failed, using fallback random strike"
        }
      });
    }
    
  } catch (error) {
    console.error("OpenAI API error:", error);
    res.status(500).json({ 
      error: "Failed to get AI decision",
      message: error.message 
    });
  }
});

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    openai_configured: !!process.env.OPENAI_API_KEY
  });
});

module.exports = router;
