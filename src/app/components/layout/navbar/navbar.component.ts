import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  template: `
    <nav class="h-16 bg-white border-b border-pink-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
          AliTask
        </h1>
      </div>
      
      <div class="flex items-center gap-4">
        @if (authService.currentUser(); as user) {
          <div class="flex items-center gap-3">
            <span class="text-sm text-pink-700/70 hidden md:block">{{ user.email }}</span>
            <div class="h-8 w-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 font-semibold border border-pink-100">
              {{ user.email?.[0]?.toUpperCase() }}
            </div>
          </div>
          
          <button 
            (click)="authService.signOut()"
            class="px-4 py-2 text-sm font-medium text-pink-700 hover:bg-pink-50 rounded-lg transition-colors border border-pink-100 shadow-sm"
          >
            Cerrar Sesión
          </button>
        }
      </div>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  authService = inject(AuthService);
}
