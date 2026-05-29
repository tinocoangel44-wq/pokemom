import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import sqliteClient from '../../../lib/sqliteClient';
import { PokemonCardComponent } from '../pokemon-card/pokemon-card.component';
import { MultiplayerService } from '../../services/multiplayer.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, PokemonCardComponent],
  template: `
    <style>
      @keyframes zoomIn {
        from { transform: scale(0); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .rotate-y-180 { transform: rotateY(180deg); }
      .animate-zoomIn { animation: zoomIn 0.3s ease-out forwards; }
      .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #4B5563; border-radius: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background-color: transparent; }
      @keyframes boardShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px) rotate(-1deg); }
        50% { transform: translateX(5px) rotate(1deg); }
        75% { transform: translateX(-5px) rotate(-1deg); }
      }
      .animate-boardShake { animation: boardShake 0.3s ease-in-out; }
      
      @keyframes coinFlip {
        0% { transform: rotateY(0deg) scale(1); }
        50% { transform: rotateY(900deg) scale(1.5); }
        100% { transform: rotateY(1800deg) scale(1); }
      }
      .animate-coinFlip { animation: coinFlip 2s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

      /* Estilos específicos del Tapete (Tabletop) */
      .playmat-border {
        box-shadow: inset 0 0 50px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.9);
      }
      .pokeball-center {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 140px;
        height: 140px;
        border-radius: 50%;
        border: 8px solid #111827; /* gray-900 */
        background: transparent;
        z-index: 10;
      }
      .pokeball-center::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 6px solid #111827;
        background: #374151; /* gray-700 */
      }
      .card-placeholder {
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        transition: all 0.3s ease;
      }
      .card-placeholder.interactive:hover {
        border-color: rgba(59, 130, 246, 0.5);
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.3) inset;
      }
      @keyframes coin-flip-heads {
        0% { transform: rotateY(0deg); }
        100% { transform: rotateY(1800deg); }
      }
      @keyframes coin-flip-tails {
        0% { transform: rotateY(0deg); }
        100% { transform: rotateY(1980deg); }
      }
      .animate-coinFlipHeads {
        animation: coin-flip-heads 2.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      .animate-coinFlipTails {
        animation: coin-flip-tails 2.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
      }
      
      @keyframes slideCutIn {
        0% { transform: translate(-150%, -50%) skewX(-20deg) scale(0.8); opacity: 0; }
        20% { transform: translate(-50%, -50%) skewX(-20deg) scale(1.1); opacity: 1; }
        30% { transform: translate(-50%, -50%) skewX(0deg) scale(1); opacity: 1; }
        70% { transform: translate(-50%, -50%) skewX(0deg) scale(1); opacity: 1; }
        80% { transform: translate(-50%, -50%) skewX(20deg) scale(1.1); opacity: 1; }
        100% { transform: translate(150%, -50%) skewX(20deg) scale(0.8); opacity: 0; }
      }
      .animate-slideCutIn {
        animation: slideCutIn 2s cubic-bezier(0.25, 1, 0.5, 1) forwards;
        box-shadow: 0 0 50px 10px #3b82f6;
      }
      
      @keyframes slide-phase-aaa {
        0% { transform: translateX(-120vw) skewX(-20deg); opacity: 0; filter: brightness(2); }
        15% { transform: translateX(0) skewX(0deg); opacity: 1; filter: brightness(1); }
        85% { transform: translateX(0) skewX(0deg); opacity: 1; }
        100% { transform: translateX(120vw) skewX(20deg); opacity: 0; }
      }
      .animacion-imagen-fase {
        animation: slide-phase-aaa 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      }
    </style>

    <!-- TURN ANIMATION OVERLAY -->
    <div *ngIf="isTurnAnimating" class="fixed inset-0 z-[1001] bg-black/60 pointer-events-none flex items-center justify-center">
        <h1 class="animacion-imagen-fase text-7xl md:text-9xl font-black text-transparent bg-clip-text uppercase italic tracking-widest filter drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]"
            [ngClass]="isMyTurn ? 'bg-gradient-to-r from-cyan-400 to-blue-600' : 'bg-gradient-to-r from-red-600 to-orange-500'">
           {{ isMyTurn ? '¡TU TURNO!' : 'TURNO DEL RIVAL' }}
        </h1>
    </div>

    <!-- PHASE ANIMATION OVERLAY -->
    <div *ngIf="isPhaseAnimating && !isTurnAnimating" class="fixed inset-0 z-[1000] bg-black/60 pointer-events-none flex items-center justify-center">
        <img *ngIf="!imageFailed" [src]="getPhaseImage(gameState.phase)" (error)="imageFailed = true" class="animacion-imagen-fase max-h-[25vh] object-contain">
        <h1 *ngIf="imageFailed" class="animacion-imagen-fase text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white uppercase italic tracking-widest filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">
           FASE {{ gameState.phase }}
        </h1>
    </div>

    <!-- CUT-IN ANIMATION OVERLAY -->
    <div *ngIf="cutInActive && cutInCard" class="fixed inset-0 w-screen h-screen z-[999] bg-black/80 flex flex-col items-center justify-center pointer-events-none">
        <div class="relative mb-6 transform scale-100 origin-center drop-shadow-2xl">
            <app-pokemon-card [card]="cutInCard" size="normal" [isDisabled]="true"></app-pokemon-card>
        </div>
        <h2 class="text-center text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_15px_rgba(0,255,255,1)] px-4">
            {{ cutInMessage }}
        </h2>
    </div>

    <!-- ============================== -->
    <!-- CONTENEDOR PADRE PRINCIPAL     -->
    <!-- ============================== -->
    <div *ngIf="gameState && player && opponent" class="relative w-full h-screen overflow-hidden bg-stone-900 font-sans text-white">
      
      <!-- IMAGEN DE FONDO GLOBAL -->
      <img [src]="backgroundUrl" class="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-80" />

      <!-- COIN TOSS OVERLAY -->
      <div *ngIf="showCoinToss" class="fixed inset-0 z-[100] bg-black/60 flex flex-col items-center justify-center backdrop-blur-md pointer-events-auto transition-opacity duration-500">
        <h2 class="text-white text-3xl font-black mb-16 tracking-widest uppercase text-center drop-shadow-xl shadow-black">Lanzamiento de Moneda</h2>
        <div style="perspective: 1000px;" class="mb-12 relative w-48 h-48 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
          <div class="w-full h-full rounded-full"
               [ngClass]="{'shadow-[0_0_100px_rgba(59,130,246,0.6)]': finalCoinFace === 'heads', 'shadow-[0_0_100px_rgba(220,38,38,0.6)]': finalCoinFace === 'tails'}"
               style="transform-style: preserve-3d;" 
               [ngClass]="coinTossAnimating ? (finalCoinFace === 'heads' ? 'animate-coinFlipHeads' : 'animate-coinFlipTails') : (finalCoinFace === 'tails' ? 'rotate-y-180' : '')">
            <!-- Cara Jugador (Azul) -->
            <div class="absolute inset-0 rounded-full overflow-hidden" style="backface-visibility: hidden; background: transparent;">
              <img src="assets/images/coin_player_blue.png" class="w-full h-full object-cover scale-[1.25]">
            </div>
            <!-- Cara Rival (Rojo) -->
            <div class="absolute inset-0 rounded-full overflow-hidden" style="backface-visibility: hidden; transform: rotateY(180deg); background: transparent;">
              <img src="assets/images/coin_rival_red.png" class="w-full h-full object-cover scale-[1.25]">
            </div>
          </div>
        </div>
        <div class="h-32 flex flex-col items-center justify-center">
          <div *ngIf="coinTossResult" class="flex flex-col items-center animate-zoomIn">
            <h3 class="text-3xl text-gray-300 font-bold uppercase tracking-widest mb-2">{{ coinFaceResult }}</h3>
            <h1 class="text-5xl md:text-6xl text-cyan-400 font-black uppercase tracking-widest drop-shadow-[0_0_30px_rgba(6,182,212,0.8)] text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">
              {{ coinTossResult }}
            </h1>
          </div>
        </div>
      </div>
      
      <!-- MANO DEL RIVAL (Ubicación Estricta Arriba) -->
      <!-- ============================== -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 flex justify-center -space-x-4 pointer-events-none z-40 mt-2">
        <div *ngFor="let card of opponent.hand" class="w-[70px] h-[100px] bg-[#1e3a8a] border-2 border-[#3b82f6]/50 rounded-sm shadow-lg flex items-center justify-center relative">
          <div class="w-full h-full absolute inset-0 border border-[#60a5fa]/30 rounded flex items-center justify-center opacity-70">
             <div class="w-6 h-6 rounded-full border-2 border-[#60a5fa] bg-[#1e40af] shadow-inner relative flex items-center justify-center">
                <div class="w-2 h-2 rounded-full bg-[#93c5fd]"></div>
             </div>
          </div>
        </div>
      </div>

      <!-- ============================== -->
      <!-- CAPA DEL GRID CENTRAL (Zonas de Juego) -->
      <!-- ============================== -->
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-auto">
        <div class="flex flex-col gap-0">
          
          <!-- GRID RIVAL -->
          <div class="flex flex-col gap-0">
            <!-- Magias/Trampas Rival -->
            <div class="grid grid-cols-5 gap-0">
               <div *ngFor="let i of [0,1,2,3,4]" class="relative w-[100px] h-[145px] border-2 border-white/20 bg-black/40 rounded-sm">
                 <div *ngIf="opponent.spells[i]" class="absolute top-1/2 left-1/2 origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.5] pointer-events-auto animate-zoomIn drop-shadow-2xl z-20">
                   <app-pokemon-card [card]="opponent.spells[i]" size="normal" [isDisabled]="true"></app-pokemon-card>
                 </div>
               </div>
            </div>
            <!-- Monstruos Rival -->
            <div class="grid grid-cols-5 gap-0">
               <div *ngFor="let i of [0,1,2,3,4]" class="relative w-[100px] h-[145px] border-2 border-white/20 bg-black/40 rounded-sm">
                 <div *ngIf="opponent.monsters[i]" class="absolute top-1/2 left-1/2 origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.5] pointer-events-auto cursor-pointer animate-zoomIn drop-shadow-2xl z-20 hover:scale-[0.52] hover:brightness-110 transition-all duration-200" (click)="onOpponentCardClick(i)">
                   <app-pokemon-card 
                     [card]="opponent.monsters[i]" 
                     size="normal"
                     [isTapped]="opponent.monsters[i].hasAttacked"
                     [isDisabled]="!isMyTurn || gameState.phase !== 'BATTLE' || selectedAttackerIndex === null"
                   ></app-pokemon-card>
                 </div>
               </div>
            </div>
          </div>

          <!-- GRID JUGADOR -->
          <div class="flex flex-col gap-0">
            <!-- Monstruos Jugador -->
            <div class="grid grid-cols-5 gap-0">
               <div *ngFor="let i of [0,1,2,3,4]" class="relative w-[100px] h-[145px] border-2 border-white/20 bg-black/40 rounded-sm transition-all duration-300"
                    [ngClass]="(!player.monsters[i] && isMyTurn && (gameState.phase === 'MAIN 1' || gameState.phase === 'MAIN 2')) ? 'hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)_inset] cursor-pointer' : ''">
                 <div *ngIf="player.monsters[i]" class="absolute top-1/2 left-1/2 origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.5] pointer-events-auto cursor-pointer animate-zoomIn drop-shadow-2xl z-20 hover:scale-[0.52] hover:brightness-110 transition-all duration-200" (click)="selectAttacker(i)">
                   <app-pokemon-card 
                     [card]="player.monsters[i]" 
                     size="normal"
                     [isSelected]="selectedAttackerIndex === i"
                     [isTapped]="player.monsters[i].hasAttacked"
                     [isDisabled]="!isMyTurn || (gameState.phase !== 'MAIN 1' && gameState.phase !== 'MAIN 2' && gameState.phase !== 'BATTLE') || (gameState.phase === 'BATTLE' && player.monsters[i].hasAttacked)"
                   ></app-pokemon-card>
                 </div>

                 <!-- Menú Contextual Ataque -->
                 <div *ngIf="showAttackMenu && gameState.phase === 'BATTLE' && selectedAttackerIndex === i" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border-2 border-red-500 rounded-lg p-2 text-center min-w-max shadow-xl z-50 flex flex-col gap-2">
                   <button (click)="confirmAttack()" class="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded shadow transition-colors text-xs">ATACAR ({{ player.monsters[i].attack_points }})</button>
                   <button (click)="cancelAttack()" class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] font-bold px-4 py-1 rounded shadow transition-colors">Cancelar</button>
                 </div>

                 <!-- Menú Contextual Habilidad -->
                 <div *ngIf="selectedMonsterMenuIndex === i && (gameState.phase === 'MAIN 1' || gameState.phase === 'MAIN 2')" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border-2 border-blue-500 rounded-lg p-2 text-center min-w-max shadow-xl z-50 flex flex-col gap-2">
                   <ng-container *ngIf="!isPassiveAbility(player.monsters[i])">
                     <button [disabled]="player.monsters[i].hasUsedAbilityThisTurn" (click)="activateEffect(i)" class="text-white font-black px-4 py-2 rounded transition-colors text-xs" [ngClass]="player.monsters[i].hasUsedAbilityThisTurn ? 'bg-gray-600 opacity-50 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse'">ACTIVAR HABILIDAD</button>
                   </ng-container>
                   <button (click)="selectedMonsterMenuIndex = null" class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] font-bold px-4 py-1 rounded shadow transition-colors">Cerrar</button>
                 </div>

                 <button *ngIf="isMyTurn && gameState.phase === 'BATTLE' && selectedAttackerIndex === i && !hasOpponentCards() && !showAttackMenu" (click)="attackDirectly()" class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-500 text-white font-black px-4 py-1 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.8)] animate-pulse z-40 text-[10px] whitespace-nowrap">ATAQUE DIRECTO</button>
               </div>
            </div>
            
            <!-- Magias/Trampas Jugador -->
            <div class="grid grid-cols-5 gap-0">
               <div *ngFor="let i of [0,1,2,3,4]" class="relative w-[100px] h-[145px] border-2 border-white/20 bg-black/40 rounded-sm transition-all duration-300"
                    [ngClass]="(!player.spells[i] && isMyTurn && (gameState.phase === 'MAIN 1' || gameState.phase === 'MAIN 2')) ? 'hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)_inset] cursor-pointer' : ''">
                 <div *ngIf="player.spells[i]" class="absolute top-1/2 left-1/2 origin-center -translate-x-1/2 -translate-y-1/2 scale-[0.5] pointer-events-auto cursor-pointer animate-zoomIn drop-shadow-2xl z-40 transition-all duration-200 hover:scale-[0.52] hover:brightness-110" (click)="onSpellTrapClick(i)">
                   <app-pokemon-card [card]="player.spells[i]" size="normal" [isDisabled]="!isMyTurn || (gameState.phase !== 'MAIN 1' && gameState.phase !== 'MAIN 2')"></app-pokemon-card>
                 </div>

                 <div *ngIf="selectedSpellMenuIndex === i && (gameState.phase === 'MAIN 1' || gameState.phase === 'MAIN 2')" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900/95 border-2 border-purple-500 rounded-lg p-2 text-center min-w-max shadow-xl z-50 flex flex-col gap-2">
                   <button *ngIf="player.spells[i].ability !== 'Trampa' && !player.spells[i].isFaceDown" (click)="activateSpellTrap(i)" class="bg-purple-600 hover:bg-purple-500 text-white font-black px-4 py-2 rounded shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-colors text-xs animate-pulse">ACTIVAR CARTA</button>
                   <button *ngIf="player.spells[i].ability === 'Trampa' || player.spells[i].isFaceDown" disabled class="bg-gray-600 text-gray-400 font-bold px-4 py-2 rounded text-[10px] uppercase cursor-not-allowed border border-gray-500">No puedes activar esto ahora</button>
                   <button (click)="selectedSpellMenuIndex = null" class="bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] font-bold px-4 py-1 rounded shadow transition-colors">Cerrar</button>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>



      <!-- ============================== -->
      <!-- MANO DEL JUGADOR (Ubicación Estricta Abajo) -->
      <!-- ============================== -->
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex justify-center items-end -space-x-4 pb-2 z-50">
        <div *ngFor="let card of player.hand; let i = index" 
             [style.transform]="getHandCardRotation(i, player.hand.length)"
             class="relative w-[115px] h-[166px] transition-all duration-300 hover:-translate-y-8 hover:z-50 hover:scale-110 cursor-pointer origin-bottom bg-transparent pointer-events-none">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center scale-[0.6] pointer-events-auto w-max">
            <app-pokemon-card 
              [card]="card" 
              size="normal"
              [isDisabled]="!isMyTurn || (gameState.phase !== 'MAIN 1' && gameState.phase !== 'MAIN 2') || isPhaseAnimating"
              (onClick)="summonCard(i)"
            ></app-pokemon-card>
          </div>
        </div>
      </div>

      <!-- ============================== -->
      <!-- PANELES Y HUD FUERA DEL TAPETE -->
      <!-- ============================== -->

      <!-- HUD Rival (Arriba Izquierda) -->
      <div class="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-md border border-gray-600 rounded-xl p-3 shadow-2xl z-40 w-72 transition-colors duration-300"
           [ngClass]="{'border-red-500 bg-red-900/50 animate-boardShake': isOpponentTakingDamage}">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-red-900 border-2 border-red-400 flex items-center justify-center font-bold text-xl">{{ opponent.name.charAt(0) | uppercase }}</div>
          <div class="flex-1">
            <div class="flex justify-between font-bold text-sm mb-1">
              <span class="truncate">{{ opponent.name }}</span>
              <span class="font-black" [ngClass]="getLpColor(opponent.lifePoints)">{{ opponent.lifePoints }} LP</span>
            </div>
            <div class="w-full h-2 bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <div class="h-full transition-all duration-500 rounded-full" [style.width.%]="getLpPercentage(opponent.lifePoints)" [ngClass]="getLpBgColor(opponent.lifePoints)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Log del Juego (Medio Izquierda) -->
      <div class="absolute left-6 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md border border-gray-700/50 rounded-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.8)] z-40 w-72 h-64 flex flex-col transition-all hover:bg-black/80">
        <span class="text-[10px] text-cyan-500 font-bold uppercase tracking-widest border-b border-cyan-900/50 pb-2 mb-2 flex items-center justify-between">
          Registro de Duelo <span class="text-xs">📜</span>
        </span>
        <div class="overflow-y-auto text-[10px] text-gray-300 font-mono flex flex-col-reverse custom-scrollbar flex-1 pr-1 space-y-1">
           <div *ngFor="let logMsg of gameState.log.slice(-15).reverse()" class="mb-1 pb-1 opacity-80 hover:opacity-100 transition-opacity border-b border-gray-800/50 last:border-0 leading-relaxed">
             {{ logMsg }}
           </div>
        </div>
      </div>

      <!-- HUD Jugador (Abajo Izquierda) - Movido para no cruzar con el log -->
      <div class="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-40 w-72 transition-all duration-300"
           [ngClass]="{'border-red-500 bg-red-900/50 animate-boardShake': isPlayerTakingDamage}">
        <div class="flex items-center gap-4">
          <div class="relative w-16 h-16 rounded-full border-[3px] border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)] flex items-center justify-center font-black text-3xl bg-slate-900 text-cyan-300 overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-t from-cyan-900/50 to-transparent"></div>
            <span class="z-10">{{ player.name.charAt(0) | uppercase }}</span>
          </div>
          <div class="flex-1">
            <div class="flex justify-between font-bold mb-2 items-end">
              <span class="text-gray-300 text-sm tracking-widest uppercase">{{ player.name }}</span>
              <span class="text-3xl font-black font-mono tracking-tighter drop-shadow-md" [ngClass]="getLpColor(player.lifePoints)">{{ player.lifePoints }}</span>
            </div>
            <div class="w-full h-3 bg-gray-900 rounded-sm overflow-hidden shadow-inner border border-gray-700/50 relative">
              <!-- Grid line overlays for futuristic look -->
              <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTE5LjUgMEwxOS41IDIwaC0xVjB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-50 z-10 pointer-events-none"></div>
              <div class="h-full transition-all duration-700 ease-out" [style.width.%]="getLpPercentage(player.lifePoints)" [ngClass]="getLpBgColor(player.lifePoints)"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- CONTROLES Y FASES ESTILO MASTER DUEL (Derecha) -->
      <div class="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-10 items-center">
        
        <!-- Rival Deck (Mini) -->
        <div class="w-[70px] h-[100px] border-2 border-gray-500 rounded-md bg-blue-900 flex items-center justify-center relative shadow-xl opacity-80">
          <span class="z-10 font-black text-xl text-blue-200 drop-shadow-md">{{ opponent.deck.length }}</span>
        </div>

        <!-- Botón Único Master Duel -->
        <button (click)="endPhase()" 
                [disabled]="!isMyTurn || isPhaseAnimating"
                class="w-full py-6 px-4 rounded-xl border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-lg font-black relative overflow-hidden"
                [ngClass]="(isMyTurn && !isPhaseAnimating) ? 'bg-gradient-to-r from-blue-700 to-indigo-600 border-indigo-400 text-white hover:from-blue-600 hover:to-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.8)] animate-pulse' : 'bg-gray-800/80 border-gray-600 text-gray-400'">
          <span class="relative z-10 text-center flex flex-col leading-tight"><span class="text-[10px] font-bold text-indigo-200">FASE ACTUAL: {{ gameState.phase }}</span>CONTINUAR FASE</span>
          <div *ngIf="isMyTurn && !isPhaseAnimating" class="absolute inset-0 bg-white/20 blur-md transform -skew-x-12 -translate-x-full hover:translate-x-full transition-transform duration-700"></div>
        </button>

        <!-- Player Deck (Normal) -->
        <div class="flex flex-col gap-2 items-center pointer-events-auto mt-4">
          <div class="w-[100px] h-[145px] border-2 border-gray-500 rounded-md bg-blue-900 flex items-center justify-center relative shadow-xl cursor-pointer hover:-translate-y-2 transition-transform" (click)="drawCard()">
            <span class="z-10 font-black text-3xl text-blue-200 drop-shadow-md">{{ player.deck.length }}</span>
          </div>
          <div class="w-[100px] h-6 border-2 border-white/10 bg-black/40 rounded-sm flex items-center justify-center"><span class="text-[8px] text-white/50 uppercase font-bold tracking-widest">Mazo</span></div>
        </div>

        <button (click)="showSurrenderModal = true" class="mt-8 text-xs text-red-500/50 hover:text-red-500 font-bold uppercase tracking-widest transition-colors">Rendirse</button>

      </div>

      </div> <!-- FINAL DEL WRAPPER PRINCIPAL -->

      <!-- ============================== -->
      <!-- MODALES Y PANTALLAS DE FIN     -->
      <!-- ============================== -->
      
      <!-- Modal Rendición -->
      <div *ngIf="showSurrenderModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm pointer-events-auto">
        <div class="bg-gray-800 border-2 border-gray-600 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center transform animate-zoomIn">
          <h2 class="text-3xl font-black text-white mb-3">¿Rendirse?</h2>
          <p class="text-gray-400 mb-8">Si te rindes perderás la partida de forma inmediata. ¿Estás seguro de huir del combate?</p>
          <div class="flex gap-4 justify-center">
            <button (click)="showSurrenderModal = false" class="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-lg transition-colors">Cancelar</button>
            <button (click)="surrender()" class="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors shadow-[0_0_15px_rgba(220,38,38,0.5)]">Sí, me rindo</button>
          </div>
        </div>
      </div>
      
      <!-- Pantalla Game Over -->
      <div *ngIf="isGameOver" class="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[100] backdrop-blur-lg pointer-events-auto">
        <h1 class="text-7xl font-black mb-6 uppercase tracking-widest drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] animate-zoomIn"
            [ngClass]="gameState.winner === currentPlayerId ? 'text-yellow-400' : 'text-red-500'">
          {{ gameState.winner === currentPlayerId ? '¡VICTORIA!' : 'DERROTA' }}
        </h1>
        <p class="text-2xl text-gray-300 mb-12 font-light">
          {{ gameState.winner === currentPlayerId ? 'Has dominado completamente el tablero.' : 'Mejor suerte en tu próximo combate.' }}
        </p>
        <button onclick="location.reload()" class="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-2xl text-2xl animate-bounce uppercase tracking-wider">
          Volver al Menú Principal
        </button>
      </div>

  `
})
export class GameBoardComponent implements OnChanges, OnInit, OnDestroy {
  @Input() gameState: any;
  @Input() currentPlayerId!: string;
  @Input() isMultiplayer: boolean = false;
  @Input() isHost: boolean = false;
  @Output() onAction = new EventEmitter<{actionType: string, payload: any}>();

