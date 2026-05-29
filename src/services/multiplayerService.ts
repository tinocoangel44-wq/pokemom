// @ts-nocheck
// Importamos el cliente de Supabase (se asume que existe en ./supabaseClient)
import { supabase } from './supabaseClient';

/**
 * Servicio de Multiplayer para gestionar las salas de juego y sincronización en tiempo real
 * usando Supabase.
 */

// 1. generateRoomCode
async function generateRoomCode() {
  try {
    let code = '';
    let isUnique = false;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    
    // Bucle para generar un código único comprobando en Supabase
    while (!isUnique) {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      
      const { data, error } = await supabase
        .from('game_rooms')
        .select('id')
        .eq('room_code', code)
        .single();
        
      // PGRST116 significa "0 rows returned", por lo tanto el código es único
      if (error && error.code === 'PGRST116') {
        isUnique = true;
      } else if (error) {
        throw error;
      }
    }
    
    return { data: code, error: null };
  } catch (error) {
    console.error('[multiplayerService] Error generating room code:', error);
    return { data: null, error };
  }
}

// 2. createRoom
async function createRoom(userId, deckSnapshot) {
  try {
    const { data: roomCode, error: codeError } = await generateRoomCode();
    if (codeError) throw codeError;
    
    // Inicializar el estado de juego para la sala de espera
    const initialGameState = {
      phase: 'waiting',
      turn: 0,
      activePlayerId: userId,
      players: {
        [userId]: {
          id: userId,
          deck: deckSnapshot,
          hand: [],
          field: [],
          graveyard: [],
          lifePoints: 4000,
          hasDrawnThisTurn: false,
          hasSummonedThisTurn: false,
          hasUsedAbilityThisTurn: false,
          hasAttackedThisTurn: false
        }
      },
      winner: null,
      gameOver: false,
      log: ['Sala creada. Esperando a que el rival se una...']
    };

    const { data, error } = await supabase
      .from('game_rooms')
      .insert({
        room_code: roomCode,
        player1_id: userId,
        status: 'waiting',
        current_turn: userId,
        game_state: initialGameState
      })
      .select('id, room_code')
      .single();

    if (error) throw error;
    
    return { data: { roomId: data.id, roomCode: data.room_code }, error: null };
  } catch (error) {
    console.error('[multiplayerService] Error creating room:', error);
    return { data: null, error };
  }
}

