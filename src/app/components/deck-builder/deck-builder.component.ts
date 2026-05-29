import { Component, OnInit, Output, EventEmitter, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokemonCardComponent, Card } from '../pokemon-card/pokemon-card.component';
import sqliteClient from '../../../lib/sqliteClient';
import { supabase } from '../../../lib/supabaseClient';

@Component({
  selector: 'app-deck-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, PokemonCardComponent],
  template: `
    <style>
      @keyframes zoomIn {
        from { transform: scale(0.9); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .animate-zoomIn { animation: zoomIn 0.2s ease-out forwards; }
      .custom-scrollbar::-webkit-scrollbar { width: 8px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #475569; border-radius: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background-color: transparent; }
      
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px) rotate(-1deg); }
        50% { transform: translateX(4px) rotate(1deg); }
        75% { transform: translateX(-4px) rotate(-1deg); }
      }
      .animate-shake { animation: shake 0.3s ease-in-out; }
    </style>

    <div class="min-h-screen bg-slate-950 relative overflow-hidden font-sans p-4 md:p-8">
      <!-- Fondo SVG de Pokébolas -->
      <div class="absolute inset-0 z-0 opacity-10 pointer-events-none" style="background-image: url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23000000\\' fill-opacity=\\'1\\'%3E%3Cpath d=\\'M30 35c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3zM15 30H0v-2h15c0-4.42 2.69-8.21 6.57-10.12l.86 1.8A12.96 12.96 0 0 0 17 30h-2zm30 0h15v-2H45a12.96 12.96 0 0 0-5.43-10.32l.86-1.8C44.31 19.79 47 23.58 47 30h-2zM30 15c-4.42 0-8.21 2.69-10.12 6.57l-1.8-.86A14.94 14.94 0 0 1 30 13a14.94 14.94 0 0 1 11.92 7.71l-1.8.86A12.96 12.96 0 0 0 30 15zm0 30a12.96 12.96 0 0 0 10.12-5.43l1.8.86A14.94 14.94 0 0 1 30 47a14.94 14.94 0 0 1-11.92-6.57l1.8-.86A12.96 12.96 0 0 0 30 45z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');"></div>
      
      <div class="relative z-10 max-w-7xl mx-auto h-full flex flex-col">
        
        <!-- Header -->
        <header class="mb-6 flex justify-between items-center bg-slate-900 border-4 border-slate-900 p-4 rounded-xl shadow-[8px_8px_0_0_#0f172a]">
          <h1 class="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
            <ng-container *ngIf="!isCollectionMode">
              <span class="text-yellow-400 text-4xl">🛠️</span> Constructor de Mazos
            </ng-container>
            <ng-container *ngIf="isCollectionMode">
              <span class="text-yellow-400 text-4xl"><i class="fa-solid fa-layer-group"></i></span> Colección Completa
            </ng-container>
          </h1>
          <div class="flex gap-4">
            <button (click)="goBack()" class="bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-6 rounded-lg border-2 border-white transition-colors">
              VOLVER AL PORTAL
            </button>
          </div>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 h-[80vh]">
          
          <!-- Catálogo de Cartas (Ocupa 2/3 en DeckBuilder, 3/3 en Colección) -->
          <div [ngClass]="isCollectionMode ? 'lg:col-span-3' : 'lg:col-span-2'" class="bg-white border-4 border-slate-900 rounded-2xl p-6 shadow-[8px_8px_0_0_#0f172a] flex flex-col h-full">
            
            <div *ngIf="extractionError" class="bg-orange-500 border-2 border-orange-900 p-3 rounded-lg text-sm text-white font-bold mb-4 shadow-inner text-center w-full">
              ❌ Error PokeAPI: {{ extractionError }}
            </div>
            
            <!-- Buscador y Filtros (Sticky) -->
            <div class="sticky top-0 z-20 bg-white/90 backdrop-blur-md p-4 border-b-4 border-slate-900 rounded-t-xl flex flex-wrap gap-4 mb-4 shadow-sm">
              <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="currentPage = 1" placeholder="Buscar por nombre..." 
                     class="flex-1 min-w-[200px] bg-gray-100 border-2 border-slate-400 focus:border-blue-500 focus:bg-white rounded-lg p-3 font-bold text-slate-800 outline-none transition-colors" />
              
              <select [(ngModel)]="filterCategory" (ngModelChange)="currentPage = 1" class="bg-gray-100 border-2 border-slate-400 rounded-lg p-3 font-bold text-slate-800 outline-none">
                <option value="all">Todos los Tipos / Categorías</option>
                <option value="pokemon">Pokémon (Todos)</option>
                <option value="fire">Fuego</option>
                <option value="water">Agua</option>
                <option value="grass">Planta</option>
                <option value="electric">Eléctrico</option>
                <option value="normal">Normal</option>
                <option value="fighting">Lucha</option>
                <option value="psychic">Psíquico</option>
                <option value="ghost">Fantasma / Siniestro</option>
                <option value="dragon">Dragón</option>
                <option value="trainer">Magias / Trampas (Partidarios)</option>
              </select>
            </div>

            <!-- Grid de Cartas Paginado -->
            <div class="grid grid-cols-4 gap-10 overflow-y-auto custom-scrollbar flex-1 p-6 relative">
              
              <!-- Cargando -->
              <div *ngIf="isLoading" class="absolute inset-0 z-30 bg-white/50 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <span class="text-blue-900 font-bold tracking-widest uppercase">Cargando colección...</span>
              </div>

              <div *ngIf="!isLoading && paginatedCards.length === 0" class="col-span-full text-center text-gray-500 font-bold p-8 border-4 border-dashed border-gray-300 rounded-xl">
                <h3 class="text-xl mb-2">No se encontraron cartas</h3>
              </div>
              <div *ngFor="let card of paginatedCards" class="flex justify-center items-start h-auto">
                <div class="relative w-[140px] h-[240px] transition-transform hover:scale-110 cursor-pointer" (click)="addCardToDeck(card)">
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center scale-[0.85] pointer-events-none">
                    <app-pokemon-card 
                      [card]="card" 
                      size="normal"
                      class="drop-shadow-md"
                    ></app-pokemon-card>
                  </div>
                </div>
              </div>
            </div>

            <!-- Paginación -->
            <div *ngIf="totalPages > 1" class="border-t-4 border-slate-900 p-4 bg-slate-100 rounded-b-xl flex justify-between items-center">
              <button (click)="currentPage = currentPage - 1" [disabled]="currentPage === 1" class="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded shadow">
                Anterior
              </button>
              <span class="font-black text-slate-700">Página {{ currentPage }} de {{ totalPages }} ({{ filteredCards().length }} cartas)</span>
              <button (click)="currentPage = currentPage + 1" [disabled]="currentPage >= totalPages" class="bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white font-bold py-2 px-4 rounded shadow">
                Siguiente
              </button>
            </div>
          </div>

          <!-- Mazo del Usuario (Ocupa 1/3) - Oculto en modo colección -->
          <div *ngIf="!isCollectionMode" class="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl flex flex-col h-full text-white relative">
            
            <h2 class="text-2xl font-black text-yellow-400 mb-4 border-b-2 border-slate-700 pb-2">TU MAZO</h2>

            <!-- Indicadores de Reglas (HUD) -->
            <div class="grid grid-cols-2 gap-2 mb-4 text-center">
              <div class="bg-slate-700 rounded-lg p-2 border transition-colors"
                   [ngClass]="currentDeck.length === MAX_DECK_SIZE ? 'border-green-500 bg-green-900/50' : 'border-slate-600'">
                <span class="block text-[10px] text-gray-400 font-bold uppercase">Cartas</span>
                <span class="font-black text-lg" [ngClass]="currentDeck.length > MAX_DECK_SIZE ? 'text-red-400' : 'text-white'">
                  {{ currentDeck.length }} / {{ MAX_DECK_SIZE }}
                </span>
              </div>
              
              <div class="bg-slate-700 rounded-lg p-2 border border-slate-600 transition-colors">
                <span class="block text-[10px] text-gray-400 font-bold uppercase">Hechizos en Mazo</span>
                <span class="font-black text-lg text-white">
                  {{ getTrainerCount() }}
                </span>
              </div>
            </div>

            <!-- Alerta de Error -->
            <div *ngIf="deckError" class="bg-red-500 border-2 border-red-900 p-3 rounded-lg text-sm text-white font-bold animate-shake mb-4 shadow-inner">
              ⚠️ {{ deckError }}
            </div>

            <!-- Mazo Visual -->
            <div class="grid grid-cols-2 gap-x-2 gap-y-3 content-start p-4 overflow-y-auto custom-scrollbar flex-1 bg-black/40 rounded-lg border border-white/20 h-[30vh]">
              <div *ngIf="currentDeck.length === 0" class="col-span-2 text-center text-slate-400 font-bold text-sm mt-4 p-4 border-2 border-dashed border-white/20 rounded-lg">
                El mazo está vacío. Haz clic en las cartas del catálogo para agregarlas.
              </div>
              
              <div *ngFor="let card of currentDeck; let i = index" class="relative group animate-zoomIn flex justify-center items-start h-auto">
                <div class="relative w-[100px] h-[145px] transform origin-top hover:scale-105 transition-transform w-full flex justify-center pb-2">
                  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-center scale-[0.5] pointer-events-none shadow-lg">
                    <app-pokemon-card [card]="card" size="normal"></app-pokemon-card>
                  </div>
                </div>
                <button (click)="removeCardFromDeck(i)" 
                        class="absolute top-0 right-0 bg-red-600 hover:bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-xl border-2 border-white opacity-0 group-hover:opacity-100 hover:rotate-90 transition-all z-20 cursor-pointer transform translate-x-2 -translate-y-2">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>

            <!-- Botón Guardar Mazo -->
            <button 
              [disabled]="!isValidDeck()"
              (click)="saveDeck()"
              class="mt-4 w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest flex justify-center items-center gap-2 transition-all border-4 shadow-[4px_4px_0_0_#0f172a]"
              [ngClass]="isValidDeck() ? 'bg-yellow-400 hover:bg-yellow-300 text-slate-900 border-slate-900 active:translate-y-1 active:shadow-none' : 'bg-gray-600 text-gray-400 border-gray-700 opacity-50 cursor-not-allowed shadow-none'">
              {{ isValidDeck() ? 'Guardar Mazo y Volver' : 'Mazo Incompleto' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DeckBuilderComponent implements OnInit {
  @Input() isCollectionMode = false;
  @Output() onClose = new EventEmitter<void>();

  // Filtros
  searchQuery: string = '';
  filterCategory: string = 'all';
  currentPage = 1;
  itemsPerPage = 50;

  // Variables de estado del mazo
  catalogCards: any[] = [];
  currentDeck: any[] = [];

  isExtracting = false;
  extractionProgress = '';
  isLoading = false;
  extractionError = '';

  readonly MAX_DECK_SIZE = 20;
  readonly MAX_COPIES_NORMAL = 2;

  // Objeto para mostrar errores en la UI
  deckError: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    this.isLoading = true;
    try {
      // Intenta cargar desde SQLite primero
      this.catalogCards = sqliteClient.getCachedCards();
      
      // Si tenemos menos de 1000 cartas, significa que no hemos hecho la sincronización masiva con PokéAPI
      if (this.catalogCards.length < 1000) {
        console.log('Iniciando extracción automática de PokéAPI (1500+)...');
        await this.runMassiveExtraction();
      }

    } catch(e) {
      console.error('Error al inicializar la colección:', e);
    }

    try {
      const saved = sqliteClient.queryAll('SELECT card_ids FROM local_decks WHERE deck_id = ? ORDER BY id DESC LIMIT 1', ['default']);
      if (saved && saved.length > 0) {
        const ids = JSON.parse(saved[0].card_ids);
        this.currentDeck = ids.map((id: number) => this.catalogCards.find(c => c.pokemon_id === id)).filter((c: any) => c);
      }
    } catch(e) {
      console.error('Error al cargar mazo guardado:', e);
    }
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  async runMassiveExtraction() {
    this.isExtracting = true;
    // this.extractionProgress is handled internally but we can just let it run silently since it's automatic
    try {
      const query = `
        query {
          pokemon_v2_pokemon(limit: 1500) {
            id
            name
            pokemon_v2_pokemonstats {
              base_stat
              pokemon_v2_stat { name }
            }
            pokemon_v2_pokemontypes {
              pokemon_v2_type { name }
            }
            pokemon_v2_pokemonspecy {
              evolves_from_species_id
              pokemon_v2_pokemonspecy {
                name
              }
            }
          }
        }
      `;
      const response = await fetch('https://beta.pokeapi.co/graphql/v1beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      const rawPokemons = data.data.pokemon_v2_pokemon;
      
      const newCards = rawPokemons.map((p: any) => {
        let hp = 0, atk = 0, def = 0;
        p.pokemon_v2_pokemonstats.forEach((s: any) => {
          if (s.pokemon_v2_stat.name === 'hp') hp = s.base_stat * 10;
          if (s.pokemon_v2_stat.name === 'attack') atk = s.base_stat * 10;
          if (s.pokemon_v2_stat.name === 'defense') def = s.base_stat * 10;
        });
        const typePrimary = p.pokemon_v2_pokemontypes[0]?.pokemon_v2_type?.name || 'normal';
        const typeSecondary = p.pokemon_v2_pokemontypes[1]?.pokemon_v2_type?.name || null;
        
        let pre_evolution_name = null;
        if (p.pokemon_v2_pokemonspecy?.pokemon_v2_pokemonspecy?.name) {
           pre_evolution_name = p.pokemon_v2_pokemonspecy.pokemon_v2_pokemonspecy.name;
           pre_evolution_name = pre_evolution_name.charAt(0).toUpperCase() + pre_evolution_name.slice(1);
        }
        
        return {
          pokemon_id: p.id,
          name: p.name.charAt(0).toUpperCase() + p.name.slice(1),
          image_url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
          type_primary: typePrimary,
          type_secondary: typeSecondary,
          attack_points: atk,
          defense_points: def,
          hp_points: hp,
          special_ability: 'Ataque Básico',
          special_ability_description: 'Ataca al rival en combate.',
          rarity: 'Common',
          level: 1, // Default, calculated in pass 2
          pre_evolution_name: pre_evolution_name,
          card_category: 'pokemon',
          rawData: null
        };
      });

      // Segunda pasada: Calcular niveles reales basados en pre_evolution_name
      newCards.forEach((c: any) => {
        if (c.pre_evolution_name) {
           const pre = newCards.find((x: any) => x.name === c.pre_evolution_name);
           if (pre && pre.pre_evolution_name) {
              c.level = 3;
           } else {
              c.level = 2;
           }
        }
      });

      sqliteClient.cacheCards(newCards);
      await sqliteClient.insertTrainerCards();
      
      this.catalogCards = sqliteClient.getCachedCards();
    } catch (e: any) {
      console.error('Falló la sincronización con PokéAPI:', e);
      this.extractionError = e.message || 'Error desconocido';
    }
    this.isExtracting = false;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  // Helper para filtrar cartas en el catálogo
  filteredCards(): any[] {
    return this.catalogCards.filter(card => {
      const matchesSearch = card.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (this.filterCategory === 'trainer') {
        matchesCategory = card.card_category === 'trainer';
      } else if (this.filterCategory === 'pokemon') {
        matchesCategory = card.card_category === 'pokemon';
      } else if (this.filterCategory !== 'all') {
        matchesCategory = card.card_category === 'pokemon' && (card.type_primary === this.filterCategory || card.type_secondary === this.filterCategory);
      }
      
      return matchesSearch && matchesCategory;
    });
  }

  get paginatedCards(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredCards().slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCards().length / this.itemsPerPage));
  }

  // Método runMassiveExtraction original y validado mantenido arriba.

  getTrainerCount(): number {
    return this.currentDeck.filter(c => c.card_category === 'trainer').length;
  }

  saveDeck() {
    if (this.isValidDeck()) {
      try {
        const cardIds = this.currentDeck.map(c => c.pokemon_id);
        
        // 1. Limpieza y Sobrescritura
        // Eliminamos el registro previo para evitar duplicados, ya que no hay constraint UNIQUE en deck_id
        sqliteClient.execute('DELETE FROM local_decks WHERE deck_id = ?', ['default']);
        
        // Insertamos el nuevo mazo
        sqliteClient.execute(
          'INSERT INTO local_decks (deck_id, name, card_ids, is_active) VALUES (?, ?, ?, ?)',
          ['default', 'Mi Mazo Principal', JSON.stringify(cardIds), 1]
        );
        
        // Forzamos explícitamente el guardado físico en localStorage
        sqliteClient.saveDatabase();
        
        // 2. Sincronización Inmediata con el Estado de la Aplicación
        // Despachamos un evento global para que cualquier servicio o componente que escuche actualice su estado
        window.dispatchEvent(new CustomEvent('deckUpdated', { detail: this.currentDeck }));
        
        alert('¡Mazo guardado con éxito!');
        this.goBack();
      } catch(e) {
        console.error('Error guardando mazo:', e);
        this.deckError = 'Hubo un error al guardar tu mazo en la base de datos.';
      }
    }
  }

  goBack() {
    this.onClose.emit();
  }

  // Función principal para  // Agregar carta al mazo (solo si no estamos en modo colección)
  addCardToDeck(card: any) {
    if (this.isCollectionMode) return;
    
    if (this.currentDeck.length >= this.MAX_DECK_SIZE) {
      this.deckError = 'El mazo ya tiene 20 cartas. Debes quitar una para agregar otra.';
      return;
    }

    // Regla 2: Límite de Copias (Máximo 2 copias de la misma carta)
    const copyCount = this.currentDeck.filter(c => c.pokemon_id === card.pokemon_id).length;
    if (copyCount >= this.MAX_COPIES_NORMAL) {
      this.deckError = `Límite alcanzado: Solo puedes tener ${this.MAX_COPIES_NORMAL} copias de ${card.name}.`;
      return;
    }

    // Si pasa todas las validaciones, se agrega
    this.currentDeck.push(card);
  }

  // Función para quitar cartas
  removeCardFromDeck(index: number) {
    this.currentDeck.splice(index, 1);
    this.deckError = null; // Limpiar errores al quitar cartas
  }

  // Validación final antes de guardar
  isValidDeck(): boolean {
    return this.currentDeck.length === this.MAX_DECK_SIZE;
  }
}
