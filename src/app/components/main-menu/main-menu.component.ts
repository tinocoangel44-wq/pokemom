import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Layout General: Fondo Rojo Pokémon -->
    <div class="h-screen w-full bg-red-600 flex flex-col font-sans relative overflow-hidden">
      
      <!-- Fondo decorativo sutil (patrón de puntos o líneas) -->
      <div class="absolute inset-0 opacity-10" style="background-image: radial-gradient(#000 1px, transparent 1px); background-size: 20px 20px;"></div>

      <!-- Header: Info del Jugador (Retro Brutalist) -->
      <header class="bg-white border-b-4 border-slate-800 p-4 flex justify-between items-center z-10 shadow-md">
        <!-- Izquierda: Avatar y Nombre -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-slate-800 rounded-full border-2 border-slate-800 flex items-center justify-center overflow-hidden">
            <span class="text-white font-black text-xl">T</span>
          </div>
          <div>
            <h1 class="font-black text-slate-800 text-lg uppercase tracking-wide">Entrenador Tinoco</h1>
            <span class="bg-yellow-400 text-slate-800 font-bold text-xs px-2 py-0.5 rounded border-2 border-slate-800 shadow-[2px_2px_0_0_rgba(30,41,59,1)]">
              Lv. 5
            </span>
          </div>
        </div>

        <!-- Derecha: Stats y Cerrar Sesión -->
        <div class="flex items-center gap-6">
          <div class="hidden sm:flex flex-col text-right">
            <span class="text-slate-500 font-bold text-xs uppercase tracking-widest">Récord</span>
            <span class="text-slate-800 font-black text-sm">12 W - 4 L</span>
          </div>
          <button class="bg-slate-200 hover:bg-slate-300 border-2 border-slate-800 rounded px-3 py-1 text-slate-700 font-bold text-xs uppercase shadow-[2px_2px_0_0_rgba(30,41,59,1)] active:translate-y-0.5 active:shadow-none transition-all">
            Cerrar Sesión
          </button>
        </div>
      </header>

      <!-- Contenedor Principal (Grid de Tarjetas) -->
      <main class="flex-1 flex items-center justify-center p-6 z-10">
        <div class="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          <!-- Tarjeta 1: PvE -->
          <div class="bg-green-400 border-4 border-slate-800 rounded-2xl shadow-[6px_6px_0_0_rgba(30,41,59,1)] hover:-translate-y-2 hover:shadow-[8px_8px_0_0_rgba(30,41,59,1)] transition-all cursor-pointer p-6 flex flex-col items-center text-center group">
            <div class="w-16 h-16 bg-white rounded-full border-4 border-slate-800 mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-[4px_4px_0_0_rgba(30,41,59,1)]">
              🤖
            </div>
            <h2 class="text-slate-900 font-black text-2xl uppercase tracking-widest mb-1">Jugar vs IA</h2>
            <p class="text-slate-800 font-bold text-sm">Prueba tu mazo contra la computadora</p>
          </div>

          <!-- Tarjeta 2: PvP -->
          <div (click)="openPvPModal()" class="bg-blue-400 border-4 border-slate-800 rounded-2xl shadow-[6px_6px_0_0_rgba(30,41,59,1)] hover:-translate-y-2 hover:shadow-[8px_8px_0_0_rgba(30,41,59,1)] transition-all cursor-pointer p-6 flex flex-col items-center text-center group">
            <div class="w-16 h-16 bg-white rounded-full border-4 border-slate-800 mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-[4px_4px_0_0_rgba(30,41,59,1)]">
              ⚔️
            </div>
            <h2 class="text-slate-900 font-black text-2xl uppercase tracking-widest mb-1">Batalla Online</h2>
            <p class="text-slate-800 font-bold text-sm">Únete a una sala y compite contra otros</p>
          </div>

          <!-- Tarjeta 3: Constructor de Mazos -->
          <div class="bg-yellow-400 border-4 border-slate-800 rounded-2xl shadow-[6px_6px_0_0_rgba(30,41,59,1)] hover:-translate-y-2 hover:shadow-[8px_8px_0_0_rgba(30,41,59,1)] transition-all cursor-pointer p-6 flex flex-col items-center text-center group">
            <div class="w-16 h-16 bg-white rounded-full border-4 border-slate-800 mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-[4px_4px_0_0_rgba(30,41,59,1)]">
              🎴
            </div>
            <h2 class="text-slate-900 font-black text-2xl uppercase tracking-widest mb-1">Mis Cartas</h2>
            <p class="text-slate-800 font-bold text-sm">Arma tu estrategia de 20 cartas</p>
          </div>

          <!-- Tarjeta 4: Configuración -->
          <div class="bg-slate-300 border-4 border-slate-800 rounded-2xl shadow-[6px_6px_0_0_rgba(30,41,59,1)] hover:-translate-y-2 hover:shadow-[8px_8px_0_0_rgba(30,41,59,1)] transition-all cursor-pointer p-6 flex flex-col items-center text-center group">
            <div class="w-16 h-16 bg-white rounded-full border-4 border-slate-800 mb-4 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-[4px_4px_0_0_rgba(30,41,59,1)]">
              ⚙️
            </div>
            <h2 class="text-slate-900 font-black text-2xl uppercase tracking-widest mb-1">Opciones</h2>
            <p class="text-slate-800 font-bold text-sm">Volumen y ajustes locales</p>
          </div>

        </div>
      </main>

      <!-- ============================== -->
      <!-- MODAL PVP (Batalla Online)     -->
      <!-- ============================== -->
      <div *ngIf="showPvPModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        
        <!-- Caja de Diálogo Estilo Pokémon -->
        <div class="w-full max-w-sm bg-white border-4 border-slate-800 rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden transform transition-all">
          
          <div class="bg-blue-500 border-b-4 border-slate-800 p-4">
            <h3 class="text-white font-black text-xl uppercase tracking-wide text-center">Conexión Multijugador</h3>
          </div>
          
          <div class="p-6 flex flex-col gap-5">
            <p class="text-slate-700 font-bold text-center text-sm">¿Deseas crear una nueva sala o unirte a una existente con código?</p>
            
            <button class="bg-green-400 hover:bg-green-300 border-4 border-slate-800 rounded-xl shadow-[4px_4px_0_0_rgba(30,41,59,1)] active:translate-y-1 active:shadow-none transition-all py-3 font-black text-slate-800 text-lg uppercase tracking-widest">
              Crear Sala Nueva
            </button>
            
            <div class="relative flex items-center justify-center">
              <span class="absolute bg-white px-2 text-slate-400 font-bold text-xs uppercase tracking-widest">O</span>
              <div class="w-full h-0.5 bg-slate-300"></div>
            </div>

            <div class="flex flex-col gap-2">
              <input type="text" placeholder="CÓDIGO (Ej. X7Y9Z1)" maxlength="6"
                     class="bg-gray-100 focus:bg-white focus:ring-0 focus:border-blue-500 border-2 border-slate-400 rounded-lg p-3 w-full font-black text-slate-800 outline-none transition-colors text-center uppercase tracking-widest" />
              <button class="bg-yellow-400 hover:bg-yellow-300 border-4 border-slate-800 rounded-xl shadow-[4px_4px_0_0_rgba(30,41,59,1)] active:translate-y-1 active:shadow-none transition-all py-2 font-black text-slate-800 uppercase tracking-widest">
                Unirse con Código
              </button>
            </div>
            
            <button (click)="closePvPModal()" class="mt-2 text-slate-500 hover:text-slate-700 font-black underline uppercase text-sm text-center">
              Cancelar
            </button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class MainMenuComponent {
  showPvPModal: boolean = false;

  openPvPModal() {
    this.showPvPModal = true;
  }

  closePvPModal() {
    this.showPvPModal = false;
  }
}
