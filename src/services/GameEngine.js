/**
 * GameEngine.js
 * Motor lógico para el juego de cartas por turnos.
 */

export default class GameEngine {
  /**
   * Inicializa el estado del juego.
   * @param {Object} player1 { id, name }
   * @param {Object} player2 { id, name }
   * @param {Array} deck1 Array de objetos de cartas
   * @param {Array} deck2 Array de objetos de cartas
   */
  constructor(player1, player2, deck1, deck2) {
    const shuffledDeck1 = this.shuffleDeck([...deck1]);
    const shuffledDeck2 = this.shuffleDeck([...deck2]);

    const p1 = this._createPlayerState(player1, shuffledDeck1);
    const p2 = this._createPlayerState(player2, shuffledDeck2);

    // Reparte 5 cartas iniciales a cada jugador
    for (let i = 0; i < 5; i++) {
      if (p1.deck.length > 0) p1.hand.push(p1.deck.pop());
      if (p2.deck.length > 0) p2.hand.push(p2.deck.pop());
    }

    this.state = {
      phase: 'draw',
      turn: 1,
      activePlayerId: player1.id,
      players: {
        [player1.id]: p1,
        [player2.id]: p2
      },
      winner: null,
      gameOver: false,
      log: []
    };

    this._addLog(this.state, 'El juego ha comenzado.');
  }

  _createPlayerState(playerInfo, deck) {
    return {
      id: playerInfo.id,
      name: playerInfo.name,
      lifePoints: 4000,
      hand: [],
      deck: deck,
      field: [],
      graveyard: [],
      hasDrawnThisTurn: false,
      hasSummonedThisTurn: false,
      hasUsedAbilityThisTurn: false,
      hasAttackedThisTurn: false,
      // Estados temporales
      attackDebuff: 0,
      hasIronShield: false
    };
  }

  /**
   * Clona profundamente el estado actual usando JSON para asegurar inmutabilidad.
   */
  _cloneState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Finaliza una operación devolviendo el formato esperado.
   */
  _commit(newState, success, message) {
    if (success) {
      this.state = newState;
    }
    return { success, message, state: this.state };
  }

  /**
   * Agrega un log con timestamp.
   */
  _addLog(state, message) {
    const time = new Date().toISOString().substring(11, 19);
    state.log.push(`[${time}] ${message}`);
  }

  /**
   * Obtiene el ID del jugador oponente.
   */
  _getOpponentId(state, playerId) {
    const keys = Object.keys(state.players);
    return keys[0] === playerId ? keys[1] : keys[0];
  }

  /**
   * Algoritmo Fisher-Yates
   */
  shuffleDeck(deck) {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  }

  /**
   * Roba 1 carta del mazo a la mano.
   */
  drawCard(playerId) {
    const newState = this._cloneState();
    if (newState.gameOver) return this._commit(newState, false, "El juego ya terminó.");
    if (newState.activePlayerId !== playerId) return this._commit(newState, false, "No es tu turno.");
    if (newState.phase !== 'draw') return this._commit(newState, false, "Solo puedes robar en la fase 'draw'.");
    
    const player = newState.players[playerId];
    if (player.hasDrawnThisTurn) return this._commit(newState, false, "Ya robaste en este turno.");

    if (player.deck.length === 0) {
      newState.gameOver = true;
      newState.winner = this._getOpponentId(newState, playerId);
      this._addLog(newState, `${player.name} intentó robar pero su mazo está vacío. ¡Pierde la partida!`);
      return this._commit(newState, true, "Mazo vacío. Derrota por deckout.");
    }

    const card = player.deck.pop();
    if (player.hand.length >= 10) {
      const discarded = player.hand.shift();
      player.graveyard.push(discarded);
      this._addLog(newState, `Mano de ${player.name} llena (10 cartas). Descarta: ${discarded.name}.`);
    }
    player.hand.push(card);
    player.hasDrawnThisTurn = true;
    
    this._addLog(newState, `${player.name} robó 1 carta.`);
    return this._commit(newState, true, "Carta robada con éxito.");
  }

