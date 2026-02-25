import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { BoardService } from '../../../services/board.service';
import { AuthService } from '../../../services/auth.service';
import { Board } from '../../../models/board.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, FormsModule, CommonModule],
  template: `
    <aside class="w-64 bg-pink-50/50 border-r border-pink-100 h-[calc(100vh-64px)] overflow-y-auto hidden md:block">
      <div class="p-4">
        <h2 class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
          Navegación
        </h2>
        <nav class="space-y-1">
          @for (item of navItems(); track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-white text-pink-600 shadow-sm border-pink-100"
              class="flex items-center gap-3 px-3 py-2 text-sm font-medium text-pink-800 rounded-lg hover:bg-white hover:text-pink-500 border border-transparent transition-all"
            >
              <i [class]="item.icon"></i>
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="mt-8">
          <h2 class="text-xs font-semibold text-pink-700/60 uppercase tracking-wider mb-4 px-2 flex justify-between items-center">
            Mis Tableros
            <button 
              (click)="toggleNewBoardForm()"
              class="text-pink-300 hover:text-pink-600 transition-colors"
              title="Nuevo Tablero"
            >
              <i class="fas fa-plus-circle text-lg"></i>
            </button>
          </h2>

          @if (isCreatingBoard()) {
            <div class="px-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <input 
                type="text" 
                [(ngModel)]="newBoardName"
                (keyup.enter)="createBoard()"
                placeholder="Nombre del tablero..."
                class="w-full px-3 py-2 text-sm border border-pink-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none"
                #boardInput
              />
              <div class="flex gap-2 mt-2">
                <button 
                  (click)="createBoard()"
                  class="flex-1 bg-pink-500 text-white text-xs py-1.5 rounded hover:bg-pink-600 transition-colors"
                >
                  Confirmar
                </button>
                <button 
                  (click)="toggleNewBoardForm()"
                  class="flex-1 bg-gray-200 text-gray-600 text-xs py-1.5 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          }

          <div class="space-y-1">
            @for (board of boards(); track board.id) {
              <a
                [routerLink]="['/board', board.id]"
                routerLinkActive="bg-white text-pink-600 shadow-sm border-pink-100"
                class="flex items-center gap-3 px-3 py-2 text-sm text-pink-800 rounded-lg hover:bg-white hover:text-pink-500 transition-all border border-transparent group"
              >
                <span class="w-2 h-2 rounded-full bg-pink-400 group-hover:scale-125 transition-transform"></span>
                <span class="truncate">{{ board.name }}</span>
              </a>
            } @empty {
              <p class="text-xs text-gray-400 px-2 italic">No tienes tableros aún.</p>
            }
          </div>
        </div>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent implements OnInit {
  private boardService = inject(BoardService);
  private authService = inject(AuthService);
  private router = inject(Router);

  navItems = signal<NavItem[]>([
    { label: 'Dashboard', icon: 'fas fa-th-large', route: '/dashboard' },
    { label: 'Mis Tareas', icon: 'fas fa-tasks', route: '/tasks' },
  ]);

  boards = signal<Board[]>([]);
  isCreatingBoard = signal(false);
  newBoardName = '';

  async ngOnInit() {
    await this.loadBoards();
  }

  async loadBoards() {
    try {
      const data = await this.boardService.getUserBoards();
      this.boards.set(data);
    } catch (error) {
      console.error('Error loading boards:', error);
    }
  }

  toggleNewBoardForm() {
    this.isCreatingBoard.update(v => !v);
    this.newBoardName = '';
  }

  async createBoard() {
    const name = this.newBoardName.trim();
    const user = this.authService.currentUser();
    
    if (!name || !user) return;

    try {
      const newBoard = await this.boardService.createBoard(name, user.id);
      this.boards.update(prev => [newBoard, ...prev]);
      this.toggleNewBoardForm();
      this.router.navigate(['/board', newBoard.id]);
    } catch (error) {
      console.error('Error creating board:', error);
    }
  }
}
