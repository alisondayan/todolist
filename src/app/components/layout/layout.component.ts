import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, NavbarComponent, SidebarComponent],
  template: `
    <div class="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <app-navbar></app-navbar>
      
      <div class="flex flex-1 overflow-hidden">
        <app-sidebar></app-sidebar>
        
        <main class="flex-1 overflow-y-auto bg-gray-50/50 p-4 md:p-8">
          <div class="max-w-7xl mx-auto">
            <router-outlet></router-outlet>
          </div>
        </main>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {}
