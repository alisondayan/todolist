import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  template: `
    <nav class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          KanbanFlow
        </h1>
      </div>
      
      <div class="flex items-center gap-4">
        @if (authService.currentUser(); as user) {
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-600 hidden md:block">{{ user.email }}</span>
            <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold border border-indigo-200">
              {{ user.email?.[0]?.toUpperCase() }}
            </div>
          </div>
          
          <button 
            (click)="authService.signOut()"
            class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 shadow-sm"
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
