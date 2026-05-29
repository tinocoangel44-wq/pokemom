/**
 * AIEngine.js
 * Módulo para controlar el jugador computadora (IA) en el juego de cartas.
 */

/**
 * Helper para crear pausas y permitir animaciones en la UI.
 * @param {number} ms Milisegundos a esperar.
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Agrega un log visual al estado del juego de forma segura.
 * @param {Object} gameEngine Instancia del GameEngine
 * @param {string} message Mensaje de la decisión de la IA
 */
function logAIDecision(gameEngine, message) {
  const time = new Date().toISOString().substring(11, 19);
  // Empujamos el log directamente al estado actual (asumiendo que la UI es reactiva a este array)
  gameEngine.state.log.push(`[${time}] 🤖 IA: ${message}`);
}

/**
 * Calcula el mejor objetivo de ataque.
 * Retorna el índice de la carta atacante, el índice del defensor, y si es directo.
 * @param {Array} aiField Campo de la IA
 * @param {Array} rivalField Campo del rival
 * @returns {Object|null} {attackerIndex, defenderIndex, isDirect} o null si no hay ataques válidos
 */
export function calculateBestAttackTarget(aiField, rivalField) {
  // Encuentra la primera carta de la IA que aún no ha atacado
  const attackerIndex = aiField.findIndex(card => !card.hasAttacked);
  if (attackerIndex === -1) return null;

  // Si el rival no tiene cartas en el campo, el ataque es directo
  if (rivalField.length === 0) {
    return { attackerIndex, defenderIndex: -1, isDirect: true };
  }

  // Si hay cartas, busca la carta enemiga con MENOR defensa
  let bestDefIndex = 0;
  let minDef = rivalField[0].defense_points + (rivalField[0].defBuff || 0);

  for (let i = 1; i < rivalField.length; i++) {
    const currentDef = rivalField[i].defense_points + (rivalField[i].defBuff || 0);
    if (currentDef < minDef) {
      minDef = currentDef;
      bestDefIndex = i;
    }
  }

  return { attackerIndex, defenderIndex: bestDefIndex, isDirect: false };
}

/**
 * Decide si la IA debe usar una habilidad este turno y con qué carta.
 * @param {Object} aiPlayer Estado del jugador IA
 * @param {Object} rivalPlayer Estado del jugador rival
 * @returns {Object} {use: boolean, cardIndex: number}
 */
export function shouldUseAbility(aiPlayer, rivalPlayer) {
  if (aiPlayer.hasUsedAbilityThisTurn) return { use: false, cardIndex: -1 };

  const healingTypes = ['water', 'grass'];
  const offensiveTypes = ['fire', 'electric', 'dragon', 'dark', 'fighting'];

  const hasHealingIndex = aiPlayer.field.findIndex(c => healingTypes.includes(c.type_primary));
  const hasOffensiveIndex = aiPlayer.field.findIndex(c => offensiveTypes.includes(c.type_primary));

  // Regla 1: LP < 1500 Y hay carta con habilidad curativa
  if (aiPlayer.lifePoints < 1500 && hasHealingIndex !== -1) {
    return { use: true, cardIndex: hasHealingIndex };
  }

  // Regla 2: LP < 2000 Y hay carta con habilidad ofensiva y el rival tiene más cartas
  if (aiPlayer.lifePoints < 2000 && hasOffensiveIndex !== -1 && rivalPlayer.field.length > aiPlayer.field.length) {
    return { use: true, cardIndex: hasOffensiveIndex };
  }

  // Regla 3: Ventaja de LP (propia > rival * 1.3) Y hay carta ofensiva
  if (aiPlayer.lifePoints > rivalPlayer.lifePoints * 1.3 && hasOffensiveIndex !== -1) {
    return { use: true, cardIndex: hasOffensiveIndex };
  }

  return { use: false, cardIndex: -1 };
}

/**
 * Ejecuta el turno completo de la IA.
 * Pasa por todas las fases automáticamente tomando decisiones lógicas.
 * @param {Object} gameEngine Instancia del GameEngine
 * @param {string} aiPlayerId ID de la IA (típicamente 'ai_player')
 * @returns {Promise<void>}
 */
