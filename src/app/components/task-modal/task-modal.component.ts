import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { Task, Tag, Priority } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="bg-white dark:bg-slate-900 w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl p-6 lg:p-8 relative border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-200">
      <!-- Header -->
      <div class="flex items-start justify-between mb-6">
        <div class="flex-1 mr-4">
          <input 
            type="text" 
            [(ngModel)]="task().title" 
            (blur)="updateTask({ title: task().title })"
            class="w-full text-2xl font-bold bg-transparent border-none focus:ring-2 focus:ring-blue-500 rounded px-1 transition-all"
            placeholder="Título de la tarea"
          />
          <p class="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">Creado el {{ task().createdAt | date:'medium' }}</p>
        </div>
        <button (click)="close()" class="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Description -->
          <section>
            <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              Descripción
            </h3>
            <textarea 
              [(ngModel)]="task().description" 
              (blur)="updateTask({ description: task().description })"
              class="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all resize-none shadow-inner"
              placeholder="Añade una descripción más detallada..."
            ></textarea>
          </section>

          <!-- Tags -->
          <section>
            <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Etiquetas
            </h3>
            <div class="flex flex-wrap gap-2 mb-3">
              @for (tag of task().tags; track tag.id) {
                <span 
                  [style.backgroundColor]="tag.color" 
                  class="px-3 py-1 rounded-full text-xs font-semibold text-white flex items-center shadow-sm"
                >
                  {{ tag.name }}
                  <button (click)="removeTag(tag.id)" class="ml-2 hover:text-black/50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </span>
              }
              <button 
                (click)="showTagPicker.set(!showTagPicker())"
                class="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Añadir
              </button>
            </div>

            @if (showTagPicker()) {
              <div class="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-200">
                <div class="grid grid-cols-2 gap-2 mb-4">
                  @for (tag of availableTags(); track tag.id) {
                    <button 
                      (click)="toggleTag(tag)"
                      class="text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between"
                      [class.bg-blue-50]="isTagSelected(tag.id)"
                    >
                      <span class="flex items-center">
                        <span [style.backgroundColor]="tag.color" class="w-3 h-3 rounded-full mr-2"></span>
                        {{ tag.name }}
                      </span>
                      @if (isTagSelected(tag.id)) {
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      }
                    </button>
                  }
                </div>
                <div class="flex gap-2 border-t pt-3 dark:border-slate-700">
                  <input #newTagName type="text" placeholder="Nueva etiqueta" class="flex-1 text-sm bg-slate-50 dark:bg-slate-900 border-none rounded-lg focus:ring-1 focus:ring-blue-500">
                  <button (click)="createNewTag(newTagName.value); newTagName.value=''" class="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">Crear</button>
                </div>
              </div>
            }
          </section>

          <!-- Comments -->
          <section>
            <h3 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Comentarios
            </h3>
            
            <div class="space-y-4 mb-6">
              @for (comment of task().comments; track comment.id) {
                <div class="flex gap-3">
                  <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs shrink-0">
                    {{ (comment.userName || 'U')[0].toUpperCase() }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-bold dark:text-white">{{ comment.userName || 'Usuario' }}</span>
                      <span class="text-xs text-slate-500">{{ comment.createdAt | date:'short' }}</span>
                    </div>
                    <div class="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl rounded-tl-none text-sm dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700">
                      {{ comment.content }}
                    </div>
                  </div>
                </div>
              }
            </div>

            <div class="flex gap-3">
              <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0"></div>
              <div class="flex-1 relative">
                <textarea 
                  [(ngModel)]="newComment" 
                  (keydown.enter)="$event.preventDefault(); addComment()"
                  class="w-full p-3 pr-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all resize-none text-sm"
                  placeholder="Escribe un comentario..."
                  rows="1"
                ></textarea>
                <button 
                  (click)="addComment()"
                  [disabled]="!newComment.trim()"
                  class="absolute right-2 top-1.5 p-1.5 text-blue-600 disabled:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 rotate-90" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </section>
        </div>

        <!-- Sidebar Properties -->
        <div class="space-y-6">
          <section>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Prioridad</label>
            <div class="grid grid-cols-2 gap-2">
              @for (p of priorities; track p) {
                <button 
                  (click)="updateTask({ priority: p })"
                  class="px-3 py-2 rounded-lg text-xs font-bold capitalize transition-all border-2"
                  [class.bg-white]="task().priority !== p"
                  [class]="getPriorityClass(p, task().priority === p)"
                >
                  {{ p }}
                </button>
              }
            </div>
          </section>

          <section>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Fecha de vencimiento</label>
            <input 
              type="date" 
              [ngModel]="formatDate(task().dueDate)" 
              (ngModelChange)="onDateChange($event)"
              class="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
            />
          </section>

          <section>
            <label class="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Responsable</label>
            <div class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
              <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
              </div>
              <span class="text-xs font-medium text-slate-500 italic">Sin asignar</span>
            </div>
          </section>

          <div class="pt-6 border-t dark:border-slate-800">
            <button 
              (click)="deleteTask()"
              class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl text-sm font-bold transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar tarea
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    input:focus, textarea:focus {
      outline: none;
    }
  `]
})
export class TaskModalComponent implements OnInit {
  private dialogRef = inject(DialogRef<void>);
  private data = inject(DIALOG_DATA) as { task: Task };
  private taskService = inject(TaskService);

  task = signal<Task>({ ...this.data.task });
  priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
  
  availableTags = signal<Tag[]>([]);
  showTagPicker = signal(false);
  newComment = '';

  ngOnInit() {
    this.loadTags();
  }

  async loadTags() {
    const tags = await this.taskService.getAllTags();
    this.availableTags.set(tags);
  }

  close() {
    this.dialogRef.close();
  }

  async updateTask(updates: Partial<Task>) {
    await this.taskService.updateTask(this.task().id, updates);
    this.task.update(t => ({ ...t, ...updates }));
  }

  async deleteTask() {
    if (confirm('¿Estás seguro de que quieres eliminar esta tarea?')) {
      await this.taskService.deleteTask(this.task().id);
      this.close();
    }
  }

  formatDate(timestamp?: number): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  }

  onDateChange(value: string) {
    const timestamp = value ? new Date(value).getTime() : undefined;
    this.updateTask({ dueDate: timestamp });
  }

  getPriorityClass(p: Priority, isActive: boolean): string {
    if (!isActive) return 'border-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800';
    
    switch (p) {
      case 'low': return 'border-blue-500 bg-blue-50 text-blue-700';
      case 'medium': return 'border-green-500 bg-green-50 text-green-700';
      case 'high': return 'border-yellow-500 bg-yellow-50 text-yellow-700';
      case 'urgent': return 'border-red-500 bg-red-50 text-red-700';
    }
  }

  isTagSelected(tagId: string): boolean {
    return !!this.task().tags?.find(t => t.id === tagId);
  }

  async toggleTag(tag: Tag) {
    if (this.isTagSelected(tag.id)) {
      await this.removeTag(tag.id);
    } else {
      await this.taskService.addTagToTask(this.task().id, tag.id);
      this.task.update(t => ({
        ...t,
        tags: [...(t.tags || []), tag]
      }));
    }
  }

  async removeTag(tagId: string) {
    await this.taskService.removeTagFromTask(this.task().id, tagId);
    this.task.update(t => ({
      ...t,
      tags: t.tags?.filter(tg => tg.id !== tagId)
    }));
  }

  async createNewTag(name: string) {
    if (!name.trim()) return;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newTag = await this.taskService.createTag(name, randomColor);
    this.availableTags.update(tags => [...tags, newTag]);
    this.toggleTag(newTag);
  }

  async addComment() {
    if (!this.newComment.trim()) return;
    // Assuming we can get user name from auth or just use "Yo" for now
    await this.taskService.addComment(this.task().id, this.newComment, 'Usuario Actual');
    
    // Refresh task to show new comment (signal update in service handles it, but we need to update local signal)
    const updatedTask = this.taskService.tasks().find(t => t.id === this.task().id);
    if (updatedTask) {
      this.task.set({ ...updatedTask });
    }
    
    this.newComment = '';
  }
}
