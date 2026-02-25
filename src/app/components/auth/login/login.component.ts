import { Component, inject, ChangeDetectionStrategy, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 font-display">
            {{ isLoginMode() ? '¡Bienvenido de nuevo!' : 'Crea tu cuenta' }}
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            {{ isLoginMode() ? 'Inicia sesión para gestionar tus tableros' : 'Empieza a organizar tus tareas de forma profesional' }}
          </p>
        </div>
        
        @if (successMessage()) {
          <div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {{ successMessage() }}
          </div>
        }

        <form class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="rounded-md shadow-sm space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                id="email" 
                type="email" 
                formControlName="email"
                required 
                class="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                placeholder="tu@email.com"
                [class.border-red-300]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched"
              >
              @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                <p class="mt-1 text-xs text-red-500">Introduce un email válido</p>
              }
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                id="password" 
                type="password" 
                formControlName="password"
                required 
                class="appearance-none relative block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
                placeholder="••••••••"
                [class.border-red-300]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched"
              >
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <p class="mt-1 text-xs text-red-500">
                  @if (loginForm.get('password')?.errors?.['required']) { La contraseña es obligatoria }
                  @if (loginForm.get('password')?.errors?.['minlength']) { Mínimo 6 caracteres }
                </p>
              }
            </div>
          </div>

          @if (error()) {
            <div class="bg-red-50 border border-red-100 text-red-600 px-4 py-2 rounded-lg text-xs italic">
              {{ error() }}
            </div>
          }

          <div>
            <button 
              type="submit" 
              [disabled]="loading() || loginForm.invalid"
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none"
            >
              @if (loading()) {
                <span class="flex items-center gap-2">
                  <i class="fas fa-circle-notch animate-spin"></i>
                  Procesando...
                </span>
              } @else {
                <span>{{ isLoginMode() ? 'Iniciar Sesión' : 'Crear Cuenta' }}</span>
              }
            </button>
          </div>

          <div class="text-center">
            <button 
              type="button"
              (click)="toggleMode()"
              class="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              {{ isLoginMode() ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoginMode = signal(true);
  loading = signal(false);
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  toggleMode() {
    this.isLoginMode.update(v => !v);
    this.error.set(null);
    this.successMessage.set(null);
  }

  async onSubmit() {
    if (this.loginForm.invalid) return;
    
    this.loading.set(true);
    this.error.set(null);
    this.successMessage.set(null);
    
    try {
      const { email, password } = this.loginForm.getRawValue();
      
      if (this.isLoginMode()) {
        await this.authService.signIn(email!, password!);
        this.router.navigate(['/']);
      } else {
        await this.authService.signUp(email!, password!);
        this.successMessage.set('Cuenta creada. Por favor, verifica tu email para confirmar.');
      }
    } catch (err: any) {
      console.error('Registration/Login error:', err);
      if (err?.message) {
        this.error.set(err.message);
      } else {
        this.error.set('Ocurrió un error inesperado');
      }
    } finally {
      this.loading.set(false);
    }
  }
}