export default async function executeAITurn(gameEngine, aiPlayerId = 'ai_player') {
  let state = gameEngine.state;

  if (state.gameOver) return;
  if (state.activePlayerId !== aiPlayerId) return;

  logAIDecision(gameEngine, "Iniciando turno...");
  await delay(800);

  // --- FASE DRAW ---
  if (state.phase === 'draw') {
    gameEngine.drawCard(aiPlayerId);
    logAIDecision(gameEngine, "Ha robado 1 carta.");
    await delay(800);
    gameEngine.nextPhase(aiPlayerId); // Avanza a 'main'
    await delay(800);
  }

  state = gameEngine.state;
  if (state.gameOver) return;

  // --- FASE MAIN ---
  if (state.phase === 'main') {
    let aiPlayer = state.players[aiPlayerId];
    let rivalId = Object.keys(state.players).find(id => id !== aiPlayerId);
    let rivalPlayer = state.players[rivalId];

    // DECISIÓN: Invocar Carta
    if (aiPlayer.hand.length > 0 && aiPlayer.field.length < 5 && !aiPlayer.hasSummonedThisTurn) {
      let bestIndex = 0;
      let maxStats = -1;

      // Encuentra la carta con MAYOR (attack_points + defense_points + hp_points)
      for (let i = 0; i < aiPlayer.hand.length; i++) {
        const card = aiPlayer.hand[i];
        const totalStats = card.attack_points + card.defense_points + card.hp_points;
        if (totalStats > maxStats) {
          maxStats = totalStats;
          bestIndex = i;
        }
      }

      const cardToSummon = aiPlayer.hand[bestIndex];
      logAIDecision(gameEngine, `Decide invocar a ${cardToSummon.name} por sus altas estadísticas.`);
      gameEngine.summonCard(aiPlayerId, bestIndex);
      await delay(800);
    }

    // Actualizar estado tras invocar
    state = gameEngine.state;
    aiPlayer = state.players[aiPlayerId];
    rivalPlayer = state.players[rivalId];

    // DECISIÓN: Usar Habilidad
    if (!aiPlayer.hasUsedAbilityThisTurn && aiPlayer.field.length > 0) {
      const abilityDecision = shouldUseAbility(aiPlayer, rivalPlayer);
      if (abilityDecision.use) {
        const cardToUse = aiPlayer.field[abilityDecision.cardIndex];
        logAIDecision(gameEngine, `Decide usar la habilidad de ${cardToUse.name} estratégicamente.`);
        gameEngine.activateAbility(aiPlayerId, abilityDecision.cardIndex);
        await delay(800);
      }
    }

    gameEngine.nextPhase(aiPlayerId); // Avanza a 'attack'
    await delay(800);
  }

  state = gameEngine.state;
  if (state.gameOver) return;

  // --- FASE ATTACK ---
  if (state.phase === 'attack') {
    let aiPlayer = state.players[aiPlayerId];
    let rivalId = Object.keys(state.players).find(id => id !== aiPlayerId);
    let rivalPlayer = state.players[rivalId];

    // DECISIÓN: Postura (Modo defensivo)
    if (aiPlayer.lifePoints < 800) {
      logAIDecision(gameEngine, "LP críticos (< 800). La IA entra en modo defensivo y no atacará este turno.");
      await delay(800);
    } else {
      // Bucle de ataques mientras haya atacantes disponibles
      let attackPlan = calculateBestAttackTarget(aiPlayer.field, rivalPlayer.field);
      
      while (attackPlan) {
        const attackerCard = aiPlayer.field[attackPlan.attackerIndex];
        
        if (attackPlan.isDirect) {
          logAIDecision(gameEngine, `¡Ordena a ${attackerCard.name} atacar directamente a los Life Points!`);
          gameEngine.attackDirectly(aiPlayerId, attackPlan.attackerIndex, rivalId);
        } else {
          const defenderCard = rivalPlayer.field[attackPlan.defenderIndex];
          logAIDecision(gameEngine, `Calcula ventaja táctica: ordena a ${attackerCard.name} atacar a ${defenderCard.name} (menor defensa).`);
          gameEngine.attackCard(aiPlayerId, attackPlan.attackerIndex, rivalId, attackPlan.defenderIndex);
        }

        await delay(800);

        // Refrescar estado para verificar si el juego terminó por este ataque
        state = gameEngine.state;
        if (state.gameOver) break;

        aiPlayer = state.players[aiPlayerId];
        rivalPlayer = state.players[rivalId];
        
        // Calcular siguiente objetivo
        attackPlan = calculateBestAttackTarget(aiPlayer.field, rivalPlayer.field);
      }
    }

    if (!state.gameOver) {
      // Avanzar a 'end' - esto puede no terminar el turno automáticamente dependiendo de GameEngine
      gameEngine.nextPhase(aiPlayerId); 
      await delay(800);
    }
  }

  state = gameEngine.state;
  if (state.gameOver) return;

  // --- FASE END ---
  logAIDecision(gameEngine, "Termina su turno.");
  gameEngine.endTurn(aiPlayerId);
}
