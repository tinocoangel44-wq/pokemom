import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';

@Component({
  selector: 'app-auth-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Tarjeta de Entrenador (Contenedor del Formulario) -->
    <div class="w-full bg-white border-4 border-slate-800 rounded-2xl shadow-[8px_8px_0_0_rgba(30,41,59,1)] overflow-hidden font-sans">
      
      <!-- Header Rojo -->
      <div class="bg-red-500 border-b-4 border-slate-800 p-5 flex items-center gap-3">
        <!-- Pokéball Decorativa -->
        <div class="w-8 h-8 rounded-full border-2 border-slate-800 bg-white relative overflow-hidden flex items-center justify-center">
          <div class="absolute top-0 w-full h-1/2 bg-red-500 border-b-2 border-slate-800"></div>
          <div class="w-3 h-3 rounded-full border-2 border-slate-800 bg-white z-10"></div>
        </div>
        <h2 class="text-white font-black text-2xl tracking-wide uppercase">INGRESO COMO ENTRENADOR</h2>
      </div>

      <!-- Cuerpo del Formulario -->
      <div class="p-6 flex flex-col items-center">
        <p class="text-slate-500 font-bold mb-6 text-center text-sm uppercase tracking-wider w-full">
          {{ isLogin ? 'Identifícate para entrar' : 'Regístrate en la Liga' }}
        </p>

        <!-- Mensajes de Alerta -->
        <div *ngIf="authErrorMessage" class="mb-4 p-2 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm font-bold w-full">
          {{ authErrorMessage }}
        </div>
        <div *ngIf="authSuccessMessage" class="mb-4 p-2 bg-green-100 border-l-4 border-green-500 text-green-700 text-sm font-bold w-full">
          {{ authSuccessMessage }}
        </div>

        <form (submit)="onSubmit($event)" class="flex flex-col gap-4 w-full">
          
          <!-- Campo de Email (Común) -->
          <div class="w-full">
            <label class="block text-slate-700 font-black mb-1 text-sm uppercase">Email ID</label>
            <input type="email" placeholder="ash@kanto.com" [(ngModel)]="email" name="email" required
                   class="bg-gray-100 focus:bg-white focus:ring-0 focus:border-blue-500 border-2 border-slate-400 rounded-lg p-3 w-full font-bold text-slate-800 outline-none transition-colors" />
          </div>

          <!-- Campos Extra para Registro -->
          <ng-container *ngIf="!isLogin">
            <div class="w-full">
              <label class="block text-slate-700 font-black mb-1 text-sm uppercase">Nombre de Entrenador</label>
              <input type="text" placeholder="Ej. Red" [(ngModel)]="username" name="username"
                     class="bg-gray-100 focus:bg-white focus:ring-0 focus:border-blue-500 border-2 border-slate-400 rounded-lg p-3 w-full font-bold text-slate-800 outline-none transition-colors" />
            </div>
          </ng-container>

          <!-- Campo de Contraseña -->
          <div class="w-full">
            <label class="block text-slate-700 font-black mb-1 text-sm uppercase">Password</label>
            <input type="password" placeholder="••••••••" [(ngModel)]="password" name="password" required
                   class="bg-gray-100 focus:bg-white focus:ring-0 focus:border-blue-500 border-2 border-slate-400 rounded-lg p-3 w-full font-bold text-slate-800 outline-none transition-colors" />
          </div>

          <!-- Campo Confirmar Contraseña (Registro) -->
          <ng-container *ngIf="!isLogin">
            <div class="w-full">
              <label class="block text-slate-700 font-black mb-1 text-sm uppercase">Confirmar Password</label>
              <input type="password" placeholder="••••••••" [(ngModel)]="confirmPassword" name="confirmPassword"
                     class="bg-gray-100 focus:bg-white focus:ring-0 focus:border-blue-500 border-2 border-slate-400 rounded-lg p-3 w-full font-bold text-slate-800 outline-none transition-colors" />
            </div>
          </ng-container>

          <!-- Botón Principal (Retro Brutalism) -->
          <button type="submit" [disabled]="isLoading"
                  class="mt-4 w-full bg-yellow-400 text-slate-900 font-black px-6 py-3 rounded-xl border-4 border-slate-900 shadow-[4px_4px_0_0_#0f172a] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest flex justify-center items-center gap-2">
            <span *ngIf="!isLoading">{{ isLogin ? 'Entrar al Mundo' : 'Crear Licencia' }}</span>
            <span *ngIf="isLoading" class="animate-pulse">CONECTANDO...</span>
          </button>
        </form>

        <!-- Toggle Login/Registro -->
        <div class="mt-6 text-center w-full border-t-2 border-slate-200 pt-4">
          <span class="text-slate-500 font-bold text-sm">
            {{ isLogin ? '¿No tienes licencia?' : '¿Ya tienes una licencia?' }}
          </span>
          <button (click)="toggleMode()" type="button" 
                  class="ml-2 text-blue-600 hover:text-blue-500 font-black underline uppercase text-sm">
            {{ isLogin ? 'Regístrate' : 'Inicia Sesión' }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class AuthScreenComponent {
  isLogin: boolean = true;
  isLoading: boolean = false;
  authErrorMessage: string = '';
  authSuccessMessage: string = '';

  email = '';
  password = '';
  username = '';
  confirmPassword = '';

  constructor(private authService: SupabaseAuthService, private cdr: ChangeDetectorRef) {}

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.authErrorMessage = '';
    this.authSuccessMessage = '';
    this.cdr.detectChanges();
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    this.authErrorMessage = '';
    this.authSuccessMessage = '';

    if (!this.email || !this.password) {
      this.authErrorMessage = 'Completa todos los campos obligatorios.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.isLogin && this.password !== this.confirmPassword) {
      this.authErrorMessage = 'Las contraseñas no coinciden.';
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();

    try {
      if (this.isLogin) {
        const { error } = await this.authService.signIn(this.email, this.password);
        if (error) {
          if (error.message.includes('Email not confirmed')) {
            this.authErrorMessage = '¡Alto ahí! Tu correo aún no ha sido verificado. Por favor, revisa tu bandeja de entrada.';
          } else {
            this.authErrorMessage = error.message;
          }
        }
        // Si no hay error, el evento onAuthStateChange cierra el modal automáticamente desde game-portal
      } else {
        if (!this.username) {
          this.authErrorMessage = 'El nombre de entrenador es obligatorio.';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
        const { error } = await this.authService.signUp(this.email, this.password, this.username);
        if (error) {
          this.authErrorMessage = error.message;
        } else {
          this.authSuccessMessage = '¡Registro exitoso, Entrenador! Hemos enviado un enlace de verificación a tu correo. Revisa tu bandeja de entrada para activar tu cuenta antes de iniciar sesión.';
          this.email = '';
          this.password = '';
          this.confirmPassword = '';
          this.username = '';
        }
      }
    } catch (err: any) {
      console.error('[Auth] Error:', err);
      this.authErrorMessage = err.message || 'Error al iniciar sesión. Revisa tus datos.';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
