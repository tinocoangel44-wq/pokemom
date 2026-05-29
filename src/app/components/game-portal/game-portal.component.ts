import { Component, OnInit, OnDestroy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';
import { AudioService } from '../../../services/audio.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-portal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen w-full transition-all duration-300 bg-[url('/modo-normal.jpg')] dark:bg-[url('/modo-oscuro.jpg')] bg-cover bg-center bg-no-repeat text-gray-900 dark:text-white flex flex-col overflow-x-hidden relative font-sans">
      
      <!-- Botón de Configuración (Gear) -->
      <button (click)="showSettings = true" class="absolute top-4 right-4 z-[60] bg-white dark:bg-slate-800 text-gray-900 dark:text-white p-2 rounded-full border-2 border-gray-900 shadow-[4px_4px_0_0_#0f172a] hover:scale-110 hover:shadow-none transition-all">
        <span class="text-2xl leading-none">⚙️</span>
      </button>

      <!-- Modal de Configuración -->
      <div *ngIf="showSettings" class="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center backdrop-blur-sm">
          <div class="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-2xl w-96 relative flex flex-col gap-6 border-4 border-gray-900 dark:border-white">
              <button (click)="showSettings = false" class="absolute top-4 right-4 text-gray-500 dark:text-gray-300 hover:text-red-500 font-bold text-xl transition-colors">X</button>

              <h2 class="text-2xl font-black text-gray-900 dark:text-white text-center border-b border-gray-300 dark:border-gray-600 pb-2">CONFIGURACIÓN</h2>

              <!-- Controles reubicados -->
              <div class="flex flex-col gap-4">
                  <!-- Volume Control -->
                  <div class="flex items-center justify-between space-x-2 bg-gray-100 dark:bg-slate-700 p-4 rounded-lg border-2 border-gray-900 dark:border-slate-500">
                      <label for="vol-control" class="text-gray-900 dark:text-white text-sm font-bold">Volumen</label>
                      <input type="range" id="vol-control" min="0" max="1" step="0.01" value="0.5" 
                             (input)="onVolumeChange($event)" class="cursor-pointer accent-red-600">
                  </div>

                  <!-- Dark Mode Toggle -->
                  <div class="flex items-center justify-between space-x-2 bg-gray-100 dark:bg-slate-700 p-4 rounded-lg border-2 border-gray-900 dark:border-slate-500">
                      <label class="text-gray-900 dark:text-white text-sm font-bold">Modo Oscuro</label>
                      <button (click)="toggleDarkMode()" class="bg-gray-900 text-yellow-400 p-2 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <!-- Header -->
      <header class="w-full bg-red-600 dark:bg-slate-950 border-b-4 border-slate-900 dark:border-slate-800 transition-colors duration-300 sticky top-0 z-50 shadow-md">
        <div class="max-w-7xl mx-auto w-full px-4 py-3 flex items-center justify-between">
          
          <!-- Logo -->
          <div class="text-xl md:text-2xl font-black text-white tracking-wider flex items-center gap-2">
            <div class="w-6 h-6 bg-white rounded-full border-4 border-slate-900 flex items-center justify-center overflow-hidden shrink-0 relative">
              <div class="w-full h-1/2 bg-red-600 absolute top-0 left-0 border-b-2 border-slate-900"></div>
              <div class="w-2 h-2 bg-white rounded-full border-2 border-slate-900 z-10 relative"></div>
            </div>
            <span class="truncate leading-none uppercase drop-shadow-md">PokéCard Web</span>
          </div>

          <!-- Usuario y Logout -->
          <div class="flex items-center gap-4 shrink-0">
            <div class="bg-white border-4 border-slate-900 rounded-full px-4 py-1.5 shadow-[4px_4px_0_0_#0f172a] font-bold text-slate-900 flex items-center gap-2">
              <div class="w-5 h-5 bg-white rounded-full border-2 border-slate-900 overflow-hidden shrink-0"></div>
              <span class="hidden sm:inline uppercase text-xs truncate max-w-[150px] leading-none">{{ currentUsername || 'ENTRENADOR' }}</span>
            </div>
            <button (click)="handleLogout()" class="bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold border-4 border-slate-900 rounded-lg px-4 py-1.5 shadow-[4px_4px_0_0_#0f172a] hover:translate-y-1 hover:shadow-none transition-all uppercase text-xs leading-none flex items-center justify-center cursor-pointer">
              SALIR
            </button>
          </div>
        </div>
      </header>

      <!-- Contenedor Principal (Center) -->
      <main class="flex-grow w-full mx-auto flex flex-col items-center justify-center z-30 relative py-12">
        
        <div class="w-full max-w-[450px] flex flex-col items-center justify-center gap-8">
          <!-- Título Estilizado -->
          <div class="text-center animate-zoomIn w-full">
            <h2 class="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 uppercase tracking-widest text-center drop-shadow-md bg-white px-4 py-3 rounded-full border-4 border-slate-900 shadow-[6px_6px_0_0_#0f172a]">
              PokeCard YU-Duels
            </h2>
          </div>
          
          <!-- Lista Vertical de Botones -->
          <div class="w-full flex flex-col items-center justify-center gap-y-4">
            
            <button (click)="navigate('deck')" class="w-full bg-gradient-to-b from-blue-400 to-blue-600 border-[3px] border-slate-900 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6),_0_6px_0_0_#0f172a] hover:shadow-[0_0_25px_rgba(59,130,246,0.8),_0_8px_0_0_#0f172a] hover:-translate-y-1 transition-all cursor-pointer px-6 py-4 flex items-center justify-between group overflow-hidden relative">
              <div class="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none"></div>
              <div class="w-10 flex justify-center shrink-0">
                <i class="fa-solid fa-box-archive text-2xl text-white group-hover:scale-110 transition-transform drop-shadow-md z-10"></i>
              </div>
              <h3 class="text-white font-black text-lg md:text-xl uppercase tracking-wider z-10 flex-grow text-center drop-shadow-md">BARAJA</h3>
              <div class="w-10 shrink-0"></div>
            </button>
            
            <button (click)="navigate('history')" class="w-full bg-gradient-to-b from-gray-500 to-gray-700 border-[3px] border-slate-900 rounded-full shadow-[0_0_15px_rgba(107,114,128,0.6),_0_6px_0_0_#0f172a] hover:shadow-[0_0_25px_rgba(107,114,128,0.8),_0_8px_0_0_#0f172a] hover:-translate-y-1 transition-all cursor-pointer px-6 py-4 flex items-center justify-between group overflow-hidden relative">
              <div class="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none"></div>
              <div class="w-10 flex justify-center shrink-0">
                <i class="fa-solid fa-clock-rotate-left text-2xl text-white group-hover:scale-110 transition-transform drop-shadow-md z-10"></i>
              </div>
              <h3 class="text-white font-black text-lg md:text-xl uppercase tracking-wider z-10 flex-grow text-center drop-shadow-md">HISTORIAL</h3>
              <div class="w-10 shrink-0"></div>
            </button>
            
            <button (click)="navigate('rules')" class="w-full bg-gradient-to-b from-purple-400 to-purple-600 border-[3px] border-slate-900 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6),_0_6px_0_0_#0f172a] hover:shadow-[0_0_25px_rgba(168,85,247,0.8),_0_8px_0_0_#0f172a] hover:-translate-y-1 transition-all cursor-pointer px-6 py-4 flex items-center justify-between group overflow-hidden relative">
              <div class="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none"></div>
              <div class="w-10 flex justify-center shrink-0">
                <i class="fa-solid fa-book text-2xl text-white group-hover:scale-110 transition-transform drop-shadow-md z-10"></i>
              </div>
              <h3 class="text-white font-black text-lg md:text-xl uppercase tracking-wider z-10 flex-grow text-center drop-shadow-md">REGLAS</h3>
              <div class="w-10 shrink-0"></div>
            </button>

            <button (click)="navigate('pve')" class="w-full bg-gradient-to-b from-red-400 to-red-600 border-[3px] border-slate-900 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.6),_0_6px_0_0_#0f172a] hover:shadow-[0_0_25px_rgba(239,68,68,0.8),_0_8px_0_0_#0f172a] hover:-translate-y-1 transition-all cursor-pointer px-6 py-4 flex items-center justify-between group overflow-hidden relative">
              <div class="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none"></div>
              <div class="w-10 flex justify-center shrink-0">
                <i class="fa-solid fa-robot text-2xl text-white group-hover:scale-110 transition-transform drop-shadow-md z-10"></i>
              </div>
              <h3 class="text-white font-black text-lg md:text-xl uppercase tracking-wider z-10 flex-grow text-center drop-shadow-md">BATALLA VS IA</h3>
              <div class="w-10 shrink-0"></div>
            </button>

            <button (click)="navigate('pvp')" class="w-full bg-gradient-to-b from-purple-500 to-purple-700 border-[3px] border-slate-900 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.6),_0_6px_0_0_#0f172a] hover:shadow-[0_0_25px_rgba(168,85,247,0.8),_0_8px_0_0_#0f172a] hover:-translate-y-1 transition-all cursor-pointer px-6 py-4 flex items-center justify-between group overflow-hidden relative">
              <div class="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none"></div>
              <div class="w-10 flex justify-center shrink-0">
                <i class="fa-solid fa-globe text-2xl text-white group-hover:scale-110 transition-transform drop-shadow-md z-10"></i>
              </div>
              <h3 class="text-white font-black text-lg md:text-xl uppercase tracking-wider z-10 flex-grow text-center drop-shadow-md">BATALLA EN LÍNEA</h3>
              <div class="w-10 shrink-0"></div>
            </button>

            <button (click)="navigate('collection')" class="w-full bg-gradient-to-b from-emerald-400 to-emerald-600 border-[3px] border-slate-900 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6),_0_6px_0_0_#0f172a] hover:shadow-[0_0_25px_rgba(16,185,129,0.8),_0_8px_0_0_#0f172a] hover:-translate-y-1 transition-all cursor-pointer px-6 py-4 flex items-center justify-between group overflow-hidden relative">
              <div class="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full pointer-events-none"></div>
              <div class="w-10 flex justify-center shrink-0">
                <i class="fa-solid fa-layer-group text-2xl text-white group-hover:scale-110 transition-transform drop-shadow-md z-10"></i>
              </div>
              <h3 class="text-white font-black text-lg md:text-xl uppercase tracking-wider z-10 flex-grow text-center drop-shadow-md">COLECCIÓN</h3>
              <div class="w-10 shrink-0"></div>
            </button>

          </div>
        </div>
      </main>

      <!-- Decoraciones (Absolute) -->

      <!-- Marca de Agua Central Gigante (Pokébola translúcida) -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 block dark:hidden opacity-10 dark:opacity-0 transition-opacity duration-300">
        <svg width="600" height="600" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="black" stroke-width="8"/>
          <path d="M5 50H95" stroke="black" stroke-width="8"/>
          <circle cx="50" cy="50" r="15" fill="white" stroke="black" stroke-width="8"/>
          <circle cx="50" cy="50" r="5" fill="black"/>
        </svg>
      </div>
    </div>
  `
})
export class GamePortalComponent implements OnInit, OnDestroy {
  @Output() startGame = new EventEmitter<string>();
  @Output() openDeckBuilder = new EventEmitter<void>();
  @Output() openCollection = new EventEmitter<void>();
  @Output() openHistory = new EventEmitter<void>();
  @Output() openRules = new EventEmitter<void>();

  isLoggedIn = false;
  currentUsername = '';
  showSettings = false;
  private authSub!: Subscription;

  constructor(
    private cdr: ChangeDetectorRef,
    private authService: SupabaseAuthService,
    private audioService: AudioService
  ) {}

  onVolumeChange(event: any) {
    const vol = parseFloat(event.target.value);
    this.audioService.setMainMenuVolume(vol);
  }

  toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
  }

  ngOnInit() {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    }

    this.authSub = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      if (user) {
        this.currentUsername = user.email?.split('@')[0] || 'Entrenador';
      } else {
        this.currentUsername = '';
      }
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    if (this.authSub) {
      this.authSub.unsubscribe();
    }
  }

  async handleLogout() {
    await this.authService.signOut();
    window.location.reload();
  }

  navigate(route: string) {
    if (route === 'deck') {
      this.openDeckBuilder.emit();
    } else if (route === 'pve') {
      this.startGame.emit('pve');
    } else if (route === 'pvp') {
      this.startGame.emit('lobby');
    } else if (route === 'collection') {
      this.openCollection.emit();
    } else if (route === 'history') {
      this.openHistory.emit();
    } else if (route === 'rules') {
      this.openRules.emit();
    }
  }
}
