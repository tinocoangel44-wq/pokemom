import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-match-result',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm">
      <div class="text-center animate-fade-in-up">
        <h1 *ngIf="resultData.winner === 'p1'" 
            class="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_30px_rgba(253,224,71,0.8)] animate-pulse">
          ¡VICTORIA!
        </h1>
        <h1 *ngIf="resultData.winner !== 'p1'" 
            class="text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-gray-400 to-gray-700 drop-shadow-[0_0_20px_rgba(156,163,175,0.5)]">
          DERROTA
        </h1>
        
        <div class="mt-12 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 w-96 shadow-2xl mx-auto">
          <h3 class="text-xl font-bold text-white mb-6 uppercase tracking-wider">Estadísticas de Duelo</h3>
          
          <div class="space-y-4">
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
              <span class="text-gray-400">Daño Infligido</span>
              <span class="text-2xl font-bold text-white">{{ resultData.damageDealt || 0 }}</span>
            </div>
            <div class="flex justify-between items-center border-b border-white/10 pb-2">
              <span class="text-gray-400">Cartas Jugadas</span>
              <span class="text-2xl font-bold text-white">{{ resultData.cardsPlayed || 0 }}</span>
            </div>
            <div class="flex justify-between items-center pb-2">
              <span class="text-gray-400">Turnos Sobrevividos</span>
              <span class="text-2xl font-bold text-white">{{ resultData.turns || 0 }}</span>
            </div>
          </div>
        </div>
        
        <button (click)="goToPortal()" 
                class="mt-12 px-12 py-4 bg-white text-black font-black text-xl rounded-full hover:scale-105 hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]">
          VOLVER AL PORTAL
        </button>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in-up {
      animation: fadeInUp 0.8s ease-out forwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class MatchResultComponent {
  @Input() resultData: any = { winner: 'p1', damageDealt: 0, cardsPlayed: 0, turns: 0 };
  @Output() onClose = new EventEmitter<void>();

  goToPortal() {
    this.onClose.emit();
  }
}