  /**
   * Mueve una carta de la mano al campo.
   */
  summonCard(playerId, cardIndex) {
    const newState = this._cloneState();
    if (newState.gameOver) return this._commit(newState, false, "El juego ya terminó.");
    if (newState.activePlayerId !== playerId) return this._commit(newState, false, "No es tu turno.");
    if (newState.phase !== 'main') return this._commit(newState, false, "Solo puedes invocar en la fase 'main'.");
    
    const player = newState.players[playerId];
    if (player.hasSummonedThisTurn) return this._commit(newState, false, "Ya invocaste una carta en este turno.");
    if (player.field.length >= 5) return this._commit(newState, false, "Tu campo ya tiene el máximo de 5 cartas.");
    if (!player.hand[cardIndex]) return this._commit(newState, false, "Índice de carta inválido.");

    const card = player.hand.splice(cardIndex, 1)[0];
    card.hasAttacked = false; // Reset attack flag
    card.defBuff = 0; // Reset buffs
    card.hasCriticalHit = false;

    player.field.push(card);
    player.hasSummonedThisTurn = true;

    this._addLog(newState, `${player.name} invocó a ${card.name} al campo.`);
    return this._commit(newState, true, "Invocación exitosa.");
  }

  /**
   * Ataca de una carta a otra carta.
   */
  attackCard(attackerId, attackerCardIndex, defenderId, defenderCardIndex) {
    const newState = this._cloneState();
    if (newState.gameOver) return this._commit(newState, false, "El juego ya terminó.");
    if (newState.activePlayerId !== attackerId) return this._commit(newState, false, "No es tu turno.");
    if (newState.phase !== 'attack') return this._commit(newState, false, "Solo puedes atacar en la fase 'attack'.");

    const attacker = newState.players[attackerId];
    const defender = newState.players[defenderId];

    const aCard = attacker.field[attackerCardIndex];
    const dCard = defender.field[defenderCardIndex];

    if (!aCard) return this._commit(newState, false, "Carta atacante no válida.");
    if (!dCard) return this._commit(newState, false, "Carta defensora no válida.");
    if (aCard.hasAttacked) return this._commit(newState, false, "Esa carta ya atacó este turno.");

    if (defender.hasIronShield) {
      defender.hasIronShield = false;
      aCard.hasAttacked = true;
      attacker.hasAttackedThisTurn = true;
      this._addLog(newState, `El ataque de ${aCard.name} a ${dCard.name} fue bloqueado por Escudo Férreo!`);
      return this._commit(newState, true, "Ataque bloqueado.");
    }

    let effectiveAttack = aCard.attack_points - attacker.attackDebuff;
    if (effectiveAttack < 0) effectiveAttack = 0;
    
    if (aCard.hasCriticalHit) {
      effectiveAttack = Math.floor(effectiveAttack * 1.5);
      aCard.hasCriticalHit = false; // Consumir el crítico
      this._addLog(newState, `¡${aCard.name} asesta un Golpe Crítico!`);
    }

    const effectiveDefense = dCard.defense_points + (dCard.defBuff || 0);
    const dmg = effectiveAttack - effectiveDefense;

    if (dmg > 0) {
      dCard.hp_points -= dmg;
      this._addLog(newState, `${aCard.name} atacó a ${dCard.name} y causó ${dmg} daño.`);
      if (dCard.hp_points <= 0) {
        defender.graveyard.push(dCard);
        defender.field.splice(defenderCardIndex, 1);
        this._addLog(newState, `${dCard.name} ha sido destruida.`);
      }
    } else if (dmg <= 0) {
      const recoil = Math.abs(dmg) * 0.5;
      aCard.hp_points -= recoil;
      this._addLog(newState, `${aCard.name} atacó a ${dCard.name} pero no logró penetrar su defensa. Recibe ${recoil} daño de retroceso.`);
      if (aCard.hp_points <= 0) {
        attacker.graveyard.push(aCard);
        attacker.field.splice(attackerCardIndex, 1);
        this._addLog(newState, `¡La defensa destruyó a ${aCard.name}!`);
      }
    }

    aCard.hasAttacked = true;
    attacker.hasAttackedThisTurn = true;
    
    this.checkWinConditionInternal(newState);
    return this._commit(newState, true, "Ataque completado.");
  }

