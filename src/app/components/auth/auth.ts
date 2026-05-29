import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseAuthService } from '../../../services/supabase-auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
})
export class Auth {
  @Output() loginSuccess = new EventEmitter<void>();

  isLoginMode = true;
  isLoading = false;
  
  email = '';
  password = '';
  
  errorMessage = '';
  successMessage = '';

  constructor(private authService: SupabaseAuthService) {}

  async onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor, completa todos los campos.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      if (this.isLoginMode) {
        // Lógica de Login
        const { data, error } = await this.authService.signIn(this.email, this.password);

        if (error) throw error;
        
        // El App component (Guard) detectará el inicio de sesión y hará la transición.
        this.loginSuccess.emit();
        
      } else {
        // Lógica de Registro (Añadimos 'Entrenador' como nombre de usuario por defecto temporalmente)
        const username = this.email.split('@')[0];
        const { data, error } = await this.authService.signUp(this.email, this.password, username);

        if (error) throw error;
        
        this.successMessage = '¡Registro exitoso! Iniciando sesión automáticamente...';
        this.loginSuccess.emit();
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Ha ocurrido un error inesperado.';
    } finally {
      this.isLoading = false;
    }
  }
}
