import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';

const SUPABASE_URL = 'https://sfdgcekmsbhwjdgsvygp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmZGdjZWttc2Jod2pkZ3N2eWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODcwOTcsImV4cCI6MjA5NDk2MzA5N30.OSQA5awfUiuljLbN-UXkD-hqlzhHAgMd2zBX2LNA7-M';

@Injectable({
  providedIn: 'root'
})
export class SupabaseAuthService {
  public supabase: SupabaseClient;
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Configurar listener para cambios de sesión
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.currentUserSubject.next(session?.user || null);
    });

    // Cargar sesión inicial
    this.loadInitialSession();
  }

  private async loadInitialSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentUserSubject.next(session?.user || null);
  }

  async signUp(email: string, password: string, username: string) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username
        }
      }
    });
  }

  async signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  async signOut() {
    return this.supabase.auth.signOut();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async saveMatchHistory(rival: string, resultado: string, duracion_turnos: number) {
    const user = this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await this.supabase.from('match_history').insert({
      user_id: user.id,
      rival,
      resultado,
      duracion_turnos
    });

    if (error) {
        console.error('Error guardando registro de batalla:', error);
    }
    return { data, error };
  }
}
