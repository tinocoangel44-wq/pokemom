import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-neutral-950 p-8 flex flex-col items-center">
      <div class="w-full max-w-5xl">
        <div class="flex justify-between items-center mb-10">
          <h1 class="text-5xl font-black text-white tracking-tight">Historial de Partidas</h1>
          <button (click)="onClose.emit()" 
                  class="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm border border-white/10 transition-colors font-bold">
            Volver al Portal
          </button>
        </div>

        <div class="bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          <div *ngIf="isLoading" class="p-12 text-center text-gray-400 font-bold animate-pulse">
            Cargando historial...
          </div>
          
          <div *ngIf="!isLoading && history.length === 0" class="p-12 text-center text-gray-500 text-lg">
            Aún no has jugado ninguna partida.
          </div>

          <table *ngIf="!isLoading && history.length > 0" class="w-full text-left text-sm text-gray-300">
            <thead class="bg-white/5 text-xs uppercase text-gray-400 font-bold border-b border-white/10">
              <tr>
                <th scope="col" class="px-6 py-4">Fecha</th>
                <th scope="col" class="px-6 py-4">Rival</th>
                <th scope="col" class="px-6 py-4">Resultado</th>
                <th scope="col" class="px-6 py-4 text-center">Duración (Turnos)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr *ngFor="let match of history" class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-4 font-medium">{{ match.fecha | date:'short' }}</td>
                <td class="px-6 py-4">{{ match.rival }}</td>
                <td class="px-6 py-4 font-black tracking-wider" 
                    [ngClass]="{'text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.8)]': match.resultado === 'Victoria', 
                                'text-red-500': match.resultado === 'Derrota'}">
                  {{ match.resultado }}
                </td>
                <td class="px-6 py-4 text-center font-mono">{{ match.duracion_turnos }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class HistoryComponent implements OnInit {
  @Output() onClose = new EventEmitter<void>();
  history: any[] = [];
  isLoading = true;

  constructor(private auth: SupabaseAuthService) {}

  async ngOnInit() {
    try {
      const user = this.auth.getCurrentUser();
      if (!user) return;
      
      const { data, error } = await this.auth.supabase
        .from('match_history')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha', { ascending: false });
        
      if (error && error.code !== '42P01') {
        console.error('Error fetching history', error);
      } else if (data) {
        this.history = data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.isLoading = false;
    }
  }
}
