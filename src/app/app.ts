import { Component, signal, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GamePortalComponent } from './components/game-portal/game-portal.component';
import { GameBoardComponent } from './components/game-board/game-board.component';
import { DeckBuilderComponent } from './components/deck-builder/deck-builder.component';
import { Auth } from './components/auth/auth';
import sqliteClient from '../lib/sqliteClient';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { Subscription } from 'rxjs';
import { HistoryComponent } from './components/history/history.component';
import { MatchResultComponent } from './components/match-result/match-result.component';
import { RulesComponent } from './components/rules/rules.component';
import { AudioService } from '../services/audio.service';
import { MultiplayerService } from './services/multiplayer.service';
import { LobbyComponent } from './components/lobby/lobby.component';

@Component({
  selector: 'app-root',
  imports: [CommonModule, GamePortalComponent, GameBoardComponent, DeckBuilderComponent, Auth, HistoryComponent, MatchResultComponent, RulesComponent, LobbyComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('pokemon-proyecto');

  currentScreen = 'auth';
  private authSub!: Subscription;

  showRules = false;
  matchResultData: any = {};

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: SupabaseAuthService,
    private audioService: AudioService,
    private multiplayerService: MultiplayerService
  ) { }

  isMultiplayer = false;
  isHost = false;
  matchStarted = false;
  private multiSub!: Subscription;

  ngOnInit() {
    this.authSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        const oldId = this.player.id;
        this.player.id = user.id;
        if (oldId !== user.id) {
           this.gameState.players[user.id] = this.player;
           delete this.gameState.players[oldId];
        }
        if (user.user_metadata && user.user_metadata['username']) {
            this.player.name = user.user_metadata['username'];
        } else if (user.email) {
            this.player.name = user.email.split('@')[0];
        }
        // Redirección automática si hay sesión (Equivalente al AuthGuard canActivate = true)
        if (this.currentScreen === 'auth') {
          this.setScreen('portal');
        }
      } else {
        // Bloqueo y redirección estricta si no hay sesión (Equivalente al AuthGuard canActivate = false)
        const oldId = this.player.id;
        this.player.id = 'p1';
        if (oldId !== 'p1') {
           this.gameState.players['p1'] = this.player;
           delete this.gameState.players[oldId];
        }
        this.setScreen('auth');
        this.clearGameState();
      }
      this.cdr.detectChanges();
    });

    this.multiSub = this.multiplayerService.onStartMatch.subscribe((payload: any) => {
      if (payload && payload.isMultiplayer) {
        this.startMatch('pvp');
        this.isMultiplayer = true;
        this.isHost = payload.isHost;
      }
    });

    // EJECUTAR SIMULACIÓN DE PRUEBA
    // this.simulateTestMatch(); // Desactivado para evitar bloqueos y spam en consola

    // Start background music loop (will wait for user interaction per browser policy)
    // this.audioService.playMainMenuTheme();

    // Resume audio context on first click
    /*
    const resumeAudio = () => {
      this.audioService.playMainMenuTheme();
      document.removeEventListener('click', resumeAudio);
    };
    document.addEventListener('click', resumeAudio);
    */
  }

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
    if (this.multiSub) this.multiSub.unsubscribe();
  }

  clearGameState() {
    this.player.deck = [];
    this.player.hand = [];
    this.player.monsters = new Array(5).fill(null);
    this.player.spells = new Array(5).fill(null);
    this.player.lifePoints = 4000;
    this.opponent.deck = [];
    this.opponent.hand = [];
    this.opponent.monsters = new Array(5).fill(null);
    this.opponent.spells = new Array(5).fill(null);
    this.opponent.lifePoints = 4000;
    this.gameState.gameOver = true;
    this.matchStarted = false;
  }

  setScreen(screen: string) {
    this.currentScreen = screen;
    if (screen === 'portal' || screen === 'auth' || screen === 'results') {
      this.audioService.playMainMenuTheme();
    } else if (screen === 'game') {
      this.audioService.playBattleTheme();
    }
  }

  player: any = {
    id: 'p1',
    name: 'Tinoc',
    lifePoints: 4000,
    hand: [
      { name: 'Pikachu', image_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png', type_primary: 'electric', attack_points: 1200, defense_points: 900, hp_points: 1500, rarity: 'common', level: 3, special_ability: 'Descarga' },
      { name: 'Charizard', image_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png', type_primary: 'fire', attack_points: 2600, defense_points: 1800, hp_points: 3600, rarity: 'legendary', level: 8, special_ability: 'Llamarada' }
    ],
    deck: new Array(20),
    monsters: new Array(5).fill(null),
    spells: new Array(5).fill(null),
    graveyard: [],
    hasDrawnThisTurn: false,
    hasSummonedThisTurn: false
  };

  opponent: any = {
    id: 'ai_player',
    name: 'Rival (IA)',
    lifePoints: 4000,
    hand: new Array(4),
    deck: new Array(15),
    monsters: new Array(5).fill(null),
    spells: new Array(5).fill(null),
    graveyard: []
  };

  gameState: any = {
    phase: 'draw',
    turn: 1,
    activePlayerId: 'p1',
    players: {
      'p1': this.player,
      'ai_player': this.opponent
    },
    winner: null,
    gameOver: false,
    log: []
  };

  shuffle(array: any[]) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  }

  generateRandomDeck(allCards: any[]): any[] {
    const deck = [];
    let highDamageCount = 0;
    const shuffledCatalog = this.shuffle([...allCards]);

    for (const card of shuffledCatalog) {
      if (deck.length >= 20) break;
      if (card.card_category !== 'trainer' && card.attack_points >= 1000) {
        if (highDamageCount >= 1) continue;
        highDamageCount++;
      }
      deck.push({ ...card });
      if (deck.length < 20 && Math.random() > 0.5) {
        deck.push({ ...card });
      }
    }
    while (deck.length < 20) {
      deck.push({ ...shuffledCatalog[0] });
    }
    return deck.slice(0, 20);
  }

  generateRivalDeck(allCardsPool: any[]): any[] {
    let deck: any[] = [];

    // Filtrar cartas
    const spellCards = allCardsPool.filter(c => c.card_category === 'trainer');
    const monsterCards = allCardsPool.filter(c => c.card_category !== 'trainer');

    // Regla 3: Exactamente 8 magias/hechizos
    const shuffledSpells = this.shuffle([...spellCards]);
    for (let i = 0; i < 8; i++) {
      if (shuffledSpells.length > 0) {
        deck.push({ ...shuffledSpells[i % shuffledSpells.length] });
      }
    }

    // Regla 1: 1 a 3 legendarios/jefes
    const bossCards = monsterCards.filter(c => c.rarity === 'legendary' || c.level >= 7 || ['Mewtwo', 'Arceus', 'Giratina', 'Charizard', 'Rayquaza'].includes(c.name));
    const shuffledBosses = this.shuffle([...bossCards]);
    const numBosses = Math.floor(Math.random() * 3) + 1; // 1 to 3
    for (let i = 0; i < numBosses; i++) {
      if (shuffledBosses[i]) {
        deck.push({ ...shuffledBosses[i] });
      }
    }

    // Regla 2: 2 o 3 líneas evolutivas
    const numLines = Math.floor(Math.random() * 2) + 2; // 2 to 3
    let linesAdded = 0;

    const bases = monsterCards.filter(c => !c.pre_evolution_name && (!c.stage || c.stage === 0));
    const shuffledBases = this.shuffle([...bases]);

    for (const baseCard of shuffledBases) {
      if (linesAdded >= numLines) break;
      if (deck.length >= 20) break;

      const stage1 = monsterCards.find(c => c.pre_evolution_name === baseCard.name);
      if (stage1) {
        deck.push({ ...baseCard });
        deck.push({ ...stage1 });
        const stage2 = monsterCards.find(c => c.pre_evolution_name === stage1.name);
        if (stage2) deck.push({ ...stage2 });
        linesAdded++;
      }
    }

    // Completar el resto con monstruos base fuertes
    const strongBases = [...bases].sort((a: any, b: any) => (b.attack_points || 0) - (a.attack_points || 0));
    let baseIndex = 0;
    while (deck.length < 20) {
      if (strongBases[baseIndex]) {
        deck.push({ ...strongBases[baseIndex] });
        baseIndex++;
      } else if (shuffledBases[0]) {
        deck.push({ ...shuffledBases[0] });
      }
    }

    // Regla 4: Shuffle final
    return this.shuffle(deck.slice(0, 20));
  }


  startMatch(type: string) {
    if (type === 'lobby') {
      this.setScreen('lobby');
      return;
    }
    if (type !== 'pve' && type !== 'pvp') {
      this.currentScreen = 'game';
      return;
    }
    this.isMultiplayer = type === 'pvp';

    const allCardsRaw = sqliteClient.getCachedCards();
    if (!allCardsRaw || allCardsRaw.length === 0) {
      console.error("No hay cartas cargadas en la BD.");
      return;
    }

    // Sanitizar stats para evitar NaN si la base de datos es antigua
    const allCards = allCardsRaw.map((c: any) => {
      const hp = Number(c.hp_points) || Math.floor(Math.random() * 80 + 20) * 10;
      return {
        ...c,
        attack_points: Number(c.attack_points) || Math.floor(Math.random() * 50 + 10) * 10,
        defense_points: Number(c.defense_points) || Math.floor(Math.random() * 50 + 10) * 10,
        hp_points: hp,
        base_hp: hp
      };
    });

    const aiDeck = this.generateRivalDeck(allCards);

    let playerDeck = [];
    try {
      const saved = sqliteClient.queryAll('SELECT card_ids FROM local_decks WHERE deck_id = ? ORDER BY id DESC LIMIT 1', ['default']);
      if (saved && saved.length > 0) {
        const ids = JSON.parse(saved[0].card_ids);
        playerDeck = ids.map((id: number) => {
          const found = allCards.find(c => c.pokemon_id === id);
          return found ? { ...found } : null;
        }).filter((c: any) => c);
      }
    } catch (e) { console.error('Error cargando mazo', e); }

    if (playerDeck.length !== 20) {
      console.warn('Mazo no encontrado o incompleto. Usando aleatorio.');
      playerDeck = this.generateRandomDeck(allCards);
    }

    this.player.deck = this.shuffle([...playerDeck]);
    this.player.hand = [];
    this.player.monsters = new Array(5).fill(null);
    this.player.spells = new Array(5).fill(null);
    this.player.graveyard = [];
    this.player.lifePoints = 4000;
    this.player.hasDrawnThisTurn = false;
    this.player.hasSummonedThisTurn = false;

    this.opponent.deck = this.shuffle([...aiDeck]);
    this.opponent.hand = [];
    this.opponent.monsters = new Array(5).fill(null);
    this.opponent.spells = new Array(5).fill(null);
    this.opponent.graveyard = [];
    this.opponent.lifePoints = 4000;

    // La fase inicia en WAITING mientras gira la moneda
    this.gameState.phase = 'WAITING';
    this.gameState.turn = 1;
    this.gameState.activePlayerId = null;
    this.gameState.winner = null;
    this.gameState.gameOver = false;
    this.gameState.log = [
      '[Sistema] Esperando resultado del volado...'
    ];

    this.gameState = { ...this.gameState };
    this.setScreen('game');
  }

  drawInitialHands() {
    this.matchStarted = true;
    for (let i = 0; i < 4; i++) {
      if (this.player.deck.length > 0) this.player.hand.push(this.player.deck.pop());
      if (this.opponent.deck.length > 0) this.opponent.hand.push(this.opponent.deck.pop());
    }
    this.gameState.phase = 'DRAW';
    if (this.gameState.activePlayerId === 'p1' || this.gameState.activePlayerId === this.player.id) {
       this.gameState.log.push('[JUEGO] Tu turno. Roba una carta para iniciar.');
    }
    this.gameState = { ...this.gameState };

    // Si la IA va primero, empieza su turno (solo si NO es multijugador)
    if (this.gameState.activePlayerId === 'ai_player' && !this.isMultiplayer) {
      this.executeAITurn();
    }
  }

  async executeAITurn() {
    const opp = this.opponent;
    const p = this.player;

    const log = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      this.gameState.log = [...this.gameState.log, `[${time}] ${msg}`];
      this.gameState = { ...this.gameState };
      this.cdr.detectChanges();
    };

    if (this.gameState.gameOver) return;

    try {
      // ROBO (DRAW)
      this.gameState.phase = 'DRAW';
      log('El Rival (IA) inicia su turno (Fase DRAW).');
      this.processPhaseEffects('DRAW');
      this.gameState = { ...this.gameState };
      this.cdr.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (opp.deck.length > 0) {
        opp.hand.push(opp.deck.pop());
        log('El Rival robó una carta.');
      }

      // STANDBY PHASE (Simulada)
      this.gameState.phase = 'STANDBY';
      this.processPhaseEffects('STANDBY');
      this.gameState = { ...this.gameState };
      this.cdr.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 500));

      // PRINCIPAL (MAIN 1)
      this.gameState.phase = 'MAIN 1';
      log('El Rival pasa a Fase MAIN 1.');
      this.gameState = { ...this.gameState };
      this.cdr.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 1000));

      opp.hasSummonedThisTurn = false;

      // Paso A: Bajar Hechizos (Spells/Traps)
      for (let i = opp.hand.length - 1; i >= 0; i--) {
        const card = opp.hand[i];
        if (card && card.card_category === 'trainer') {
          const emptySpellIndex = opp.spells.findIndex((s: any) => s === null);
          if (emptySpellIndex !== -1) {
            opp.spells[emptySpellIndex] = card;
            opp.hand.splice(i, 1);
            card.isFaceDown = card.ability === 'Trampa';
            log(`El Rival ha colocado una carta mágica/trampa.`);
            this.gameState = { ...this.gameState };
            this.cdr.detectChanges();
            await new Promise(resolve => setTimeout(resolve, 600));
          }
        }
      }

      // Paso B: Bajar/Evolucionar Monstruos
      for (let i = opp.hand.length - 1; i >= 0; i--) {
        const card = opp.hand[i];
        if (card && card.card_category !== 'trainer') {
          let evolved = false;
          // Intentar evolucionar
          if (card.pre_evolution_name) {
            const baseIndex = opp.monsters.findIndex((m: any) => m && m.name === card.pre_evolution_name);
            if (baseIndex !== -1) {
              const baseCard = opp.monsters[baseIndex];
              card.base_hp = card.hp_points;
              const damageTaken = (baseCard.base_hp || baseCard.hp_points) - baseCard.hp_points;
              card.hp_points -= damageTaken;
              card.hasAttacked = false;
              opp.monsters[baseIndex] = card;
              opp.hand.splice(i, 1);
              evolved = true;
              log(`¡El Rival ha evolucionado a ${baseCard.name} en ${card.name}!`);
              this.gameState = { ...this.gameState };
              this.cdr.detectChanges();
              await new Promise(resolve => setTimeout(resolve, 600));
              continue;
            }
          }

          // Invocación Normal
          if (!evolved && !opp.hasSummonedThisTurn && (!card.pre_evolution_name && (!card.stage || card.stage === 0))) {
            const emptyIndex = opp.monsters.findIndex((m: any) => m === null);
            if (emptyIndex !== -1) {
              card.hasAttacked = false;
              card.base_hp = card.hp_points;
              opp.monsters[emptyIndex] = card;
              opp.hasSummonedThisTurn = true;
              opp.hand.splice(i, 1);
              log(`El Rival ha invocado a ${card.name}.`);
              this.gameState = { ...this.gameState };
              this.cdr.detectChanges();
              await new Promise(resolve => setTimeout(resolve, 600));
            }
          }
        }
      }

      // Paso C: Activación de Habilidades Automáticas e Inteligentes
      const allFieldCards = [...opp.monsters, ...opp.spells];
      for (let i = 0; i < allFieldCards.length; i++) {
        const card = allFieldCards[i];
        if (card && card.special_ability && card.special_ability !== 'None' && !card.hasUsedAbilityThisTurn && !card.isFaceDown) {
          const ab = card.special_ability.toLowerCase();
          let shouldActivate = false;

          if (ab.includes('recupera') || ab.includes('cura')) {
            const needsHealing = opp.monsters.some((m: any) => m && m.hp_points < (m.base_hp || 100));
            if (needsHealing || opp.lifePoints < 4000) shouldActivate = true;
          } else {
            shouldActivate = true;
          }

          if (shouldActivate) {
            card.hasUsedAbilityThisTurn = true;
            log(`¡Rival activa la habilidad de ${card.name}!`);
            if (card.card_category !== 'trainer') {
              this.resolvePokemonEffect(card, opp, p);
            } else {
              // Si fuera necesario para magias que tuvieran "special_ability"
              // this.resolveSpellTrapEffect(i - 5, card, opp, p);
            }
            this.gameState = { ...this.gameState };
            this.cdr.detectChanges();
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      }

      // ATAQUE (BATTLE)
      this.gameState.phase = 'BATTLE';
      log('El Rival pasa a Fase BATTLE.');
      this.gameState = { ...this.gameState };
      this.cdr.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const attackers = opp.monsters.filter((m: any) => m !== null && !m.hasAttacked);
      for (const attacker of attackers) {
        const defenders = p.monsters.filter((m: any) => m !== null);

        if (defenders.length > 0) {
          // Priorizar atacar al Pokémon más débil
          const weakestDefender = defenders.sort((a: any, b: any) => {
            const aWeakness = Math.min(a.hp_points, a.defense_points);
            const bWeakness = Math.min(b.hp_points, b.defense_points);
            return aWeakness - bWeakness;
          })[0];

          this.calculateBattle(attacker, weakestDefender, opp, p, p.monsters.indexOf(weakestDefender));

          if (p.lifePoints <= 0) {
            this.gameState.gameOver = true;
            this.gameState.winner = 'ai_player';
            log(`¡El Rival (IA) te ha derrotado!`);
            this.gameState = { ...this.gameState };
            return;
          }
        } else {
          // Ataque directo
          const damage = attacker.attack_points;
          p.lifePoints -= damage;
          log(`Rival ataca directo con ${attacker.name} causando ${damage} de daño!`);
          attacker.hasAttacked = true;
          this.gameState = { ...this.gameState };

          this.checkWinCondition();
          if (this.gameState.gameOver) return;
        }
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      // MAIN 2 (Simulada)
      this.gameState.phase = 'MAIN 2';
      this.gameState = { ...this.gameState };
      this.cdr.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 500));

      this.gameState.phase = 'END';
      log('El Rival pasa a Fase END.');
      this.gameState = { ...this.gameState };
      this.cdr.detectChanges();
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.gameState.turn++;
      this.gameState.activePlayerId = this.player.id;
      this.gameState.phase = 'DRAW';
      this.processPhaseEffects('DRAW');
      p.hasDrawnThisTurn = false;
      p.hasSummonedThisTurn = false;
      p.monsters.forEach((m: any) => m && (m.hasAttacked = false));
      log(`Turno ${this.gameState.turn}: ¡Es tu turno! Roba una carta.`);
      this.gameState = { ...this.gameState };
      this.cdr.detectChanges();

    } catch (e) { console.error('Error in AI turn', e); }
  }

  onGameAction(event: any) {
    const p = this.player;
    const opp = this.opponent;
    const isPlayerTurn = this.gameState.activePlayerId === this.player.id;

    const log = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      this.gameState.log = [...this.gameState.log, `[${time}] ${msg}`];
      this.gameState = { ...this.gameState };
    };

    if (this.gameState.gameOver) return;

    if (event.actionType === 'coinTossComplete') {
      const isPlayerFirst = event.payload.isPlayerFirst;
      this.gameState.activePlayerId = isPlayerFirst ? this.player.id : 'ai_player';
      this.drawInitialHands();
      return;
    }

    if (event.actionType === 'drawCard') {
      if (!isPlayerTurn) { log('[Sistema] No es tu turno.'); return; }
      if (this.gameState.phase !== 'DRAW') { log('[Sistema] No puedes robar en esta fase.'); return; }
      if (p.hasDrawnThisTurn) { log('[Sistema] Ya robaste carta.'); return; }

      if (p.deck.length > 0) {
        p.hand.push(p.deck.pop());
        p.hasDrawnThisTurn = true;
        log('Robaste una carta.');
        this.gameState = { ...this.gameState };
      } else {
        log('[Sistema] No quedan cartas en el mazo.');
      }
    }

    if (event.actionType === 'nextPhase') {
      if (!isPlayerTurn) { log('[Sistema] No es tu turno.'); return; }
      if (this.gameState.phase === 'DRAW') {
        this.gameState.phase = 'STANDBY';
        this.processPhaseEffects('STANDBY');
      } else if (this.gameState.phase === 'STANDBY') {
        this.gameState.phase = 'MAIN 1';
        log('Pasas a Fase MAIN 1.');
      } else if (this.gameState.phase === 'MAIN 1') {
        this.gameState.phase = 'BATTLE';
        log('Pasas a Fase BATTLE.');
      } else if (this.gameState.phase === 'BATTLE') {
        this.gameState.phase = 'MAIN 2';
        log('Pasas a Fase MAIN 2.');
      } else if (this.gameState.phase === 'MAIN 2') {
        this.gameState.phase = 'END';
        log('Pasas a Fase END.');
      } else if (this.gameState.phase === 'END') {
        log('Terminas tu turno.');
        
        if (this.isMultiplayer) {
          // Asignar el turno al rival localmente (El oponente ya debió recibir END_TURN desde el game-board)
          this.gameState.activePlayerId = this.opponent.id;
        } else {
          this.gameState.activePlayerId = 'ai_player';
          this.gameState.phase = 'DRAW';
          this.executeAITurn();
        }
      }
      this.gameState = { ...this.gameState };
    }

    if (event.actionType === 'summonCard') {
      if (!isPlayerTurn || (this.gameState.phase !== 'MAIN 1' && this.gameState.phase !== 'MAIN 2')) return;
      const index = event.payload.cardIndex;
      const card = p.hand[index];
      if (!card) return;

      if (card.card_category === 'trainer') {
        const sIndex = p.spells.findIndex((s: any) => s === null);
        if (sIndex === -1) { log('[Sistema] No hay espacio en la zona de Magias/Trampas.'); return; }
        
        p.spells[sIndex] = card;
        p.hand.splice(index, 1);
        card.isFaceDown = card.ability === 'Trampa';
        log(`Activaste la carta ${card.card_category}: ${card.name}`);
        this.gameState = { ...this.gameState };
        return;
      }

      const isEvolution = card.level > 1 || card.pre_evolution_name || (card.stage && card.stage > 0);
      let fieldIndex = -1;

      if (isEvolution) {
        fieldIndex = p.monsters.findIndex((m: any) => m !== null && m.name === card.pre_evolution_name);
        if (fieldIndex === -1) {
          log(`[Sistema] Necesitas a su pre-evolución (${card.pre_evolution_name || 'Desconocido'}) en el campo para evolucionar a ${card.name}.`);
          return;
        }
      } else {
        fieldIndex = p.monsters.findIndex((m: any) => m === null);
        if (fieldIndex === -1) { log('[Sistema] No hay espacio en la zona de monstruos.'); return; }
      }

      const existing = p.monsters[fieldIndex];
      if (existing) {
        if (existing.name === card.pre_evolution_name) {
          const damageTaken = existing.hp_points < (existing.base_hp || existing.hp_points) ? (existing.base_hp || existing.hp_points) - existing.hp_points : 0;
          card.base_hp = card.hp_points;
          card.hp_points -= damageTaken;
          p.graveyard.push(existing);
          p.hand.splice(index, 1);
          p.monsters[fieldIndex] = card;
          log(`¡${existing.name} evolucionó a ${card.name}!`);
        } else {
          log('[Sistema] Ya hay un Pokémon en este slot y no puedes evolucionarlo con esa carta.');
          return;
        }
      } else {
        if (p.hasSummonedThisTurn) { log('[Sistema] Ya invocaste un Pokémon este turno.'); return; }
        card.hasAttacked = false;
        card.hasUsedAbilityThisTurn = false;
        card.base_hp = card.hp_points;
        p.monsters[fieldIndex] = card;
        p.hand.splice(index, 1);
        p.hasSummonedThisTurn = true;
        log(`Invocaste a ${card.name}.`);
      }
      this.gameState = { ...this.gameState };
    }

    if (event.actionType === 'attackCard') {
      if (!isPlayerTurn || this.gameState.phase !== 'BATTLE') return;
      const { attackerCardIndex: attackerIndex, defenderCardIndex: defenderIndex } = event.payload;
      const attacker = p.monsters[attackerIndex];
      const defender = opp.monsters[defenderIndex];
      if (!attacker || !defender) return;
      if (attacker.hasAttacked) { log('[Sistema] Este Pokémon ya atacó.'); return; }

      // TRAP INTERCEPT LOGIC
      for (let i = 0; i < opp.spells.length; i++) {
        const trap = opp.spells[i];
        if (trap && trap.isFaceDown && trap.ability === 'Trampa') {
          if (trap.name === 'Pantalla de Luz') {
            log(`¡El rival activó la trampa ${trap.name}!`);
            log(`¡El ataque fue interceptado y ${attacker.name} fue destruido!`);
            p.graveyard.push(attacker);
            p.monsters[attackerIndex] = null;
            opp.graveyard.push(trap);
            opp.spells[i] = null;
            this.applyModifiers();
            this.gameState = { ...this.gameState };
            return;
          }
          if (trap.name === 'Llamado del Alto Mando') {
            log(`¡El rival activó la trampa ${trap.name}!`);
            log(`¡No puedes declarar ataques este turno!`);
            opp.graveyard.push(trap);
            opp.spells[i] = null;
            this.gameState = { ...this.gameState };
            return;
          }
        }
      }

      this.calculateBattle(attacker, defender, p, opp, defenderIndex);
      this.applyModifiers();
      this.checkWinCondition();
      this.gameState = { ...this.gameState };
    }

    if (event.actionType === 'attackDirectly') {
      if (!isPlayerTurn || this.gameState.phase !== 'BATTLE') return;
      const attackerIndex = event.payload.attackerCardIndex;
      const attacker = p.monsters[attackerIndex];
      if (!attacker) return;
      if (attacker.hasAttacked) { log('[Sistema] Este Pokémon ya atacó.'); return; }

      const oppHasMonsters = opp.monsters.some((m: any) => m !== null);
      if (oppHasMonsters) { log('[Sistema] No puedes atacar directo si el Rival tiene Pokémon.'); return; }

      opp.lifePoints -= attacker.attack_points;
      attacker.hasAttacked = true;
      log(`Ataque directo con ${attacker.name} por ${attacker.attack_points} de daño.`);
      this.gameState = { ...this.gameState };

      this.checkWinCondition();
    }

    if (event.actionType === 'activateEffect') {
      const index = event.payload.monsterIndex;
      const monster = p.monsters[index];
      if (!monster) return;

      if (monster.hasUsedAbilityThisTurn) {
        log('[Sistema] Esta habilidad ya fue utilizada en este turno.');
        return;
      }

      monster.hasUsedAbilityThisTurn = true;
      this.resolvePokemonEffect(monster, p, opp);
      this.applyModifiers();
      this.gameState = { ...this.gameState };
    }

    if (event.actionType === 'activateSpellTrap') {
      const spellIndex = event.payload.spellIndex;
      const card = p.spells[spellIndex];
      if (!card) return;

      log(`Activaste el efecto de: ${card.name}`);
      card.isFaceDown = false;

      this.resolveInstantSpell(card, p, opp, spellIndex);
      this.applyModifiers();
      this.gameState = { ...this.gameState };
    }

    if (event.actionType === 'surrender') {
      this.gameState.gameOver = true;
      this.gameState.winner = this.opponent.id;
      log(`Te has rendido.`);
      this.gameState = { ...this.gameState };
    }
  }

  checkWinCondition() {
    if (!this.matchStarted || this.player.lifePoints === undefined || this.opponent.lifePoints === undefined) {
      return; 
    }

    let gameOverTriggered = false;

    if (this.opponent.lifePoints <= 0) {
      this.opponent.lifePoints = 0;
      this.gameState.gameOver = true;
      this.gameState.winner = this.player.id;
      this.gameState.log.push(`[SISTEMA] ¡Los LP del Rival llegaron a 0! HAS GANADO.`);
      gameOverTriggered = true;
    } else if (this.player.lifePoints <= 0) {
      this.player.lifePoints = 0;
      this.gameState.gameOver = true;
      this.gameState.winner = this.opponent.id;
      this.gameState.log.push(`[SISTEMA] ¡Tus LP llegaron a 0! HAS SIDO DERROTADO.`);
      gameOverTriggered = true;
    }

    if (gameOverTriggered) {
      this.gameState = { ...this.gameState };
      this.cdr.detectChanges();
      this.audioService.lowerBattleVolume();
    }
  }

  calculateBattle(attacker: any, defender: any, attackerPlayer: any, defenderPlayer: any, defenderIndex: number) {
    const log = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      this.gameState.log.push(`[${time}] ${msg}`);
    };

    // Lógica del Damage Step: Cartas Boca Abajo y Volteo
    let flipped = false;
    if (defender.isFaceDown) {
      defender.isFaceDown = false;
      flipped = true;
      log(`¡${defender.name} fue volteado boca arriba!`);
    }

    let atkValue = Number(attacker.current_atk) || Number(attacker.attack_points) || 0;
    let defValue = Number(defender.current_def) || Number(defender.defense_points) || 0;

    // Modificadores de Campo (simulados)
    const hasCielos = attackerPlayer.spells.some((s: any) => s && s.name === 'Cielos Tempestuosos');
    if (attacker.type_primary === 'flying' && hasCielos) attacker.hasPiercingDamage = true; // Agregamos la propiedad de daño penetrante dinámicamente

    const hasCordillera = defenderPlayer.spells.some((s: any) => s && s.name === 'Cordillera Inquebrantable');
    if (defender.type_primary === 'rock' && hasCordillera) defValue += 200; // Defensa robusta

    log(`Ataque de ${attacker.name} (${atkValue} ATK) vs ${defender.name} (${defValue} DEF).`);
    attacker.hasAttacked = true;

    let destroyed = false;

    // 1. Lógica de Reducción de Vida (Pokémon)
    let damage = Math.max(0, atkValue - (defValue * 0.5)); // La defensa mitiga la mitad para no hacerla inútil
    if (attacker.hasPiercingDamage) {
      damage = atkValue; // Daño penetrante ignora defensa
    }

    defender.hp_points -= damage;
    log(`¡${attacker.name} ataca a ${defender.name}! Le resta ${damage} HP (HP restante: ${defender.hp_points}).`);

    if (defender.hp_points <= 0) {
      destroyed = true;
      const overflowDamage = Math.abs(defender.hp_points);
      defenderPlayer.lifePoints -= overflowDamage;
      log(`¡${defender.name} fue derrotado! El jugador recibe ${overflowDamage} LP de daño por exceso.`);
    }

    // Lógica de FLIP (Volteo) post-cálculo
    if (flipped && defender.flipEffect) {
      log(`¡Efecto FLIP de ${defender.name} activado!`);
      this.resolveFlipEffect(defender, attackerPlayer, defenderPlayer);
    }

    if (destroyed) {
      defenderPlayer.graveyard.push(defender);
      defenderPlayer.monsters[defenderIndex] = null;
    }

    this.gameState = { ...this.gameState };
    this.checkWinCondition();
  }

  resolveFlipEffect(card: any, attackerPlayer: any, defenderPlayer: any) {
    const log = (msg: string) => {
      const time = new Date().toLocaleTimeString();
      this.gameState.log.push(`[${time}] [FLIP] ${msg}`);
    };

    if (card.flipEffect === 'DRAW') {
      if (defenderPlayer.deck.length > 0) defenderPlayer.hand.push(defenderPlayer.deck.pop());
      log(`${defenderPlayer.name} robó 1 carta por efecto de volteo.`);
    }
  }

  processPhaseEffects(phase: string) {
    const p1 = this.player;
    const ai = this.opponent;
    [p1, ai].forEach(owner => {
      const opp = owner.id === p1.id ? ai : p1;
      owner.spells.forEach((s: any) => {
        if (!s || s.isFaceDown || s.ability === 'Trampa') return;
        if (phase === 'STANDBY') {
          if (this.gameState.activePlayerId === owner.id) {
            owner.monsters.forEach((m: any) => { if (m) m.hasUsedAbilityThisTurn = false; });
          }
          if (s.name === 'Bosque Milenario') {
            owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'grass') m.hp_points += 200; });
            this.gameState.log.push(`[${s.name}] restauró 200 HP a Pokémon Planta de ${owner.name}.`);
          }
          if (s.name === 'Jardín Místico') {
            owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'fairy') m.hp_points += 300; });
            this.gameState.log.push(`[${s.name}] restauró 300 HP a Pokémon Hada de ${owner.name}.`);
          }
          if (s.name === 'Pantano Tóxico') {
            const hasPoison = owner.monsters.some((m: any) => m && m.type_primary === 'poison');
            if (hasPoison) {
              opp.lifePoints -= 100;
              this.gameState.log.push(`[${s.name}] infligió 100 de daño por veneno a ${opp.name}.`);
              this.checkWinCondition();
            }
          }
        }
      });
    });

    if (phase === 'DRAW') {
      [p1, ai].forEach(owner => {
        if (this.gameState.activePlayerId !== owner.id) return; // Sólo roba el activo
        const hasPsychic = owner.monsters.some((m: any) => m && m.type_primary === 'psychic');
        const hasDimension = owner.spells.some((s: any) => s && s.name === 'Dimensión Mental');
        if (hasPsychic && hasDimension && owner.deck.length > 0) {
          owner.hand.push(owner.deck.pop());
          this.gameState.log.push(`[Dimensión Mental] ${owner.name} robó una carta extra.`);
        }
      });
    }
  }

  applyModifiers() {
    const p1 = this.player;
    const ai = this.opponent;

    // Reset stats
    [p1, ai].forEach(player => {
      player.monsters.forEach((m: any) => {
        if (m) {
          m.current_atk = m.attack_points;
          m.current_def = m.defense_points;
        }
      });
    });

    // Apply active spell effects
    [p1, ai].forEach(owner => {
      const opp = owner.id === p1.id ? ai : p1;
      owner.spells.forEach((s: any) => {
        if (!s || s.isFaceDown || s.ability === 'Trampa') return;

        if (s.name === 'Volcán Activo') {
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'fire') m.current_atk += 400; });
        } else if (s.name === 'Océano Profundo') {
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'water') { m.current_atk += 200; m.current_def += 200; } });
        } else if (s.name === 'Central de Energía') {
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'electric') m.current_atk += 300; });
          opp.monsters.forEach((m: any) => { if (m) m.current_def -= 100; });
        } else if (s.name === 'Cielos Tempestuosos') {
          // Handled at damage calculation technically, but we leave it here for future.
        } else if (s.name === 'Enjambre Feroz') {
          const bugCount = owner.monsters.filter((m: any) => m && m.type_primary === 'bug').length;
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'bug') m.current_atk += (100 * bugCount); });
        } else if (s.name === 'Dojo de Combate') {
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'fighting') m.current_atk += 500; });
        } else if (s.name === 'Fortaleza Metálica') {
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'steel') { m.current_atk += 200; m.current_def += 400; } });
        } else if (s.name === 'Cementerio de Almas') {
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'ghost') m.current_atk += 300; });
        } else if (s.name === 'Valle Oscuro') {
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'dark') m.current_atk += 400; });
        } else if (s.name === 'Cañón Árido') {
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'ground') m.current_def += 500; });
        } else if (s.name === 'Llanura Serena') {
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'normal') m.hp_points += 50; }); // Pseudo-HP buff logic
        } else if (s.name === 'Nido de Dragones') {
          owner.monsters.forEach((m: any) => { if (m && m.type_primary === 'dragon') m.current_atk += 300; });
        } else if (s.name === 'Glaciar Eterno') {
          const hasIce = owner.monsters.some((m: any) => m && m.type_primary === 'ice');
          if (hasIce) opp.monsters.forEach((m: any) => { if (m) m.current_atk = Math.max(0, m.current_atk - 200); });
        }
      });
    });
  }

  resolveInstantSpell(card: any, player: any, opponent: any, spellIndex: number) {
    let shouldDiscard = true;

    if (card.ability === 'Magia Normal' || card.name === 'Investigación del Profesor' || card.ability === 'Motor de Robo') {
      if (player.deck.length >= 2) {
        player.hand.push(player.deck.pop());
        player.hand.push(player.deck.pop());
        this.gameState.log.push(`[Magia] ${card.name} robó 2 cartas para ${player.name}.`);
      } else {
        this.gameState.log.push(`[Magia] ${card.name} intentó robar pero no hay suficientes cartas.`);
      }
    } else if (card.name === 'Rayo Fulminante') {
      opponent.monsters.forEach((m: any, i: number) => { if (m) { opponent.graveyard.push(m); opponent.monsters[i] = null; } });
      this.gameState.log.push(`[Magia] ${card.name} destruyó todos los monstruos rivales.`);
    } else if (card.name === 'Agujero Dimensional') {
      opponent.monsters.forEach((m: any, i: number) => { if (m) { opponent.graveyard.push(m); opponent.monsters[i] = null; } });
      player.monsters.forEach((m: any, i: number) => { if (m) { player.graveyard.push(m); player.monsters[i] = null; } });
      this.gameState.log.push(`[Magia] ${card.name} destruyó todos los monstruos del campo.`);
    } else if (card.ability === 'Curación Total') {
      const heal = 1000;
      player.lifePoints += heal;
      this.gameState.log.push(`[Magia] ${card.name} restauró ${heal} LP a ${player.name}.`);
    } else if (card.ability === 'Trampa') {
      this.gameState.log.push(`[Trampa] ${card.name} activada! (Efecto resuelto)`);
    } else if (card.ability === 'Magia Continua' || card.ability === 'Magia de Campo' || card.ability === 'Magia de Equipo') {
      this.gameState.log.push(`[Magia] ${card.name} permanecerá activa en el campo.`);
      shouldDiscard = false;
    } else if (card.name === 'Semilla Drenadora') {
      let reduced = false;
      opponent.monsters.forEach((m: any) => {
        if (m && !reduced) {
          m.attack_points = Math.max(0, m.attack_points - 300);
          reduced = true;
        }
      });
      this.gameState.log.push(reduced ? `[Magia] ${card.name} redujo el ATK de un monstruo rival en 300.` : `[Magia] ${card.name} se activó pero el rival no tenía monstruos.`);
    } else if (card.name === 'Muñeco Maldito') {
      opponent.lifePoints -= 500;
      this.gameState.log.push(`[Magia] ${card.name} infligió 500 puntos de daño al rival.`);
      this.checkWinCondition();
    } else if (card.name === 'Caja Sorpresa Voltorb') {
      let maxAtk = -1;
      let targetIdx = -1;
      opponent.monsters.forEach((m: any, idx: number) => {
        if (m && m.attack_points > maxAtk) { maxAtk = m.attack_points; targetIdx = idx; }
      });
      if (targetIdx !== -1) {
        this.gameState.log.push(`[Magia] ${card.name} destruyó a ${opponent.monsters[targetIdx].name}.`);
        opponent.graveyard.push(opponent.monsters[targetIdx]);
        opponent.monsters[targetIdx] = null;
      } else {
        this.gameState.log.push(`[Magia] ${card.name} se activó pero no había monstruos.`);
      }
    } else if (card.name === 'Venganza Espectral') {
      const monsterInGrave = player.graveyard.find((c: any) => c.card_category !== 'trainer');
      const emptySlot = player.monsters.findIndex((m: any) => m === null);
      if (monsterInGrave && emptySlot !== -1) {
        monsterInGrave.hp_points = Math.floor(monsterInGrave.hp_points / 2) || 10;
        player.monsters[emptySlot] = monsterInGrave;
        player.graveyard = player.graveyard.filter((c: any) => c !== monsterInGrave);
        this.gameState.log.push(`[Magia] ${card.name} revivió a ${monsterInGrave.name} con mitad de HP.`);
      } else {
        this.gameState.log.push(`[Magia] ${card.name} falló por falta de espacio o monstruos.`);
      }
    } else if (card.name === 'Polvo Sombrío') {
      if (opponent.hand.length > 0) {
        const randomIndex = Math.floor(Math.random() * opponent.hand.length);
        const discarded = opponent.hand.splice(randomIndex, 1)[0];
        opponent.graveyard.push(discarded);
        this.gameState.log.push(`[Magia] ${card.name} obligó al rival a descartar a ${discarded.name}.`);
      } else {
        this.gameState.log.push(`[Magia] ${card.name} se activó, pero la mano del rival está vacía.`);
      }
    } else if (card.name === 'Ceniza Sagrada') {
      const monsterInGrave = player.graveyard.find((c: any) => c.card_category !== 'trainer');
      const emptySlot = player.monsters.findIndex((m: any) => m === null);
      if (monsterInGrave && emptySlot !== -1) {
        player.monsters[emptySlot] = monsterInGrave;
        player.graveyard = player.graveyard.filter((c: any) => c !== monsterInGrave);
        this.gameState.log.push(`[Magia] ${card.name} revivió a ${monsterInGrave.name} del Descarte.`);
      } else {
        this.gameState.log.push(`[Magia] ${card.name} no encontró espacio o monstruos en el Descarte.`);
      }
    } else if (card.name === 'Viento Huracanado') {
      let destroyed = false;
      for (let i = 0; i < opponent.spells.length; i++) {
        if (opponent.spells[i] && !destroyed) {
          opponent.graveyard.push(opponent.spells[i]);
          opponent.spells[i] = null;
          destroyed = true;
        }
      }
      this.gameState.log.push(destroyed ? `[Magia] ${card.name} destruyó una Mágica/Trampa rival.` : `[Magia] ${card.name} no encontró Mágicas/Trampas rivales.`);
    } else {
      // Default para otras cartas no especificadas
      this.gameState.log.push(`[Magia] ${card.name} se resolvió con éxito.`);
    }

    if (shouldDiscard) {
      setTimeout(() => {
        player.graveyard.push(card);
        player.spells[spellIndex] = null;
        this.applyModifiers();
        this.gameState = { ...this.gameState };
        this.cdr.detectChanges();
      }, 1500);
    }
  }

  resolvePokemonEffect(card: any, player: any, opponent: any) {
    const type = card.type_primary;
    const log = (msg: string) => {
      this.gameState.log.push(`[Habilidad] ${msg}`);
      this.cdr.detectChanges();
    };

    switch (type) {
      case 'fire':
        opponent.lifePoints -= 300;
        log(`${card.name} lanza Llamarada: -300 LP al rival.`);
        this.checkWinCondition();
        break;
      case 'water':
        card.hp_points = Math.min(card.hp_points + 400, card.base_hp || card.hp_points + 400);
        log(`${card.name} invoca Marea Alta: recupera 400 HP (HP actual: ${card.hp_points}).`);
        break;
      case 'grass':
        card.hp_points = Math.min(card.hp_points + 200, card.base_hp || card.hp_points + 200);
        if (player.deck.length > 0) player.hand.push(player.deck.pop());
        log(`${card.name} usa Regeneración: recupera 200 HP y roba 1 carta.`);
        break;
      case 'electric':
        opponent.monsters.forEach((m: any) => { if (m) m.attack_points = Math.max(0, m.attack_points - 200); });
        log(`${card.name} libera Descarga: El ATK de los monstruos rivales bajó 200 pts.`);
        break;
      case 'psychic':
        if (player.deck.length >= 2) {
          player.hand.push(player.deck.pop());
          player.hand.push(player.deck.pop());
          log(`${card.name} revela Visión Futura: Has robado 2 cartas.`);
        }
        break;
      case 'dragon':
        if (player.lifePoints < 1500) {
          opponent.lifePoints -= 500;
          log(`${card.name} desata Furia Dragón: -500 LP al rival.`);
          this.checkWinCondition();
        } else {
          log(`${card.name} intentó Furia Dragón pero los LP no son suficientemente bajos.`);
        }
        break;
      case 'dark':
        const targets = opponent.monsters.map((m: any, i: number) => m ? i : -1).filter((i: number) => i !== -1);
        if (targets.length > 0) {
          const targetIndex = targets[Math.floor(Math.random() * targets.length)];
          log(`${card.name} lanza Maldición y destruye a ${opponent.monsters[targetIndex].name}!`);
          opponent.graveyard.push(opponent.monsters[targetIndex]);
          opponent.monsters[targetIndex] = null;
        }
        break;
      case 'fighting':
        card.attack_points = Math.floor(card.attack_points * 1.5);
        log(`${card.name} se prepara para Golpe Crítico: ATK aumentado a ${card.attack_points}.`);
        break;
      default:
        card.defense_points += 300;
        log(`${card.name} confía en su Instinto: +300 DEF.`);
        break;
    }
  }

  simulateTestMatch() {
    console.log("=== INICIANDO TEST MATCH SIMULADO ===");

    // 1. Robar 5 cartas
    this.player.hand = [];
    this.opponent.hand = [];

    // 2. Colocar Fuego + Volcan Activo (P1)
    const fireMonster = { name: 'Charizard', current_atk: 2600, attack_points: 2600, defense_points: 1800, hp_points: 3600, type_primary: 'fire', hasAttacked: false };
    const volcanSpell = { name: 'Volcán Activo', ability: 'Magia de Campo', isFaceDown: false };
    this.player.monsters[0] = { ...fireMonster };
    this.player.spells[0] = volcanSpell;

    // 3. Colocar Monstruo + Pantalla de Luz (P2)
    const waterMonster = { name: 'Blastoise', current_atk: 2400, attack_points: 2400, defense_points: 2000, hp_points: 3600, type_primary: 'water', hasAttacked: false };
    const pantallaTrap = { name: 'Pantalla de Luz', ability: 'Trampa', isFaceDown: true };
    this.opponent.monsters[0] = { ...waterMonster };
    this.opponent.spells[0] = pantallaTrap;

    // 4. Validar buff de Volcán Activo
    this.applyModifiers();
    console.log(`ATK de Charizard antes del ataque (debería ser 3000): ${this.player.monsters[0].current_atk}`);
    if (this.player.monsters[0].current_atk === 3000) {
      console.log("✅ TEST PASSED: Volcán Activo aplicó el buff correctamente (+400).");
    } else {
      console.error("❌ TEST FAILED: El buff no se aplicó.");
    }

    // 5. Atacar y activar trampa
    this.gameState.phase = 'BATTLE';
    this.onGameAction({ actionType: 'attackCard', payload: { attackerCardIndex: 0, defenderCardIndex: 0 } });

    if (this.player.monsters[0] === null && this.opponent.spells[0] === null) {
      console.log("✅ TEST PASSED: Pantalla de Luz interceptó el ataque, destruyó a Charizard y fue al cementerio.");
    } else {
      console.error("❌ TEST FAILED: La trampa no funcionó como se esperaba.");
    }

    console.log("=== FIN TEST MATCH SIMULADO ===");
  }
}