  selectedAttackerIndex: number | null = null;
  selectedMonsterMenuIndex: number | null = null;
  selectedSpellMenuIndex: number | null = null;
  showAttackMenu: boolean = false;
  showSurrenderModal: boolean = false;
  
  cutInActive: boolean = false;
  cutInCard: any = null;
  cutInMessage: string = '';
  
  isGameOver: boolean = false;
  partidaIniciada: boolean = false;
  
  showCoinToss = true;
  coinTossAnimating = false;
  coinTossResult = '';
  coinFaceResult = '';
  phases = ['DRAW', 'STANDBY', 'MAIN 1', 'BATTLE', 'MAIN 2', 'END'];
  isPhaseAnimating = false;
  isTurnAnimating = false;
  
  backgroundUrl: string = '';

  isPlayerTakingDamage = false;
  isOpponentTakingDamage = false;
  private prevPlayerLp = 4000;
  private prevOpponentLp = 4000;

  private coinFlipSub!: Subscription;

  constructor(private cdr: ChangeDetectorRef, private multiplayerService: MultiplayerService) {}

  get opponentId(): string {
    if (!this.gameState || !this.gameState.players) return '';
    return Object.keys(this.gameState.players).find(id => id !== this.currentPlayerId) || '';
  }

  get player() { return this.gameState?.players[this.currentPlayerId]; }
  get opponent() { return this.gameState?.players[this.opponentId]; }
  get isMyTurn(): boolean { return this.gameState?.activePlayerId === this.currentPlayerId; }

