import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Card {
  name: string;
  image_url: string;
  type_primary: string;
  type_secondary?: string | null;
  attack_points: number;
  defense_points: number;
  hp_points: number;
  special_ability: string;
  special_ability_description: string;
  rarity: 'legendary' | 'rare' | 'uncommon' | 'common';
  level: number;
  card_category?: string;
  pre_evolution_name?: string;
  max_hp_points?: number;
  current_atk?: number;
  current_def?: number;
  base_hp?: number;
  hasUsedAbilityThisTurn?: boolean;
}

@Component({
  selector: 'app-pokemon-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Keyframes locales para las animaciones -->
    <style>
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-4px) rotate(-3deg); }
        50% { transform: translateX(4px) rotate(3deg); }
        75% { transform: translateX(-4px) rotate(-3deg); }
      }
      .animate-shake { animation: shake 0.3s ease-in-out infinite; }
    </style>

    <!-- Contenedor Raíz (Fondo naranja/marrón) -->
    <div
      (click)="handleClick()"
      [ngClass]="getContainerClasses()"
      class="relative flex flex-col justify-between p-1.5 rounded-sm transition-all duration-200 select-none"
    >
      <!-- MARCO INTERIOR -->
      <div class="flex-1 flex flex-col justify-between border-[3px] border-slate-800 relative bg-transparent h-auto min-h-fit">
        
        <!-- Destello Rojo temporal (isAttacking) -->
        <div *ngIf="isAttacking" class="absolute inset-0 bg-red-500/30 z-20 pointer-events-none mix-blend-color-burn"></div>

        <!-- 1. ENCABEZADO -->
        <div class="flex justify-between items-center gap-1 px-1 pt-1 z-10">
          <span class="font-serif font-bold tracking-tight text-black uppercase flex-1 min-w-0 truncate" [ngClass]="getTextClasses('name')">
            {{ card.name }}
          </span>
          <!-- Atributo (Orbe) -->
          <div class="rounded-full flex items-center justify-center shrink-0 shadow-inner border-[0.5px] border-white/60" 
               [ngClass]="getOrbSizeClass() + ' ' + getTypeColor(card.type_primary)">
               <span class="font-black text-white drop-shadow-md z-10 leading-none" [ngClass]="getTextClasses('orbText')">
                 {{ isTrainer ? 'M' : card.type_primary.charAt(0).toUpperCase() }}
               </span>
          </div>
        </div>

        <!-- 2. NIVEL (Estrellas) -->
        <div *ngIf="!isTrainer" class="flex justify-end gap-0.5 px-2 pb-1" [ngClass]="getTextClasses('stars')">
          <span *ngFor="let star of getStarsArray()" class="text-yellow-400 drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]">
            ★
          </span>
        </div>
        <div *ngIf="isTrainer" class="h-3"></div> <!-- Espaciador magias -->

        <!-- 3. CAJA DE ARTE -->
        <div class="mx-1.5 relative z-10 flex-1 flex flex-col justify-center py-1">
          <div class="border-4 border-slate-300 border-t-slate-400 border-l-slate-400 border-b-slate-500 border-r-slate-500 bg-white/90 flex items-center justify-center h-auto min-h-[80px]">
             <img [src]="card.image_url" [alt]="card.name" class="max-h-32 max-w-full object-contain z-10" />
          </div>
        </div>

        <!-- 4. CAJA DE EFECTO -->
        <div class="mx-1 mt-0.5 mb-0.5 border-[2px] border-slate-800 bg-[#fdf3d8] flex flex-col z-10"
             [ngClass]="getDescPanelHeight()">
          <!-- Línea de Tipo -->
          <div class="px-1 pt-0.5">
             <span class="font-bold italic text-slate-900" [ngClass]="getTextClasses('typeLine')">
               [ {{ isTrainer ? 'Carta Mágica / Efecto' : (card.type_primary | titlecase) + ' / Efecto' }} ]
             </span>
          </div>
          
          <!-- Descripción -->
          <div class="px-1 overflow-hidden font-serif text-slate-900 leading-none text-left" 
               [ngClass]="getTextClasses('abilityDesc')">
             <span class="font-bold">{{ getAbilityName() }}:</span> {{ getAbilityDesc() }}
          </div>

          <!-- 5. FILA DE ESTADÍSTICAS -->
          <div *ngIf="!isTrainer" class="mt-auto border-t border-slate-400 flex justify-end gap-2 px-1 py-[1px] pb-0.5 font-serif font-bold text-slate-900" [ngClass]="getTextClasses('statsRow')">
            <span [ngClass]="getStatColor('atk')">ATK/ {{ card.current_atk ?? card.attack_points }}</span>
            <span [ngClass]="getStatColor('def')">DEF/ {{ card.current_def ?? card.defense_points }}</span>
            <span [ngClass]="getStatColor('hp')">HP/ {{ card.hp_points }}</span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PokemonCardComponent {
  // 1. Props e Inputs solicitados
  @Input() card!: Card;
  @Input() size: 'small' | 'normal' | 'large' = 'normal';
  @Input() isSelected: boolean = false;
  @Input() isDisabled: boolean = false;
  @Input() isAttacking: boolean = false;
  @Input() isTapped: boolean = false;
  @Output() onClick = new EventEmitter<void>();

  get isTrainer(): boolean {
    return this.card?.card_category === 'trainer' || (this.card?.attack_points === 0 && this.card?.hp_points === 0);
  }

  getAbilityName(): string {
    if (this.isTrainer) return this.card?.special_ability || 'Efecto';
    switch (this.card?.type_primary?.toLowerCase()) {
      case 'fuego':
      case 'fire': return 'Llamarada';
      case 'agua':
      case 'water': return 'Marea Alta';
      case 'planta':
      case 'grass': return 'Regeneración';
      case 'eléctrico':
      case 'electric': return 'Descarga';
      case 'psíquico':
      case 'psychic': return 'Visión Futura';
      case 'dragón':
      case 'dragon': return 'Furia Dragón';
      case 'siniestro':
      case 'dark': return 'Maldición';
      case 'lucha':
      case 'fighting': return 'Golpe Crítico';
      default: return 'Instinto';
    }
  }

  getAbilityDesc(): string {
    if (this.isTrainer) return this.card?.special_ability_description || '';
    switch (this.card?.type_primary?.toLowerCase()) {
      case 'fuego':
      case 'fire': return 'Inflige 300 puntos de daño directo al jugador rival.';
      case 'agua':
      case 'water': return 'Recuperas 400 Life Points.';
      case 'planta':
      case 'grass': return 'Recuperas 200 LP y robas 1 carta de tu mazo.';
      case 'eléctrico':
      case 'electric': return 'Reduce en 200 el ATK de todos los monstruos rivales.';
      case 'psíquico':
      case 'psychic': return 'Robas 2 cartas de tu mazo inmediatamente.';
      case 'dragón':
      case 'dragon': return 'Si tus LP son menores a 1500, inflige 500 de daño al rival.';
      case 'siniestro':
      case 'dark': return 'Destruye 1 monstruo rival al azar.';
      case 'lucha':
      case 'fighting': return 'El ATK de esta carta se multiplica por 1.5 este turno.';
      default: return 'Aumenta en 300 la DEF de esta carta.';
    }
  }

  handleClick() {
    if (!this.isDisabled) {
      this.onClick.emit();
    }
  }

  // 2. Colores y Tamaños Dinámicos con Tailwind
  getContainerClasses(): string {
    let classes = [];

    // Tamaños exactos arbitrarios
    if (this.size === 'small') classes.push('w-[120px]', 'h-auto', 'min-h-fit');
    else if (this.size === 'large') classes.push('w-[200px]', 'h-auto', 'min-h-fit');
    else classes.push('w-[160px]', 'h-auto', 'min-h-fit'); // default: normal

    // Efecto Hover solo si la carta está interactiva
    if (!this.isDisabled) {
      classes.push('cursor-pointer', 'hover:-translate-y-4', 'hover:scale-110', 'hover:shadow-[0_0_20px_rgba(59,130,246,0.8)]', 'hover:z-50');
    }

    // Sombra proyectada dinámica
    classes.push('shadow-2xl', 'shadow-black/50');

    // Fondo Base de la Carta (Texturas y colores YGO-like o Elementales)
    classes.push(this.getCardFrameColor());

    // Estados Visuales Condicionales
    if (this.isSelected) {
      classes.push('ring-4', 'ring-cyan-400', 'z-50');
    }
    
    if (this.isDisabled) {
      classes.push('brightness-75', 'cursor-not-allowed', 'pointer-events-none');
    }

    if (this.isTapped) {
      classes.push('brightness-50', 'grayscale-[50%]'); // Reemplazamos rotate-90 por un oscurecimiento
    }

    if (this.isTapped && !this.isTrainer) {
      classes.push('scale-90');
    }

    if (this.isAttacking) {
      classes.push('animate-shake');
    }

    return classes.join(' ');
  }

  getStatColor(stat: string): string {
    if (stat === 'atk' && this.card.current_atk !== undefined && this.card.current_atk > this.card.attack_points) return 'text-green-600';
    if (stat === 'atk' && this.card.current_atk !== undefined && this.card.current_atk < this.card.attack_points) return 'text-red-600';
    if (stat === 'def' && this.card.current_def !== undefined && this.card.current_def > this.card.defense_points) return 'text-green-600';
    if (stat === 'def' && this.card.current_def !== undefined && this.card.current_def < this.card.defense_points) return 'text-red-600';
    if (stat === 'hp' && this.card.hp_points < (this.card.base_hp || this.card.hp_points)) return 'text-red-600';
    return '';
  }

  getStarsArray(): number[] {
    const numStars = this.card.level || 1;
    return Array(numStars).fill(0);
  }

  getCardFrameColor(): string {
    if (this.isTrainer) {
      return 'bg-[#158e65]'; // Verde mágico YGO para cartas Entrenador/Magias
    }

    const type = this.card.type_primary?.toLowerCase() || '';

    if (!type || type === 'normal' || type === 'ninguno') {
      return 'bg-[#c08a4f]'; // Por defecto
    }

    switch (type) {
      case 'planta':
      case 'grass':
      case 'bicho':
      case 'bug':
        return 'bg-[#1d6d1d]'; // Verde Bosque
      case 'fuego':
      case 'fire':
        return 'bg-[#b01616]'; // Rojo Carmesí
      case 'agua':
      case 'water':
      case 'hielo':
      case 'ice':
        return 'bg-[#133e8d]'; // Azul Océano
      case 'eléctrico':
      case 'electric':
      case 'electrico':
        return 'bg-[#d4a017]'; // Amarillo oscuro/Dorado
      case 'siniestro':
      case 'dark':
      case 'fantasma':
      case 'ghost':
      case 'veneno':
      case 'poison':
        return 'bg-[#6600cc]'; // Púrpura
      case 'acero':
      case 'steel':
      case 'roca':
      case 'rock':
        return 'bg-[#708090]'; // Gris/Plateado
      case 'hada':
      case 'fairy':
      case 'psíquico':
      case 'psychic':
      case 'psiquico':
        return 'bg-[#a349a4]'; // Magenta/Rosa oscuro
      case 'lucha':
      case 'fighting':
      case 'tierra':
      case 'ground':
        return 'bg-[#8b4513]'; // Marrón/Tierra
      case 'dragón':
      case 'dragon':
        return 'bg-[#b8860b]'; // Dorado oscuro/Dragón
      default:
        return 'bg-[#c08a4f]'; // Por defecto
    }
  }

  // Escala de fuentes dependiendo del contenedor
  getTextClasses(element: string): string {
    if (this.size === 'small') {
      switch (element) {
        case 'name': return 'text-xs leading-tight';
        case 'orbText': return 'text-[9px]';
        case 'stars': return 'text-[8px]';
        case 'typeLine': return 'text-[8px]';
        case 'abilityDesc': return 'text-[9px] leading-tight';
        case 'statsRow': return 'text-[9px]';
      }
    } else if (this.size === 'large') {
      switch (element) {
        case 'name': return 'text-xl';
        case 'orbText': return 'text-base';
        case 'stars': return 'text-base';
        case 'typeLine': return 'text-sm';
        case 'abilityDesc': return 'text-sm leading-snug';
        case 'statsRow': return 'text-base';
      }
    } else { // normal
      switch (element) {
        case 'name': return 'text-sm';
        case 'orbText': return 'text-[11px]';
        case 'stars': return 'text-[11px]';
        case 'typeLine': return 'text-[10px]';
        case 'abilityDesc': return 'text-xs leading-tight';
        case 'statsRow': return 'text-[10px]';
      }
    }
    return '';
  }

  getOrbSizeClass(): string {
    if (this.size === 'small') return 'w-3 h-3';
    if (this.size === 'large') return 'w-6 h-6';
    return 'w-4 h-4';
  }

  getDescPanelHeight(): string {
    if (this.size === 'small') return 'h-[35%]';
    if (this.size === 'large') return 'h-[30%]';
    return 'h-[32%]';
  }

  // Mapeo de Tipo a Color de Fondo Tailwind para el orbe elemental
  getTypeColor(type: string): string {
    const typeColorMap: Record<string, string> = {
      fire: 'bg-red-600',
      water: 'bg-blue-600',
      grass: 'bg-green-600',
      electric: 'bg-yellow-500',
      psychic: 'bg-fuchsia-600',
      dragon: 'bg-indigo-700',
      dark: 'bg-slate-800',
      steel: 'bg-gray-500',
      ghost: 'bg-purple-800',
      fighting: 'bg-orange-800',
      normal: 'bg-[#d3a65b]'
    };
    return typeColorMap[type] || 'bg-gray-500'; // default
  }
}
