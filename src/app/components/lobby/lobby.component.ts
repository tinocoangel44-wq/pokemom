import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MultiplayerService } from '../../services/multiplayer.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center font-sans text-white relative overflow-hidden z-[9999]">
      <!-- Fondo animado/textura -->
      <div class="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900 via-slate-900 to-black pointer-events-none"></div>

      <!-- Caja Principal -->
      <div class="z-10 bg-slate-900 border-4 border-red-600 rounded-xl p-10 flex flex-col items-center gap-8 shadow-[0_0_50px_rgba(220,38,38,0.5)] w-full max-w-lg text-center">
        <h1 class="text-3xl md:text-4xl font-black tracking-widest text-white drop-shadow-md uppercase">Sala de Batalla</h1>
        
        <!-- Panel cuando NO estamos en sala -->
        <div *ngIf="(multiplayerService.connectionStatus | async) === 'disconnected'" class="flex flex-col items-center gap-6 w-full">
          <!-- Opción A: Crear Sala -->
          <button (click)="createRoom()" class="w-full bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-white font-bold py-4 px-8 rounded-lg uppercase tracking-widest hover:scale-105 transition-all shadow-[4px_4px_0_0_#334155] hover:shadow-none">
            CREAR SALA PRIVADA
          </button>
          
          <div class="w-full border-t border-slate-600 my-2 relative">
            <span class="absolute left-1/2 -top-3 -translate-x-1/2 bg-slate-900 px-4 text-slate-400 font-bold text-sm">O</span>
          </div>

          <!-- Opción B: Unirse a Sala -->
          <div class="flex flex-col w-full gap-2">
            <input type="text" maxlength="4" (input)="onJoinCodeChange($event)" placeholder="CÓDIGO" class="w-full bg-slate-800 border-2 border-slate-600 text-white text-center font-bold text-2xl py-3 rounded-lg uppercase placeholder-slate-500 focus:outline-none focus:border-red-500">
            <button (click)="joinRoom()" [disabled]="joinCode.length !== 4" class="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-slate-800 border-2 border-slate-600 text-white font-bold py-4 px-8 rounded-lg uppercase tracking-widest hover:scale-105 transition-all shadow-[4px_4px_0_0_#334155] disabled:shadow-none hover:shadow-none">
              UNIRSE A SALA
            </button>
          </div>
        </div>

        <!-- Panel cuando estamos creando/esperando/listos -->
        <div *ngIf="(multiplayerService.connectionStatus | async) !== 'disconnected'" class="flex flex-col items-center gap-6 w-full">
          <p class="text-xl font-bold text-slate-300">CÓDIGO DE TU SALA:</p>
          <div class="bg-black border-4 border-red-600 p-4 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <p class="text-5xl font-black text-white tracking-[0.2em]">{{ multiplayerService.currentRoomCode || '----' }}</p>
          </div>
          
          <div *ngIf="(multiplayerService.connectionStatus | async) === 'connecting'" class="flex items-center gap-2 mt-4">
            <div class="w-6 h-6 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
            <p class="text-sm font-bold text-slate-400 animate-pulse uppercase">Conectando a la sala {{ multiplayerService.currentRoomCode }}...</p>
          </div>

          <div *ngIf="(multiplayerService.connectionStatus | async) === 'waiting'" class="flex items-center gap-2 mt-4">
            <div class="w-6 h-6 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
            <p class="text-sm font-bold text-slate-400 animate-pulse uppercase">Esperando a que se una tu oponente...</p>
          </div>
          
          <div *ngIf="(multiplayerService.connectionStatus | async) === 'match_ready'" class="flex items-center gap-2 mt-4">
            <p class="text-xl font-black text-green-400 uppercase drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]">¡Oponente Encontrado!</p>
          </div>
        </div>

        <!-- Botón Cancelar -->
        <button (click)="cancelAndReturn()" class="mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-8 border-4 border-slate-950 rounded-lg uppercase tracking-widest hover:scale-105 transition-all shadow-[4px_4px_0_0_#020617] hover:shadow-none">
          Cancelar y Volver al Menú
        </button>
      </div>
    </div>
  `
})
export class LobbyComponent implements OnInit, OnDestroy {
  @Output() onClose = new EventEmitter<void>();

  joinCode: string = '';

  constructor(public multiplayerService: MultiplayerService) {}

  ngOnInit() {
    // No auto-connect logic anymore
  }

  onJoinCodeChange(event: any) {
    this.joinCode = event.target.value.toUpperCase();
  }

  createRoom() {
    this.multiplayerService.createRoom();
  }

  joinRoom() {
    if (this.joinCode.length === 4) {
      this.multiplayerService.joinRoom(this.joinCode);
    }
  }

  ngOnDestroy() {
    // IMPORTANTE: Ya no llamamos a leaveLobby() aquí. 
    // Si la partida inició y transicionamos, el componente muere pero el canal DEBE persistir.
  }

  cancelAndReturn() {
    this.multiplayerService.leaveLobby();
    this.onClose.emit();
  }
}