  ngOnInit() {
    const playmats = [
      'playmat_agua.png', 
      'playmat_planta.png', 
      'playmat_fantasma.png', 
      'playmat_fuego.png', 
      'playmat_electrico.png'
    ];
    const randomPlaymat = playmats[Math.floor(Math.random() * playmats.length)];
    this.backgroundUrl = `playmats/${randomPlaymat}`;

    this.isMultiplayer = this.multiplayerService.isOnlineMatch.value;

    if (this.isMultiplayer) {
      if (this.opponent) {
        this.opponent.name = "Esperando oponente...";
      }
      this.setupMultiplayerListeners();
    } else {
      if (this.opponent) {
        this.opponent.name = "Rival (IA)";
      }
      this.iniciarPartidaLocal();
    }
  }

  private listenersBound = false;

  setupMultiplayerListeners() {
    if (this.listenersBound) return;
    this.listenersBound = true;

    if (this.isHost) {
      const isPlayerFirst = Math.random() > 0.5;
      const result = isPlayerFirst ? 'heads' : 'tails';
      
      // Delay to ensure the Guest has fully loaded the board and bound the 'coin_flip' listener
      setTimeout(() => {
          this.multiplayerService.sendCoinFlipResult(this.multiplayerService.currentRoomCode!, result, isPlayerFirst, this.backgroundUrl);
          this.triggerCoinAnimation(result, isPlayerFirst, false);
      }, 1500);
    } else {
      if (this.multiplayerService.currentChannel) {
        this.multiplayerService.currentChannel.on('broadcast', { event: 'coin_flip' }, (payload: any) => {
          const { result, hostGoesFirst, backgroundId } = payload.payload;
          if (backgroundId) {
             this.backgroundUrl = backgroundId;
             this.cdr.detectChanges();
          }
          const isPlayerFirst = !hostGoesFirst;
          const localResult = isPlayerFirst ? 'heads' : 'tails';
          this.triggerCoinAnimation(localResult, isPlayerFirst, true);
        });
      }
    }

    if (this.multiplayerService.currentChannel) {
      this.multiplayerService.currentChannel.on('broadcast', { event: 'sync_player_info' }, (payload: any) => {
          if (this.opponent) {
            this.opponent.name = payload.payload.name;
            this.opponent.lifePoints = payload.payload.lp;
            
            // Reconstruir los arreglos visuales de mazo y mano según lo enviado
            if (payload.payload.deckCount !== undefined) {
               this.opponent.deck = new Array(payload.payload.deckCount).fill({ isFaceDown: true });
            }
            if (payload.payload.handCount !== undefined) {
               this.opponent.hand = new Array(payload.payload.handCount).fill({ isFaceDown: true });
            }
            this.cdr.detectChanges();
          }
      });

      this.multiplayerService.currentChannel.on('broadcast', { event: 'update_lp' }, (payload: any) => {
          if (this.opponent) {
              this.opponent.lifePoints = payload.payload.lp;
              this.evaluarEstadoJuego();
              this.cdr.detectChanges();
          }
      });

      this.multiplayerService.currentChannel.on('broadcast', { event: 'FULL_STATE_SYNC' }, (payload: any) => {
          const data = payload.payload;
          if (data.senderRole === (this.isHost ? 'host' : 'guest')) return; // Ignorar el propio broadcast
          if (!this.opponent) return;
          
          this.opponent.lifePoints = data.lp;
          
          while (this.opponent.hand.length > data.handCount) { this.opponent.hand.pop(); }
          while (this.opponent.hand.length < data.handCount) { this.opponent.hand.push({ isFaceDown: true }); }
          
          while (this.opponent.deck.length > data.deckCount) { this.opponent.deck.pop(); }
          while (this.opponent.deck.length < data.deckCount) { this.opponent.deck.push({ isFaceDown: true }); }
          
          // Solo actualizar la fase si NO es mi turno (evitar que el rival sobrescriba mi fase local)
          if (this.gameState.activePlayerId !== this.currentPlayerId) {
              this.gameState.phase = data.faseActual;
          }
          
          this.opponent.monsters = [null, null, null, null, null];
          if (data.campo && Array.isArray(data.campo)) {
              data.campo.forEach((cartaData: any, index: number) => {
                  if (cartaData) {
                      const nombreCarta = typeof cartaData === 'string' ? cartaData : cartaData.name;
                      let cartaCompleta = this.buscarCartaPorNombre(nombreCarta);
                      if (cartaCompleta && this.opponent) {
                          cartaCompleta = { ...cartaCompleta }; // Clone to trigger Angular CD
                          if (typeof cartaData === 'object') {
                              cartaCompleta.attack_points = cartaData.attack_points;
                              cartaCompleta.defense_points = cartaData.defense_points;
                              cartaCompleta.hp_points = cartaData.hp_points !== undefined ? cartaData.hp_points : cartaCompleta.hp_points;
                              cartaCompleta.base_hp = cartaData.base_hp !== undefined ? cartaData.base_hp : cartaCompleta.base_hp;
                              if (cartaData.isFaceDown !== undefined) cartaCompleta.isFaceDown = cartaData.isFaceDown;
                          }
                          this.opponent.monsters[index] = cartaCompleta;
                      }
                  }
              });
          }
          
          this.opponent.spells = [null, null, null, null, null];
          if (data.magias && Array.isArray(data.magias)) {
              data.magias.forEach((nombreCarta: string | null, index: number) => {
                  if (nombreCarta) {
                      const cartaCompleta = this.buscarCartaPorNombre(nombreCarta);
                      if (cartaCompleta && this.opponent) {
                          this.opponent.spells[index] = cartaCompleta;
                      }
                  }
              });
          }
          
          if (data.cementerio && Array.isArray(data.cementerio)) {
              this.opponent.graveyard = data.cementerio.map((nombreCarta: string) => this.buscarCartaPorNombre(nombreCarta)).filter((c: any) => c !== null);
          }
          
          // Reverse-Sync: Aplicar daño y destrucción sufrida (causada por el turno del Guest al Host)
          if (data.opponentLp !== undefined && data.opponentLp < this.player.lifePoints) {
              this.player.lifePoints = data.opponentLp;
          }
          if (data.opponentCampo && Array.isArray(data.opponentCampo)) {
              data.opponentCampo.forEach((cartaData: any, index: number) => {
                  if (cartaData === null) {
                      if (this.player.monsters[index] !== null) {
                          // El rival destruyó nuestro monstruo
                          this.gameState.log.push(`[Sistema] Tu ${this.player.monsters[index].name} fue destruido.`);
                          this.player.graveyard.push(this.player.monsters[index]);
                          this.player.monsters[index] = null;
                      }
                  } else {
                      // Actualizar stats de nuestro monstruo si sigue vivo (ej. modificado por efecto del rival)
                      if (this.player.monsters[index] !== null && typeof cartaData === 'object') {
                          const updatedMonster = { ...this.player.monsters[index] };
                          updatedMonster.attack_points = cartaData.attack_points;
                          updatedMonster.defense_points = cartaData.defense_points;
                          if (cartaData.hp_points !== undefined) updatedMonster.hp_points = cartaData.hp_points;
                          if (cartaData.base_hp !== undefined) updatedMonster.base_hp = cartaData.base_hp;
                          this.player.monsters[index] = updatedMonster;
                      }
                  }
              });
          }
          
          if (data.opponentHandCount !== undefined && data.opponentHandCount < this.player.hand.length) {
              const diff = this.player.hand.length - data.opponentHandCount;
              for(let i=0; i<diff; i++) {
                  const discarded = this.player.hand.pop();
                  if (discarded) this.player.graveyard.push(discarded);
              }
              this.gameState.log.push(`[Sistema] Has descartado ${diff} carta(s) por el efecto del rival.`);
          }
          
          if (data.opponentDeckCount !== undefined && data.opponentDeckCount < this.player.deck.length) {
              const diff = this.player.deck.length - data.opponentDeckCount;
              for(let i=0; i<diff; i++) this.player.deck.pop();
          }
          if (this.gameState.activePlayerId !== this.currentPlayerId) {
              this.gameState.phase = data.faseActual;
          }
          
          if (data.gameOver) {
              this.gameState.gameOver = data.gameOver;
              this.gameState.winner = data.winner;
          }
          
          this.evaluarEstadoJuego();
          
          if (this.gameState.phase !== data.faseActual && data.faseActual !== 'WAITING' && this.gameState.activePlayerId !== this.currentPlayerId) {
              this.triggerPhaseAnimation();
          }
          
          this.cdr.detectChanges();
      });

      this.multiplayerService.currentChannel.on('broadcast', { event: 'END_TURN' }, (payload: any) => {
          if (payload.payload?.senderRole === (this.isHost ? 'host' : 'guest')) return; // Ignorar el propio broadcast
          this.gameState.activePlayerId = this.currentPlayerId;
          this.gameState.phase = 'DRAW';
          
          if (this.player) {
              this.player.hasDrawnThisTurn = false;
              this.player.hasSummonedThisTurn = false;
              if (this.player.monsters) {
                  this.player.monsters.forEach((m: any) => { if (m) m.hasAttacked = false; });
              }
          }
          
          this.gameState.log.push("[Sistema] ¡ES TU TURNO!");
          this.triggerTurnAnimation();
          this.triggerPhaseAnimation();
          
          if (!this.isDrawingAutomated) {
              this.isDrawingAutomated = true;
              setTimeout(() => {
                  if (!this.player.hasDrawnThisTurn) {
                      this.drawCard();
                      setTimeout(() => {
                          this.advancePhase();
                          this.isDrawingAutomated = false;
                      }, 1500);
                  } else {
                      this.isDrawingAutomated = false;
                  }
              }, 2500);
          }
          this.cdr.detectChanges();
      });
    }
  }

