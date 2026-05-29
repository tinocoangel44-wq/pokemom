import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

const supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
@Injectable({
  providedIn: 'root'
})
export class MultiplayerService {
  public connectionStatus = new BehaviorSubject<'disconnected' | 'connecting' | 'waiting' | 'match_ready'>('disconnected');
  public currentRoomCode: string | null = null;
  public currentChannel: any = null;

  public isOnlineMatch = new BehaviorSubject<boolean>(false);
  public onStartMatch = new BehaviorSubject<{ isMultiplayer: boolean, isHost: boolean } | null>(null);

  sendCoinFlipResult(roomCode: string, result: 'heads' | 'tails', hostGoesFirst: boolean, backgroundId?: string) {
      this.currentChannel?.send({
          type: 'broadcast',
          event: 'coin_flip',
          payload: { result, hostGoesFirst, backgroundId }
      });
  }

  sendInitialPlayerData(name: string, startingLP: number, deckCount: number, handCount: number) {
      this.currentChannel?.send({
          type: 'broadcast',
          event: 'sync_player_info',
          payload: { name, lp: startingLP, deckCount, handCount }
      });
  }

  sendLPUpdate(newLP: number) {
      this.currentChannel?.send({
          type: 'broadcast',
          event: 'update_lp',
          payload: { lp: newLP }
      });
  }

  sendGameAction(actionType: string, payload: any) {
      this.currentChannel?.send({
          type: 'broadcast',
          event: 'game_action',
          payload: { actionType, ...payload }
      });
  }

  constructor() { }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  createRoom() {
    this.connectionStatus.next('connecting');
    const codigo = this.generateRoomCode();
    this.currentRoomCode = codigo;
    
    if (this.currentChannel) {
      supabase.removeChannel(this.currentChannel);
    }

    console.log(`[Red] Sala generada: ${codigo}`);
    this.currentChannel = supabase.channel('room_' + codigo);
    
    this.currentChannel
      .on('broadcast', { event: 'player_joined' }, (payload: any) => {
          console.log('[RED] Invitado detectado. Iniciando partida...', payload);
          this.currentChannel?.send({ type: 'broadcast', event: 'start_match', payload: {} });
          this.transitionToGame(codigo, true); // <-- FORZAR TRANSICIÓN AQUÍ
      })
      .subscribe((status: string) => {
        console.log('[RED] Host Status:', status);
        if (status === 'SUBSCRIBED') {
          this.connectionStatus.next('waiting');
        }
      });
  }

  joinRoom(codigo: string) {
    if (!codigo || codigo.length !== 4) return;
    this.connectionStatus.next('connecting');
    this.currentRoomCode = codigo.toUpperCase();
    
    if (this.currentChannel) {
      supabase.removeChannel(this.currentChannel);
    }

    console.log(`[Red] Intentando unirse a sala: ${this.currentRoomCode}`);
    this.currentChannel = supabase.channel('room_' + this.currentRoomCode);

    this.currentChannel
      .on('broadcast', { event: 'start_match' }, (payload: any) => {
          console.log('[RED] Host confirmó. Iniciando partida...', payload);
          this.transitionToGame(this.currentRoomCode!, false); // <-- FORZAR TRANSICIÓN AQUÍ
      })
      .subscribe((status: string) => {
          console.log('[RED] Guest Status:', status);
          if (status === 'SUBSCRIBED') {
              console.log('[RED] Guest conectado, avisando al Host...');
              this.currentChannel?.send({ type: 'broadcast', event: 'player_joined', payload: {} });
              this.connectionStatus.next('waiting');
          }
      });
  }

  transitionToGame(codigo: string, isHost: boolean) {
    this.connectionStatus.next('match_ready');
    this.isOnlineMatch.next(true);
    console.log('[Red] Transicionando al juego en sala:', codigo, '. isMultiplayer = true, isHost =', isHost);
    this.onStartMatch.next({ isMultiplayer: true, isHost });
  }

  leaveLobby() {
    this.connectionStatus.next('disconnected');
    this.isOnlineMatch.next(false);
    this.currentRoomCode = null;
    if (this.currentChannel) {
      supabase.removeChannel(this.currentChannel);
      this.currentChannel = null;
      console.log('[Red] Canal destruido y desconectado.');
    }
  }
}