// 3. joinRoom
async function joinRoom(roomCode, userId, deckSnapshot) {
  try {
    const { data: room, error: findError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', roomCode)
      .eq('status', 'waiting')
      .single();

    if (findError) throw findError;
    if (!room) throw new Error('La sala no fue encontrada o ya está en progreso');

    // Inicializar el estado de juego inyectando al jugador 2
    const currentGameState = room.game_state;
    currentGameState.players[userId] = {
      id: userId,
      deck: deckSnapshot,
      hand: [],
      field: [],
      graveyard: [],
      lifePoints: 4000,
      hasDrawnThisTurn: false,
      hasSummonedThisTurn: false,
      hasUsedAbilityThisTurn: false,
      hasAttackedThisTurn: false
    };
    currentGameState.phase = 'draw';
    currentGameState.turn = 1;
    currentGameState.log.push('¡El rival se ha unido! La partida comienza.');

    const { data, error: updateError } = await supabase
      .from('game_rooms')
      .update({
        player2_id: userId,
        status: 'in_progress',
        current_turn: room.player1_id, // player1 empieza
        game_state: currentGameState,
        updated_at: new Date().toISOString()
      })
      .eq('id', room.id)
      .select('id, game_state')
      .single();

    if (updateError) throw updateError;

    return { data: { roomId: data.id, gameState: data.game_state }, error: null };
  } catch (error) {
    console.error('[multiplayerService] Error joining room:', error);
    return { data: null, error };
  }
}

// 4. subscribeToRoom
function subscribeToRoom(roomId, onStateChange, onPlayerJoined) {
  let currentPlayer2Id = null;

  const subscription = supabase
    .channel(`game_room_${roomId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'game_rooms', filter: `id=eq.${roomId}` },
      (payload) => {
        const newData = payload.new;
        
        // Disparar evento de jugador unido
        if (newData.player2_id && newData.player2_id !== currentPlayer2Id) {
          currentPlayer2Id = newData.player2_id;
          if (onPlayerJoined) onPlayerJoined(currentPlayer2Id);
        }

        // Disparar evento de cambio de estado
        if (onStateChange && newData.game_state) {
          onStateChange(newData.game_state);
        }
      }
    )
    .subscribe();

  // Retornar función para desuscribirse limpiamente
  const unsubscribe = () => {
    supabase.removeChannel(subscription);
  };

  return unsubscribe;
}

// 5. pushGameAction
async function pushGameAction(roomId, playerId, actionType, actionData, newGameState) {
  try {
    const nextPlayerId = newGameState.activePlayerId;
    const turnNumber = newGameState.turn;

    // Ejecutamos ambas consultas simultáneamente
    const insertActionPromise = supabase
      .from('game_actions')
      .insert({
        room_id: roomId,
        player_id: playerId,
        action_type: actionType,
        action_data: actionData,
        turn_number: turnNumber
      });

    const updateRoomPromise = supabase
      .from('game_rooms')
      .update({
        game_state: newGameState,
        current_turn: nextPlayerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    const [actionResult, roomResult] = await Promise.all([insertActionPromise, updateRoomPromise]);

    if (actionResult.error) throw actionResult.error;
    if (roomResult.error) throw roomResult.error;

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('[multiplayerService] Error pushing game action:', error);
    return { data: null, error };
  }
}

// 6. saveMatchResult
async function saveMatchResult(roomId, winnerId, loserId, stats = {}) {
  try {
    const insertMatchPromise = supabase
      .from('match_results')
      .insert({
        room_id: roomId,
        winner_id: winnerId,
        loser_id: loserId,
        stats: stats
      });

    const updateRoomPromise = supabase
      .from('game_rooms')
      .update({ 
        status: 'finished',
        updated_at: new Date().toISOString()
      })
      .eq('id', roomId);

    const [matchRes, roomRes] = await Promise.all([insertMatchPromise, updateRoomPromise]);
    
    if (matchRes.error) throw matchRes.error;
    if (roomRes.error) throw roomRes.error;

    // Actualización de profiles (idealmente se haría vía RPC, pero procedemos consultando primero)
    const { data: winnerProfile } = await supabase.from('profiles').select('total_wins').eq('id', winnerId).single();
    if (winnerProfile) {
      await supabase.from('profiles').update({ total_wins: winnerProfile.total_wins + 1 }).eq('id', winnerId);
    }
    
    const { data: loserProfile } = await supabase.from('profiles').select('total_losses').eq('id', loserId).single();
    if (loserProfile) {
      await supabase.from('profiles').update({ total_losses: loserProfile.total_losses + 1 }).eq('id', loserId);
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('[multiplayerService] Error saving match result:', error);
    return { data: null, error };
  }
}

// 7. leaveRoom
async function leaveRoom(roomId, userId) {
  try {
    const { data: room, error: fetchError } = await supabase
      .from('game_rooms')
      .select('status, player1_id, player2_id')
      .eq('id', roomId)
      .single();

    if (fetchError) throw fetchError;

    if (room.status === 'waiting') {
      // Si estaba esperando, destruimos la sala
      const { error: deleteError } = await supabase
        .from('game_rooms')
        .delete()
        .eq('id', roomId);
      if (deleteError) throw deleteError;
      
    } else if (room.status === 'in_progress') {
      // Si la partida estaba en curso, el que se va pierde automáticamente
      const winnerId = room.player1_id === userId ? room.player2_id : room.player1_id;
      const { error: saveError } = await saveMatchResult(roomId, winnerId, userId, { reason: 'forfeit' });
      if (saveError) throw saveError;
    }

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('[multiplayerService] Error leaving room:', error);
    return { data: null, error };
  }
}

const multiplayerService = {
  generateRoomCode,
  createRoom,
  joinRoom,
  subscribeToRoom,
  pushGameAction,
  saveMatchResult,
  leaveRoom
};

export default multiplayerService;