  syncBoardState() {
    if (!this.isMultiplayer || !this.player) return;
    this.multiplayerService.currentChannel?.send({
        type: 'broadcast',
        event: 'FULL_STATE_SYNC',
        payload: {
            senderRole: this.isHost ? 'host' : 'guest',
            faseActual: this.gameState.phase,
            lp: this.player.lifePoints,
            handCount: this.player.hand?.length || 0,
            deckCount: this.player.deck?.length || 0,
            campo: this.player.monsters?.map((carta: any) => carta ? {
                name: carta.name || carta.nombre,
                attack_points: carta.current_atk || carta.attack_points,
                defense_points: carta.current_def || carta.defense_points,
                hp_points: carta.hp_points,
                base_hp: carta.base_hp,
                isFaceDown: carta.isFaceDown
            } : null) || [],
            magias: this.player.spells?.map((carta: any) => carta ? (carta.name || carta.nombre) : null) || [],
            cementerio: this.player.graveyard?.map((carta: any) => carta ? (carta.name || carta.nombre) : null) || [],
            opponentLp: this.opponent?.lifePoints,
            opponentCampo: this.opponent?.monsters?.map((carta: any) => carta ? {
                name: carta.name || carta.nombre,
                attack_points: carta.current_atk || carta.attack_points,
                defense_points: carta.current_def || carta.defense_points,
                hp_points: carta.hp_points,
                base_hp: carta.base_hp,
                isFaceDown: carta.isFaceDown
            } : null) || [],
            opponentHandCount: this.opponent?.hand?.length,
            opponentDeckCount: this.opponent?.deck?.length,
            gameOver: this.gameState.gameOver,
            winner: this.gameState.winner
        }
    });
  }

