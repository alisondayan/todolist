import { Injectable, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).client;
  private router = inject(Router);

  // Signal for the current user
  currentUser = signal<User | null>(null);
  initialized = signal(false);

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      this.currentUser.set(session?.user ?? null);
    } finally {
      this.initialized.set(true);
    }

    this.supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      this.currentUser.set(session?.user ?? null);
      
      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
    });
  }

  async signUp(email: string, password: string) {
    console.log('AuthService: Starting signUp for', email);
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      console.error('AuthService: signUp error:', error);
      throw error;
    }
    console.log('AuthService: signUp success:', data);
    return data;
  }

  async signIn(email: string, password: string) {
    console.log('AuthService: Starting signIn for', email);
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('AuthService: signIn error:', error);
      throw error;
    }
    console.log('AuthService: signIn success:', data);
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.router.navigate(['/login']);
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser();
  }
}