  /**
   * Ataque directo a los Life Points del oponente.
   */
  attackDirectly(attackerId, attackerCardIndex, defenderId) {
    const newState = this._cloneState();
    if (newState.gameOver) return this._commit(newState, false, "El juego ya terminó.");
    if (newState.activePlayerId !== attackerId) return this._commit(newState, false, "No es tu turno.");
    if (newState.phase !== 'attack') return this._commit(newState, false, "Solo puedes atacar en la fase 'attack'.");

    const attacker = newState.players[attackerId];
    const defender = newState.players[defenderId];
    
    if (defender.field.length > 0) return this._commit(newState, false, "No puedes atacar directamente si el oponente tiene cartas en el campo.");
    
    const aCard = attacker.field[attackerCardIndex];
    if (!aCard) return this._commit(newState, false, "Carta atacante no válida.");
    if (aCard.hasAttacked) return this._commit(newState, false, "Esa carta ya atacó este turno.");

    if (defender.hasIronShield) {
      defender.hasIronShield = false;
      aCard.hasAttacked = true;
      attacker.hasAttackedThisTurn = true;
      this._addLog(newState, `El ataque directo de ${aCard.name} fue bloqueado por Escudo Férreo!`);
      return this._commit(newState, true, "Ataque directo bloqueado.");
    }

    let effectiveAttack = aCard.attack_points - attacker.attackDebuff;
    if (effectiveAttack < 0) effectiveAttack = 0;

    if (aCard.hasCriticalHit) {
      effectiveAttack = Math.floor(effectiveAttack * 1.5);
      aCard.hasCriticalHit = false;
      this._addLog(newState, `¡${aCard.name} asesta un Golpe Crítico directo!`);
    }

    defender.lifePoints -= effectiveAttack;
    aCard.hasAttacked = true;
    attacker.hasAttackedThisTurn = true;

    this._addLog(newState, `${aCard.name} ataca directamente por ${effectiveAttack} de daño!`);
    
    this.checkWinConditionInternal(newState);
    return this._commit(newState, true, "Ataque directo completado.");
  }

  /**
   * Activa la habilidad de una carta en el campo.
   */
  activateAbility(playerId, cardIndex) {
    const newState = this._cloneState();
    if (newState.gameOver) return this._commit(newState, false, "El juego ya terminó.");
    if (newState.activePlayerId !== playerId) return this._commit(newState, false, "No es tu turno.");
    if (newState.phase !== 'main') return this._commit(newState, false, "Solo puedes usar habilidades en la fase 'main'.");

    const player = newState.players[playerId];
    if (player.hasUsedAbilityThisTurn) return this._commit(newState, false, "Ya usaste una habilidad este turno.");
    
    const card = player.field[cardIndex];
    if (!card) return this._commit(newState, false, "Carta inválida.");

    const oppId = this._getOpponentId(newState, playerId);
    const opponent = newState.players[oppId];
    
    const type = card.type_primary;
    let message = "";

    switch (type) {
      case 'fire':
        opponent.lifePoints -= 300;
        message = `${card.name} usó Llamarada: 300 de daño directo a ${opponent.name}.`;
        break;
      case 'water':
        player.lifePoints += 400;
        message = `${card.name} usó Marea Alta: Recupera 400 LP.`;
        break;
      case 'grass':
        player.lifePoints += 200;
        if (player.deck.length > 0) player.hand.push(player.deck.pop());
        message = `${card.name} usó Regeneración: Recupera 200 LP y roba 1 carta.`;
        break;
      case 'electric':
        opponent.attackDebuff += 200;
        message = `${card.name} usó Descarga: ATK enemigo reducido en 200 este turno.`;
        break;
      case 'psychic':
        for(let i=0; i<2; i++){
          if(player.deck.length > 0) player.hand.push(player.deck.pop());
        }
        message = `${card.name} usó Visión Futura: Roba 2 cartas.`;
        break;
      case 'dragon':
        if (player.lifePoints < 1500) {
          opponent.lifePoints -= 500;
          message = `${card.name} usó Furia Dragón: 500 de daño directo a ${opponent.name}.`;
        } else {
          return this._commit(newState, false, "Furia Dragón solo puede usarse si tienes menos de 1500 LP.");
        }
        break;
      case 'dark':
        if (opponent.field.length > 0) {
          const randIdx = Math.floor(Math.random() * opponent.field.length);
          const destroyed = opponent.field.splice(randIdx, 1)[0];
          opponent.graveyard.push(destroyed);
          message = `${card.name} usó Maldición: Destruyó a ${destroyed.name}.`;
        } else {
          message = `${card.name} usó Maldición pero el oponente no tiene cartas en el campo.`;
        }
        break;
      case 'steel':
        player.hasIronShield = true;
        message = `${card.name} usó Escudo Férreo: Bloqueará el siguiente ataque.`;
        break;
      case 'ghost':
        if (player.graveyard.length > 0 && player.field.length < 5) {
          const revived = player.graveyard.pop();
          revived.hasAttacked = false;
          revived.defBuff = 0;
          revived.hasCriticalHit = false;
          player.field.push(revived);
          message = `${card.name} usó Posesión: Revivió a ${revived.name}.`;
        } else {
          message = `${card.name} intentó usar Posesión pero no hay espacio o no hay cartas en el cementerio.`;
        }
        break;
      case 'fighting':
        card.hasCriticalHit = true;
        message = `${card.name} usó Golpe Crítico: Su próximo ataque causará x1.5 daño.`;
        break;
      default:
        card.defBuff = (card.defBuff || 0) + 300;
        message = `${card.name} usó Instinto: Su defensa aumenta 300 por 1 turno.`;
        break;
    }

    player.hasUsedAbilityThisTurn = true;
    this._addLog(newState, message);
    this.checkWinConditionInternal(newState);

    return this._commit(newState, true, message);
  }