  iniciarPartidaLocal() {
    const isCara = Math.random() > 0.5;
    const isPlayerFirst = Math.random() > 0.5;
    this.triggerCoinAnimation(isCara ? 'heads' : 'tails', isPlayerFirst, false);
  }

  finalCoinFace: 'heads' | 'tails' = 'heads';

  triggerCoinAnimation(result: 'heads' | 'tails', isPlayerFirst: boolean, isGuest: boolean = false) {
    this.finalCoinFace = result;
    setTimeout(() => {
      this.coinTossAnimating = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.coinFaceResult = result === 'heads' ? 'CARA' : 'CRUZ';
        if (isGuest) {
            this.coinTossResult = isPlayerFirst ? '¡GANASTE EL VOLADO! TÚ VAS PRIMERO.' : 'EL OPONENTE GANÓ EL VOLADO. TÚ VAS SEGUNDO.';
        } else {
            this.coinTossResult = isPlayerFirst ? '¡TÚ COMIENZAS!' : 'EL RIVAL COMIENZA';
        }
        this.coinTossAnimating = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.showCoinToss = false;
          this.partidaIniciada = true;
          this.gameState.log.push(`[Sistema] El jugador ${isPlayerFirst ? 'local' : 'rival'} ganó el volado y va primero.`);
          this.cdr.detectChanges();

          // Emitimos al controlador principal que el volado terminó y quién va primero
          // ESTO LLAMARÁ INMEDIATAMENTE A drawInitialHands() EN app.ts
          this.onAction.emit({ actionType: 'coinTossComplete', payload: { isPlayerFirst } });
          
          if (this.isMultiplayer) {
              setTimeout(() => {
                  if (this.player && this.player.deck) {
                      this.multiplayerService.sendInitialPlayerData(
                          this.player.name, 
                          this.player.lifePoints,
                          this.player.deck.length,
                          this.player.hand.length
                      );
                  }
              }, 1500);
          }
        }, 3000); // Ajustado a 3000ms para asegurar fluidez
      }, 2500); // 2.5 seconds spinning
    }, 500);
  }

  ngOnDestroy() {
    if (this.coinFlipSub) this.coinFlipSub.unsubscribe();
  }

  emitirEstadoMaestro() {
    this.syncBoardState();
  }

  evaluarEstadoJuego() {
    if (!this.partidaIniciada || !this.player || !this.opponent) return;

    // Sincronizar victoria/derrota por mazo vacío (Deck Out) o rendición desde el motor principal
    if (this.gameState.gameOver) {
        this.isGameOver = true;
        return;
    }

    if (this.player.lifePoints <= 0) {
        this.player.lifePoints = 0;
        this.isGameOver = true;
        this.gameState.gameOver = true;
        this.gameState.winner = this.opponentId;
    } else if (this.opponent.lifePoints <= 0) {
        this.opponent.lifePoints = 0;
        this.isGameOver = true;
        this.gameState.gameOver = true;
        this.gameState.winner = this.currentPlayerId;
    }
  }

  ejecutarJugadaOponente(card: any, targetIndex: number = -1, esEvolucion: boolean = false) {
    if (!this.opponent) return;

    if (card.card_category === 'trainer' || card.supertype === 'Trainer') {
      // Retiramos pop ciego aquí porque ya se ajustará con el handCount
      // this.opponent.hand.pop(); 
      this.opponent.graveyard.push(card);
      this.gameState.log.push(`[Sistema] El rival activó la carta mágica: ${card.name || card.nombre}`);
      this.cdr.detectChanges();
      return;
    }

    let fieldIndex = targetIndex;
    
    // Si NO es evolución y no trae posición, busca un hueco vacío
    if (!esEvolucion && fieldIndex === -1) {
      fieldIndex = this.opponent.monsters.findIndex((m: any) => m === null);
    }
    // Si ES evolución y viene con posición -1 (legacy), busca la carta a evolucionar
    else if (esEvolucion && fieldIndex === -1) {
      fieldIndex = this.opponent.monsters.findIndex((m: any) => m !== null && m.name === card.pre_evolution_name);
    }

    if (fieldIndex !== -1) {
      const existing = this.opponent.monsters[fieldIndex];
      // Si es evolución, se cobra el daño previo de la pre-evolución
      if (esEvolucion && existing) {
        const damageTaken = existing.hp_points < (existing.base_hp || existing.hp_points) ? (existing.base_hp || existing.hp_points) - existing.hp_points : 0;
        card.base_hp = card.hp_points;
        card.hp_points -= damageTaken;
        this.opponent.graveyard.push(existing);
      } else {
        card.base_hp = card.hp_points;
      }
      // Reemplazo exacto en la posición
      this.opponent.monsters[fieldIndex] = card;
      // Ya no hacemos this.opponent.hand.pop() ciego si recibimos handCount en la red.
      // Se sobreescribirá correctamente arriba.
      card.hasAttacked = false;
      card.hasUsedAbilityThisTurn = false;
    }
    this.cdr.detectChanges();
  }

  procesarMagiaOponente(card: any, targetIndex: number = -1) {
    if (!this.opponent) return;
    const sIndex = targetIndex !== -1 ? targetIndex : this.opponent.spells.findIndex((s: any) => s === null);
    if (sIndex !== -1) {
      this.opponent.spells[sIndex] = card;
      this.opponent.hand.pop();
      card.isFaceDown = card.ability === 'Trampa';
    }
    this.cdr.detectChanges();
  }

  buscarCartaPorId(id: number | string): any {
    if (!id) return null;
    const todasLasCartasDelJuego = sqliteClient.getCachedCards();
    if (todasLasCartasDelJuego) {
      const found = todasLasCartasDelJuego.find((c: any) => c.id == id || c.pokemon_id == id);
      if (found) {
        return {
          ...found,
          attack_points: Number(found.attack_points) || Math.floor(Math.random() * 50 + 10) * 10,
          defense_points: Number(found.defense_points) || Math.floor(Math.random() * 50 + 10) * 10,
          hp_points: Number(found.hp_points) || Math.floor(Math.random() * 80 + 20) * 10
        };
      } else {
        console.error("ID de carta no encontrado en el catálogo maestro:", id);
      }
    }
    return null;
  }

  buscarCartaPorNombre(nombre: string): any {
    if (!nombre) return null;
    const todasLasCartasDelJuego = sqliteClient.getCachedCards();
    if (todasLasCartasDelJuego) {
      const nombreLower = nombre.toLowerCase();
      const found = todasLasCartasDelJuego.find((c: any) => 
        (c.name && c.name.toLowerCase() === nombreLower) || 
        (c.nombre && c.nombre.toLowerCase() === nombreLower)
      );
      if (found) {
        return {
          ...found,
          attack_points: Number(found.attack_points) || Math.floor(Math.random() * 50 + 10) * 10,
          defense_points: Number(found.defense_points) || Math.floor(Math.random() * 50 + 10) * 10,
          hp_points: Number(found.hp_points) || Math.floor(Math.random() * 80 + 20) * 10
        };
      }
    }
    return null;
  }

  procesarAtaqueOponente(attackerIndex: number, defenderIndex: number, danoFinal: number = 0) {
      const attacker = this.opponent.monsters[attackerIndex];
      const defender = this.player.monsters[defenderIndex];
      if (!attacker || !defender) return;
      attacker.hasAttacked = true;
      
      // Aplicar el daño FINAL calculado por el atacante
      defender.hp_points -= danoFinal;
      if (defender.hp_points <= 0) {
          const hpLost = Number(defender.base_hp) || 0;
          this.player.lifePoints -= hpLost;
          this.player.graveyard.push(defender);
          this.player.monsters[defenderIndex] = null;
      }
      
      // 2. Evitar números negativos
      if (this.player.lifePoints <= 0) {
          this.player.lifePoints = 0;
      }
      
      this.emitirEstadoMaestro();
      
      // 4. DISPARAR LA DERROTA SI LLEGÓ A CERO
      if (this.player.lifePoints === 0) {
          this.isGameOver = true;
          this.evaluarEstadoJuego();
      }

      this.cdr.detectChanges();
  }

  procesarAtaqueDirectoOponente(attackerIndex: number, danoFinal: number = 0) {
      const attacker = this.opponent.monsters[attackerIndex];
      if (!attacker) return;
      attacker.hasAttacked = true;
      
      this.player.lifePoints -= danoFinal;
      
      // 2. Evitar números negativos
      if (this.player.lifePoints <= 0) {
          this.player.lifePoints = 0;
      }
      
      this.emitirEstadoMaestro();
      
      // 4. DISPARAR LA DERROTA SI LLEGÓ A CERO
      if (this.player.lifePoints === 0) {
          this.isGameOver = true;
          this.evaluarEstadoJuego();
      }

      this.cdr.detectChanges();
  }

  procesarEfectoOponente(monsterIndex: number, nombrePokemon?: string) {
      const monster = this.opponent.monsters[monsterIndex];
      if (!monster) return;
      monster.hasUsedAbilityThisTurn = true;
      this.cutInActive = true;
      this.cutInCard = monster;
      this.cutInMessage = `¡${nombrePokemon || monster.name || monster.nombre} ACTIVA SU HABILIDAD!`;
      setTimeout(() => {
        this.cutInActive = false;
        this.cutInCard = null;
        this.cdr.detectChanges();
      }, 1500);
      this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gameState'] && this.gameState && this.player && this.opponent) {
      const currentPLp = this.player.lifePoints;
      const currentOLp = this.opponent.lifePoints;

      this.evaluarEstadoJuego();

      if (currentPLp < this.prevPlayerLp) {
        this.isPlayerTakingDamage = true;
        setTimeout(() => this.isPlayerTakingDamage = false, 500);
      }
      
      if (currentPLp !== this.prevPlayerLp && this.isMultiplayer) {
         this.multiplayerService.sendLPUpdate(currentPLp);
      }

      if (currentOLp < this.prevOpponentLp) {
        this.isOpponentTakingDamage = true;
        setTimeout(() => this.isOpponentTakingDamage = false, 500);
      }

      this.prevPlayerLp = currentPLp;
      this.prevOpponentLp = currentOLp;

      const phaseChanged = changes['gameState'].previousValue && changes['gameState'].previousValue.phase !== this.gameState.phase;
      const turnChanged = changes['gameState'].previousValue && changes['gameState'].previousValue.activePlayerId !== this.gameState.activePlayerId;
      
      if (turnChanged && this.gameState.activePlayerId !== null && this.gameState.phase !== 'WAITING') {
        this.triggerTurnAnimation();
      }

      if (phaseChanged && !turnChanged) {
        if (this.gameState.phase !== 'WAITING') {
            this.triggerPhaseAnimation();
        }

        // Game Loop Automation: Auto Passives
        if (this.isMyTurn && (this.gameState.phase === 'STANDBY' || this.gameState.phase === 'MAIN 1')) {
           setTimeout(() => {
              this.autoActivatePassives();
           }, 2000); // Trigger after phase animation
        }
      } else if (turnChanged && this.isMyTurn && (this.gameState.phase === 'STANDBY' || this.gameState.phase === 'MAIN 1')) {
         // Si cambió de turno y ya está en STANDBY o MAIN 1 (como inicio rápido)
         setTimeout(() => {
            this.autoActivatePassives();
         }, 2000);
      }

      // Game Loop Automation: Auto Draw
      if (this.isMyTurn && this.gameState.phase === 'DRAW' && !this.player.hasDrawnThisTurn && !this.isDrawingAutomated) {
         this.isDrawingAutomated = true;
         setTimeout(() => {
            if (!this.player.hasDrawnThisTurn) {
              this.drawCard();
              setTimeout(() => {
                 this.endPhase();
                 this.isDrawingAutomated = false;
              }, 1500);
            } else {
              this.isDrawingAutomated = false;
            }
         }, phaseChanged ? 2500 : 500);
      }

      if (!this.isMyTurn || this.gameState.phase !== 'BATTLE') {
        this.selectedAttackerIndex = null;
        this.showAttackMenu = false;
      }
    }
  }

  imageFailed: boolean = false;
  isDrawingAutomated: boolean = false;

  isPassiveAbility(card: any): boolean {
     if (!card || !card.special_ability || card.special_ability === 'None') return false;
     const ab = card.special_ability.toLowerCase();
     return ab.includes('aumenta') || ab.includes('instinto') || ab.includes('recupera') || ab.includes('roba') || ab.includes('inflige') || ab.includes('descarga');
  }

  autoActivatePassives() {
     let delay = 0;
     this.player.monsters.forEach((card: any, index: number) => {
        if (card && !card.hasUsedAbilityThisTurn && this.isPassiveAbility(card)) {
           setTimeout(() => {
              this.activateEffect(index);
           }, delay);
           delay += 2500;
        }
     });
  }

  triggerTurnAnimation() {
    this.isTurnAnimating = true;
    setTimeout(() => {
      this.isTurnAnimating = false;
      this.cdr.detectChanges();
      
      // Lanzar animación de fase inmediatamente después si acabamos de entrar en una fase al cambiar de turno (como DRAW)
      if (this.gameState.phase) {
          this.triggerPhaseAnimation();
      }
    }, 1800);
  }

  triggerPhaseAnimation() {
    this.imageFailed = false;
    this.isPhaseAnimating = true;
    setTimeout(() => {
      this.isPhaseAnimating = false;
      this.cdr.detectChanges();
    }, 1800);
  }

  getPhaseImage(phase: string): string {
    const map: any = {
      'DRAW': 'fase_robo',
      'STANDBY': 'fase_espera',
      'MAIN 1': 'fase_principal_1',
      'BATTLE': 'fase_batalla',
      'MAIN 2': 'fase_principal_2',
      'END': 'fase_fin'
    };
    return `assets/phases/${map[phase] || 'fase_robo'}.svg`;
  }

  getLpPercentage(lp: number): number { return Math.max(0, Math.min(100, (lp / 4000) * 100)); }
  getLpBgColor(lp: number): string {
    const pct = this.getLpPercentage(lp);
    if (pct > 50) return 'bg-green-500';
    if (pct > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  }
  getLpColor(lp: number): string {
    const pct = this.getLpPercentage(lp);
    if (pct > 50) return 'text-green-400';
    if (pct > 20) return 'text-yellow-400';
    return 'text-red-400';
  }

  // Abanicar cartas en la mano flotante
  getHandCardRotation(index: number, total: number): string {
    if (total <= 1) return `rotate(0deg) translateY(0px)`;
    const middle = (total - 1) / 2;
    const offset = index - middle;
    const rotation = offset * 8; // Mayor ángulo para abanico
    const translateY = Math.abs(offset) * 12; // Curva más pronunciada
    return `rotate(${rotation}deg) translateY(${translateY}px)`;
  }

  drawCard() {
    if (this.isMyTurn && this.gameState.phase === 'DRAW') {
      this.onAction.emit({ actionType: 'drawCard', payload: null });
      
      // Sincronizar el estado a la red
      if (this.isMultiplayer) {
         setTimeout(() => {
             this.syncBoardState();
         }, 50); 
      }
    }
  }

  summonCard(cardIndex: number) {
    if (this.isMyTurn && (this.gameState.phase === 'MAIN 1' || this.gameState.phase === 'MAIN 2')) {
      const card = this.player.hand[cardIndex];
      
      const isEvolution = card.level > 1 || card.pre_evolution_name || (card.stage && card.stage > 0);
      let posicionEnCampo = -1;
      
      if (card.card_category === 'trainer' || card.supertype === 'Trainer') {
         posicionEnCampo = this.player.spells.findIndex((s: any) => s === null);
         if (posicionEnCampo === -1) {
             this.gameState.log.push('[Sistema] No hay espacio en la zona de Magias/Trampas.');
             return;
         }
      } else if (isEvolution) {
         posicionEnCampo = this.player.monsters.findIndex((m: any) => m !== null && m.name === card.pre_evolution_name);
         if (posicionEnCampo === -1) {
             this.gameState.log.push(`[Sistema] Necesitas a su pre-evolución (${card.pre_evolution_name || 'Desconocido'}) en el campo para evolucionar a ${card.name || card.nombre}.`);
             return;
         }
      } else {
         posicionEnCampo = this.player.monsters.findIndex((m: any) => m === null);
         if (posicionEnCampo === -1) {
             this.gameState.log.push('[Sistema] No hay espacio en la zona de monstruos.');
             return;
         }
         if (this.player.hasSummonedThisTurn) {
             this.gameState.log.push('[Sistema] Ya invocaste un Pokémon este turno.');
             return;
         }
      }
      
      this.onAction.emit({ actionType: 'summonCard', payload: { cardIndex } });
      
      if (this.isMultiplayer) {
         setTimeout(() => {
             this.syncBoardState();
         }, 50);
      }
    }
  }

  selectAttacker(index: number) {
    if (!this.isMyTurn) return;
    const card = this.player.monsters[index];
    if (!card) return;

    if (this.gameState.phase === 'MAIN 1' || this.gameState.phase === 'MAIN 2') {
      this.selectedMonsterMenuIndex = index;
      return;
    }

    if (this.gameState.phase === 'BATTLE') {
      if (card.hasAttacked) return;
      this.selectedAttackerIndex = index;
      this.showAttackMenu = true;
    }
  }

  activateEffect(index: number) {
    this.selectedMonsterMenuIndex = null;
    const card = this.player.monsters[index];
    if (!card || card.hasUsedAbilityThisTurn) return;
    
    // Activar UI Cut-In
    this.cutInActive = true;
    this.cutInCard = card;
    this.cutInMessage = `¡${card.name} ACTIVA SU HABILIDAD!`;
    
    // El cut-in de CSS dura 2 segundos, emitimos el evento a la mitad (1.5s)
    setTimeout(() => {
      this.cutInActive = false;
      this.cutInCard = null;
      this.onAction.emit({ actionType: 'activateEffect', payload: { monsterIndex: index } });
      if (this.isMultiplayer) {
          this.syncBoardState();
      }
    }, 1500);
  }

  onSpellTrapClick(index: number) {
    const card = this.player?.spells ? this.player.spells[index] : null;
    console.log('--- CLICK DETECTADO EN ZONA TRASERA ---', card, index);
    if (!this.isMyTurn) return;
    if (this.gameState.phase === 'MAIN 1' || this.gameState.phase === 'MAIN 2') {
      this.selectedSpellMenuIndex = index;
      this.cdr.detectChanges();
    }
  }

  activateSpellTrap(index: number) {
    this.selectedSpellMenuIndex = null;
    const card = this.player.spells[index];
    if (!card) return;

    this.onAction.emit({ actionType: 'activateSpellTrap', payload: { spellIndex: index } });
    if (this.isMultiplayer) {
       this.syncBoardState();
       // Sincronizar de nuevo después de 1.6s porque app.ts manda la carta al cementerio tras 1.5s
       setTimeout(() => this.syncBoardState(), 1600);
    }
  }

  confirmAttack() {
    this.showAttackMenu = false;
    if (this.selectedAttackerIndex === null) return;
    
    if (this.hasOpponentCards()) {
      // Allow selecting defender
    } else {
      const attackerIndex = this.selectedAttackerIndex;
      this.onAction.emit({ actionType: 'attackDirectly', payload: { attackerCardIndex: attackerIndex } });
      if (this.isMultiplayer) {
         setTimeout(() => {
             this.syncBoardState();
         }, 50);
      }
      this.selectedAttackerIndex = null;
    }
  }

  cancelAttack() {
    this.showAttackMenu = false;
    this.selectedAttackerIndex = null;
  }

  hasOpponentCards(): boolean {
    if (!this.opponent || !this.opponent.monsters) return false;
    return this.opponent.monsters.some((c: any) => c !== null);
  }

  onOpponentCardClick(defenderCardIndex: number) {
    if (this.isMyTurn && this.gameState.phase === 'BATTLE' && this.selectedAttackerIndex !== null) {
      const attackerIndex = this.selectedAttackerIndex;
      this.onAction.emit({ 
        actionType: 'attackCard', 
        payload: { attackerCardIndex: attackerIndex, defenderCardIndex } 
      });
      if (this.isMultiplayer) {
         setTimeout(() => {
             this.syncBoardState();
         }, 50);
      }
      this.selectedAttackerIndex = null;
    }
  }

  attackDirectly() {
    if (this.isMyTurn && this.gameState.phase === 'BATTLE' && this.selectedAttackerIndex !== null) {
      const attackerIndex = this.selectedAttackerIndex;
      this.onAction.emit({ 
        actionType: 'attackDirectly', 
        payload: { attackerCardIndex: attackerIndex } 
      });
      if (this.isMultiplayer) {
         setTimeout(() => {
             this.syncBoardState();
         }, 50);
      }
      this.selectedAttackerIndex = null;
    }
  }

  advancePhase(fromNetwork: boolean = false) {
    if (!fromNetwork && (!this.isMyTurn || this.isPhaseAnimating)) return;
    
    // Disparar acción local (para que app.ts procese el estado)
    this.onAction.emit({ actionType: 'nextPhase', payload: null });
    
    // Disparar la animación visual de fase
    this.isPhaseAnimating = true;
    setTimeout(() => {
      this.isPhaseAnimating = false;
      this.cdr.detectChanges();
    }, 1800);

    // Si la acción la ejecutó el jugador local, emitir a la red
    if (!fromNetwork && this.isMultiplayer) {
        setTimeout(() => {
            this.syncBoardState();
        }, 50);
    }
  }

  endPhase() {
    if (this.isMyTurn) {
      let isEndingTurn = false;
      if (this.isMultiplayer) {
          if (this.gameState.phase === 'END') {
              isEndingTurn = true;
              this.multiplayerService.currentChannel?.send({ type: 'broadcast', event: 'END_TURN', payload: { senderRole: this.isHost ? 'host' : 'guest' } });
          } else {
              // Si solo cambia de fase, esperamos a que app.ts procese el advancePhase y sincronizamos el tablero
              setTimeout(() => this.syncBoardState(), 50);
          }
      }
      // Al pasar isEndingTurn como true en 'fromNetwork', evitamos que dispare el FULL_STATE_SYNC
      // pero sigue emitiendo nextPhase a app.ts para procesar localmente el cambio de turno.
      this.advancePhase(isEndingTurn);
    }
  }

  surrender() {
    this.showSurrenderModal = false;
    this.onAction.emit({ actionType: 'surrender', payload: null });
    if (this.isMultiplayer) {
       this.syncBoardState();
    }
  }
}
