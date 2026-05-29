import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
      <div class="bg-neutral-900 border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-fade-in-up">
        
        <!-- Header -->
        <div class="flex justify-between items-center p-6 border-b border-white/10 bg-black/40 rounded-t-2xl">
          <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">Códice de Reglas</h2>
          <button (click)="onClose.emit()" class="text-gray-400 hover:text-white transition-colors">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-8 overflow-y-auto space-y-6 flex-1 text-gray-300">
          
          <div class="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span class="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-sm">1</span> Fases del Turno
            </h3>
            <ul class="space-y-3 ml-4 border-l-2 border-white/10 pl-4">
              <li><strong class="text-white">DRAW Phase:</strong> El jugador activo roba 1 carta de su mazo.</li>
              <li><strong class="text-white">STANDBY Phase:</strong> Se resuelven efectos pasivos de magias continuas en el campo.</li>
              <li><strong class="text-white">MAIN Phase 1:</strong> Puedes invocar monstruos, colocar o activar cartas de magia/trampa.</li>
              <li><strong class="text-white">BATTLE Phase:</strong> Tus monstruos declaran ataques contra los monstruos oponente.</li>
              <li><strong class="text-white">MAIN Phase 2:</strong> Fase principal secundaria para colocar defensas tras combatir.</li>
              <li><strong class="text-white">END Phase:</strong> Fin del turno, limpieza de estados temporales.</li>
            </ul>
          </div>

          <div class="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span class="bg-red-500/20 text-red-400 px-2 py-1 rounded text-sm">2</span> Sistema de Daño (ATK vs DEF)
            </h3>
            <div class="space-y-4">
              <p>Durante la Battle Phase, al atacar a un monstruo, se compara el <strong class="text-red-400">ATK</strong> del atacante contra la <strong class="text-blue-400">DEF</strong> del defensor:</p>
              <ul class="list-disc ml-6 space-y-2">
                <li><strong class="text-white">ATK > DEF:</strong> El defensor es destruido. No hay daño a los LP.</li>
                <li><strong class="text-white">ATK < DEF (Rebote):</strong> Ningún monstruo es destruido. El atacante pierde LP igual a la diferencia.</li>
                <li><strong class="text-white">ATK == DEF:</strong> Empate total. Nadie muere, nadie pierde LP.</li>
                <li><strong class="text-yellow-400">Daño de Penetración:</strong> Si el atacante tiene un modificador de penetración y su ATK supera la DEF, la diferencia se resta directamente de los LP del rival.</li>
              </ul>
            </div>
          </div>

          <div class="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span class="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm">3</span> Sistema de Evolución
            </h3>
            <p>
              Los Pokémon de nivel superior (Fase 1 y Fase 2) no pueden invocarse al vacío. Debes tener a su pre-evolución exacta en el campo para jugar la carta encima de ella. (Ejemplo: Para invocar a Charmeleon, debes colocarlo sobre Charmander).
            </p>
          </div>

          <div class="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span class="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-sm">4</span> Magias y Trampas
            </h3>
            <p>
              Las cartas de Entrenador (Partidario / Objeto / Estadio) se colocan en la zona trasera del campo. Las Magias Normales requieren que les hagas clic para activarlas manualmente, mientras que los Estadios operan de forma continua durante la fase Standby.
            </p>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
  `]
})
export class RulesComponent {
  @Output() onClose = new EventEmitter<void>();
}
