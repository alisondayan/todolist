import { Component, OnInit, OnDestroy, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BoardService } from '../../services/board.service';
import { Board, Column } from '../../models/board.model';
import { Task } from '../../models/task.model';
import { TaskService } from '../../services/task.service';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem,
  CdkDrag,
  CdkDropList,
  DragDropModule
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, DialogModule],
  template: `
    <div class="flex flex-col h-[calc(100vh-12rem)] transition-colors duration-300">
      @if (loading()) {
        <div class="flex items-center justify-center flex-1">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      } @else if (board()) {
        <header class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-pink-900">{{ board()?.name }}</h1>
            <p class="text-pink-600/70">Gestiona el flujo de tu proyecto</p>
          </div>
          <button 
            (click)="toggleAddColumn()"
            class="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all duration-200 flex items-center gap-2 shadow-lg shadow-pink-200"
          >
            <span class="text-xl">+</span> Añadir Columna
          </button>
        </header>

        <div class="flex gap-6 overflow-x-auto pb-4 flex-1 scrollbar-thin scrollbar-thumb-pink-200" cdkDropListGroup>
          @for (column of columns(); track column.id) {
            <div class="shrink-0 w-80 bg-pink-50/50 backdrop-blur-sm rounded-xl p-4 flex flex-col max-h-full border border-pink-100">
              <div class="flex justify-between items-center mb-4">
                <h3 class="font-semibold text-pink-800 uppercase tracking-wider text-sm">{{ column.name }}</h3>
                <span class="bg-pink-100 text-pink-700 px-2 py-0.5 rounded text-xs">{{ column.tasks?.length || 0 }}</span>
              </div>
              
              <div 
                cdkDropList
                [id]="column.id"
                [cdkDropListData]="column.tasks!"
                (cdkDropListDropped)="drop($event, column.id)"
                class="flex-1 overflow-y-auto space-y-3 min-h-[100px]"
              >
                @for (task of column.tasks; track task.id) {
                  <div 
                    cdkDrag
                    (click)="openTaskModal(task)"
                    class="p-4 bg-white rounded-lg shadow-sm border border-pink-50 cursor-grab active:cursor-grabbing hover:border-pink-300 transition-colors group"
                  >
                    <div class="flex justify-between items-start mb-2">
                      <span 
                        class="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide"
                        [class.bg-red-100]="task.priority === 'urgent'"
                        [class.text-red-700]="task.priority === 'urgent'"
                        [class.bg-orange-100]="task.priority === 'high'"
                        [class.text-orange-700]="task.priority === 'high'"
                        [class.bg-blue-50]="task.priority === 'medium'"
                        [class.text-blue-700]="task.priority === 'medium'"
                        [class.bg-green-50]="task.priority === 'low'"
                        [class.text-green-700]="task.priority === 'low'"
                        [class.bg-slate-100]="!task.priority"
                        [class.text-slate-700]="!task.priority"
                      >
                        {{ task.priority || 'No Priority' }}
                      </span>
                    </div>
                    
                    <h4 class="text-slate-800 dark:text-white font-medium mb-3">{{ task.title }}</h4>
                    
                    <div class="flex justify-between items-center">
                      <div class="flex -space-x-2">
                        <div class="h-6 w-6 rounded-full bg-pink-400 flex items-center justify-center text-[10px] text-white ring-2 ring-white">
                          {{ task.assigneeId ? 'U' : '?' }}
                        </div>
                      </div>
                      
                      @if (task.dueDate) {
                        <div class="flex items-center text-xs text-pink-400">
                          <span>{{ task.dueDate | date:'MMM d' }}</span>
                        </div>
                      }
                    </div>
                  </div>
                }

                @if (addingToColumn() === column.id) {
                  <div class="p-3 bg-white rounded-lg border-2 border-pink-200 shadow-sm anim-fade-in mb-3">
                    <input 
                      #newTaskInput
                      type="text" 
                      [(ngModel)]="newTaskTitle"
                      placeholder="Título de la tarea..."
                      (keyup.enter)="addTask(column.id)"
                      (keyup.escape)="cancelAddTask()"
                      class="w-full bg-pink-50 border-none rounded px-2 py-1 text-sm mb-2 focus:ring-1 focus:ring-pink-500"
                      autofocus
                    />
                    <div class="flex gap-2">
                      <button (click)="addTask(column.id)" class="text-xs bg-pink-500 text-white px-2 py-1 rounded hover:bg-pink-600">Añadir</button>
                      <button (click)="cancelAddTask()" class="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded hover:bg-pink-200">Cancelar</button>
                    </div>
                  </div>
                }
              </div>

              @if (addingToColumn() !== column.id) {
                <button 
                  (click)="startAddTask(column.id)"
                  class="mt-4 w-full py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors text-sm font-medium"
                >
                  + Add Task
                </button>
              }
            </div>
          }

          @if (isAddingColumn()) {
            <div class="shrink-0 w-80 h-fit bg-white rounded-xl p-4 border-2 border-dashed border-pink-200 shadow-xl anim-fade-in">
              <input 
                #newColumnInput
                type="text" 
                [(ngModel)]="newColumnName"
                placeholder="Nombre de la columna..."
                (keyup.enter)="addColumn()"
                class="w-full bg-pink-50 border-none rounded-lg px-3 py-2 text-pink-900 focus:ring-2 focus:ring-pink-500 mb-3"
              />
              <div class="flex gap-2">
                <button 
                  (click)="addColumn()"
                  class="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Guardar
                </button>
                <button 
                  (click)="toggleAddColumn()"
                  class="flex-1 bg-pink-100 text-pink-700 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center flex-1">
          <p class="text-pink-400 mb-4 text-xl">Tablero no encontrado</p>
          <a href="/" class="text-pink-500 hover:underline">Volver al inicio</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .anim-fade-in {
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Drag and drop styles */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 0.5rem;
      box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2),
                  0 8px 10px 1px rgba(0, 0, 0, 0.14),
                  0 3px 14px 2px rgba(0, 0, 0, 0.12);
    }
    
    .cdk-drag-placeholder {
      opacity: 0;
    }
    
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
    
    .example-list.cdk-drop-list-dragging .example-box:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private boardService = inject(BoardService);
  private taskService = inject(TaskService);
  private dialog = inject(Dialog);

  board = signal<Board | null>(null);
  columns = signal<Column[]>([]);
  loading = signal(true);
  
  isAddingColumn = signal(false);
  newColumnName = '';

  addingToColumn = signal<string | null>(null);
  newTaskTitle = '';

  async ngOnInit() {
    const boardId = this.route.snapshot.paramMap.get('id');
    if (boardId) {
      this.boardService.subscribeToBoard(boardId);
      
      this.boardService.boardUpdates$.subscribe(event => {
        this.handleRealtimeEvent(event);
      });

      try {
        const boardData = await this.boardService.getBoardById(boardId);
        this.board.set(boardData);
        
        await this.loadBoardData(boardId);
      } catch (error) {
        console.error('Error loading board:', error);
      } finally {
        this.loading.set(false);
      }
    } else {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    this.boardService.unsubscribeFromBoard();
  }

  async loadBoardData(boardId: string) {
    const columnsData = await this.boardService.getColumns(boardId);
    const tasksData = await this.boardService.getTasks(boardId);

    // Organize tasks into columns
    const columnsWithTasks = columnsData.map(col => ({
      ...col,
      tasks: tasksData.filter(task => task.columnId === col.id).sort((a, b) => a.position - b.position)
    }));

    this.columns.set(columnsWithTasks);
  }

  handleRealtimeEvent(event: any) {
    const { type, payload } = event;
    
    if (type === 'COLUMN') {
      // Reload columns for simplicity when columns change
      if (this.board()) {
        this.loadBoardData(this.board()!.id);
      }
    } else if (type === 'TASK') {
      const { eventType, new: newTask, old: oldTask } = payload;
      
      this.columns.update(columns => {
        return columns.map(col => {
          let tasks = [...(col.tasks || [])];
          
          if (eventType === 'INSERT') {
            if (col.id === newTask.column_id) {
              const mappedTask = this.mapTaskFromPayload(newTask);
              tasks.push(mappedTask);
            }
          } else if (eventType === 'UPDATE') {
            const mappedTask = this.mapTaskFromPayload(newTask);
            
            // Remove if it moved out or update if it stayed
            if (col.id === oldTask.column_id && newTask.column_id !== col.id) {
               tasks = tasks.filter(t => t.id !== oldTask.id);
            } else if (col.id === newTask.column_id) { // In this column
               // If it was already here, update it. If it moved here, add it.
               const index = tasks.findIndex(t => t.id === newTask.id);
               if (index !== -1) {
                 tasks[index] = mappedTask;
               } else {
                 tasks.push(mappedTask);
               }
            }
          } else if (eventType === 'DELETE') {
             tasks = tasks.filter(t => t.id !== oldTask.id);
          }
          
          return { ...col, tasks: tasks.sort((a, b) => a.position - b.position) };
        });
      });
    }
  }

  private mapTaskFromPayload(t: any): Task {
    // Basic mapping for real-time payload which is raw snake_case
    return {
      id: t.id,
      columnId: t.column_id,
      title: t.title,
      description: t.description,
      completed: !!t.completed,
      dueDate: t.due_date ? new Date(t.due_date).getTime() : undefined,
      priority: t.priority,
      assigneeId: t.assignee_id,
      position: t.position || 0,
      createdAt: new Date(t.created_at).getTime(),
    };
  }

  toggleAddColumn() {
    this.isAddingColumn.update(v => !v);
    this.newColumnName = '';
  }

  async addColumn() {
    if (!this.newColumnName.trim() || !this.board()) return;

    const boardId = this.board()!.id;
    const position = this.columns().length;

    try {
      const newCol = await this.boardService.createColumn(boardId, this.newColumnName, position);
      this.columns.update(cols => [...cols, { ...newCol, tasks: [] }]);
      this.toggleAddColumn();
    } catch (error) {
      console.error('Error adding column:', error);
    }
  }

  startAddTask(columnId: string) {
    this.addingToColumn.set(columnId);
    this.newTaskTitle = '';
  }

  cancelAddTask() {
    this.addingToColumn.set(null);
    this.newTaskTitle = '';
  }

  async addTask(columnId: string) {
    if (!this.newTaskTitle.trim()) return;

    const column = this.columns().find(c => c.id === columnId);
    const position = column?.tasks?.length || 0;

    try {
      await this.taskService.addTask(this.newTaskTitle, columnId, position);
      this.cancelAddTask();
    } catch (error) {
      console.error('Error adding task:', error);
    }
  }

  openTaskModal(task: Task) {
    this.dialog.open(TaskModalComponent, {
      data: { task },
      maxWidth: 'none',
    });
  }

  drop(event: CdkDragDrop<Task[]>, columnId: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.updateTaskPositions(event.container.data, columnId);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      this.updateTaskPositions(event.container.data, columnId);
      this.updateTaskPositions(event.previousContainer.data, event.previousContainer.id); // Although simple drag drop, only target col updates might be enough if we just want to save the moved item, but reordering might change positions of others.
    }
  }

  async updateTaskPositions(tasks: Task[], columnId: string) {
    // Update local state is handled by moveItemInArray/transferArrayItem implicitly on the bound array reference usually?
    // Actually signal update might be needed if we want to trigger CD properly or if the array reference didn't change enough for signal?
    // Arrays in signals: we mutated the array inside the signal. We should probably update the signal to notify change.
    // However, CdkDragDrop mutates the array passed in `event.container.data`.
    // Since `columns` is a signal holding an array of objects, and tasks is a property of those objects...
    
    // Let's explicitly update the backend for the moved task and potentially others if we did a full reorder implementation.
    // For this MVP, let's update the moved task 's position and column_id.
    // AND update all tasks in the target column to ensure positions are correct (since insertion shifts others).
    
    // For simplicity and robustness: update position for all tasks in the affected column(s).
    
    tasks.forEach(async (task, index) => {
        const oldPosition = task.position;
        const oldColumnId = task.columnId;
        
        task.position = index;
        task.columnId = columnId;

        // Only update if changed
        if (oldPosition !== index || oldColumnId !== columnId) {
             await this.boardService.updateTaskPosition(task.id, columnId, index);
        }
    });
  }
}
