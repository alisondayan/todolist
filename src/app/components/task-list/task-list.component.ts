import { Component, ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { Dialog, DialogModule } from '@angular/cdk/dialog';
import { TaskService } from '../../services/task.service';
import { TaskItemComponent } from '../task-item/task-item.component';
import { TaskModalComponent } from '../task-modal/task-modal.component';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [TaskItemComponent, DialogModule],
  template: `
    <div class="list-header">
      <h2>Your Tasks</h2>
      <div class="filters">
        <button [class.active]="filter() === 'all'" (click)="filter.set('all')">All</button>
        <button [class.active]="filter() === 'pending'" (click)="filter.set('pending')">Pending</button>
        <button [class.active]="filter() === 'completed'" (click)="filter.set('completed')">Completed</button>
      </div>
    </div>

    @if (taskService.loading()) {
      <div class="loading-state">
        <div class="loader"></div>
        <p>Loading tasks...</p>
      </div>
    } @else {
      @if (filteredTasks().length > 0) {
        <div class="tasks-container">
          @for (task of filteredTasks(); track task.id) {
            <app-task-item 
              [task]="task" 
              (toggle)="onToggle($event)" 
              (delete)="onDelete($event)"
              (selected)="onSelected($event)"
            />
          }
        </div>
      } @else {
        <div class="empty-state">
          <div class="icon">✨</div>
          <p>No tasks found. Time to relax or create one!</p>
        </div>
      }
    }

    <div class="list-footer">
      <span>{{ pendingCount() }} items left</span>
    </div>

  `,
  styles: [`
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .filters {
      display: flex;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      padding: 0.25rem;
      border-radius: 10px;
    }

    .filters button {
      background: none;
      border: none;
      color: #94a3b8;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .filters button:hover {
      color: #f8fafc;
    }

    .filters button.active {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .tasks-container {
      display: flex;
      flex-direction: column;
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 20px;
      border: 1px dashed rgba(255, 255, 255, 0.1);
    }

    .empty-state .icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state p {
      color: #64748b;
      margin: 0;
    }

    .list-footer {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #64748b;
      font-size: 0.875rem;
      display: flex;
      justify-content: space-between;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      gap: 1rem;
    }

    .loader {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      border-top-color: #3b82f6;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskListComponent {
  public taskService = inject(TaskService);
  private dialog = inject(Dialog);
  filter = signal<'all' | 'pending' | 'completed'>('all');

  filteredTasks = computed(() => {
    const tasks = this.taskService.tasks();
    switch (this.filter()) {
      case 'pending': return tasks.filter(t => !t.completed);
      case 'completed': return tasks.filter(t => t.completed);
      default: return tasks;
    }
  });

  pendingCount = computed(() => this.taskService.pendingTasks().length);

  onToggle(id: string) {
    this.taskService.toggleTask(id);
  }

  onDelete(id: string) {
    this.taskService.deleteTask(id);
  }

  onSelected(task: Task) {
    this.dialog.open(TaskModalComponent, {
      data: { task },
      panelClass: 'custom-dialog-container'
    });
  }
}