  /**
   * Finaliza el turno del jugador activo.
   */
  endTurn(playerId) {
    const newState = this._cloneState();
    if (newState.gameOver) return this._commit(newState, false, "El juego ya terminó.");
    if (newState.activePlayerId !== playerId) return this._commit(newState, false, "No es tu turno.");

    const player = newState.players[playerId];
    
    // Limpiar estados temporales del jugador actual
    player.hasDrawnThisTurn = false;
    player.hasSummonedThisTurn = false;
    player.hasUsedAbilityThisTurn = false;
    player.hasAttackedThisTurn = false;
    player.attackDebuff = 0; // El debuff expira

    // Limpiar estados temporales de sus cartas
    player.field.forEach(c => {
      c.hasAttacked = false;
      c.defBuff = 0;
    });

    const oppId = this._getOpponentId(newState, playerId);
    
    newState.activePlayerId = oppId;
    newState.phase = 'draw';
    newState.turn += 1;

    this._addLog(newState, `Fin del turno de ${player.name}. Turno ${newState.turn}: ¡Es el turno de ${newState.players[oppId].name}!`);

    return this._commit(newState, true, "Turno finalizado.");
  }

  /**
   * Avanza a la siguiente fase en la secuencia.
   */
  nextPhase(playerId) {
    const newState = this._cloneState();
    if (newState.gameOver) return this._commit(newState, false, "El juego ya terminó.");
    if (newState.activePlayerId !== playerId) return this._commit(newState, false, "No es tu turno.");

    const phases = ['draw', 'main', 'attack', 'end'];
    const currentIdx = phases.indexOf(newState.phase);

    if (currentIdx === 3) {
      return this.endTurn(playerId);
    }

    newState.phase = phases[currentIdx + 1];
    this._addLog(newState, `${newState.players[playerId].name} entra a la fase '${newState.phase}'.`);

    return this._commit(newState, true, `Fase avanzada a ${newState.phase}.`);
  }

  /**
   * Uso interno para validar las condiciones de victoria sin clonar.
   */
  checkWinConditionInternal(state) {
    if (state.gameOver) return;

    const pKeys = Object.keys(state.players);
    const p1 = state.players[pKeys[0]];
    const p2 = state.players[pKeys[1]];

    if (p1.lifePoints <= 0) {
      state.gameOver = true;
      state.winner = p2.id;
      this._addLog(state, `Los Life Points de ${p1.name} llegaron a 0. ¡${p2.name} gana!`);
    } else if (p2.lifePoints <= 0) {
      state.gameOver = true;
      state.winner = p1.id;
      this._addLog(state, `Los Life Points de ${p2.name} llegaron a 0. ¡${p1.name} gana!`);
    }
  }

  /**
   * Verifica condiciones de victoria manualmente (incluyendo rendición si se desea).
   */
  checkWinCondition(playerId, surrender = false) {
    const newState = this._cloneState();
    
    if (surrender && playerId) {
      newState.gameOver = true;
      newState.winner = this._getOpponentId(newState, playerId);
      this._addLog(newState, `${newState.players[playerId].name} se ha rendido. ¡${newState.players[newState.winner].name} gana!`);
      return this._commit(newState, true, "Rendición procesada.");
    }

    this.checkWinConditionInternal(newState);
    return this._commit(newState, true, "Condición de victoria verificada.");
  }

  /**
   * Serializa el estado actual para guardarlo en DB.
   */
  serializeState() {
    return JSON.stringify(this.state);
  }

  /**
   * Carga un estado preexistente desde un string JSON.
   */
  loadState(jsonString) {
    try {
      this.state = JSON.parse(jsonString);
      return { success: true, message: "Estado cargado correctamente.", state: this.state };
    } catch (e) {
      return { success: false, message: "Error al deserializar el estado.", state: this.state };
    }
  }
}
