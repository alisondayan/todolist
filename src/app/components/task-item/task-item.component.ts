import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../models/task.model';

@Component({
  selector: 'app-task-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="task-item group" [class.completed]="task().completed" (click)="onSelected()">
      <label class="checkbox-container" (click)="$event.stopPropagation()">
        <input 
          type="checkbox" 
          [checked]="task().completed" 
          (change)="onToggle()"
          [attr.aria-label]="'Mark ' + task().title + ' as complete'"
        >
        <span class="checkmark"></span>
      </label>
      
      <div class="flex-1 ml-4 cursor-pointer">
        <span class="task-title">{{ task().title }}</span>
        <div class="flex gap-2 mt-1">
          @if (task().priority) {
            <span [class]="getPriorityClass()" class="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase">
              {{ task().priority }}
            </span>
          }
          @if (task().dueDate) {
            <span class="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ task().dueDate | date:'shortDate' }}
            </span>
          }
        </div>
      </div>
      
      <button 
        class="delete-btn opacity-0 group-hover:opacity-100 transition-opacity" 
        (click)="onDelete(); $event.stopPropagation()"
        [attr.aria-label]="'Delete ' + task().title"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
      </button>
    </div>
  `,
  styles: [`
    .task-item {
      display: flex;
      align-items: center;
      padding: 1rem;
      background: white;
      border-radius: 12px;
      margin-bottom: 0.75rem;
      transition: all 0.2s ease;
      border: 1px solid #fce4ec;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
      cursor: pointer;
    }

    .task-item:hover {
      transform: translateY(-2px);
      background: #fffafa;
      border-color: #f48fb1;
      box-shadow: 0 6px 12px rgba(236, 64, 122, 0.08);
    }

    .task-item.completed {
      opacity: 0.6;
    }

    .task-item.completed .task-title {
      text-decoration: line-through;
      color: #f48fb1;
    }

    .task-title {
      font-size: 1rem;
      color: #880e4f;
      transition: color 0.2s ease;
      font-weight: 500;
    }

    .checkbox-container {
      position: relative;
      display: block;
      width: 24px;
      height: 24px;
      cursor: pointer;
    }

    .checkbox-container input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }

    .checkmark {
      position: absolute;
      top: 0;
      left: 0;
      height: 24px;
      width: 24px;
      background-color: transparent;
      border: 2px solid #f8bbd0;
      border-radius: 6px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .checkbox-container:hover input ~ .checkmark {
      border-color: #ec407a;
    }

    .checkbox-container input:checked ~ .checkmark {
      background-color: #ec407a;
      border-color: #ec407a;
    }

    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
      left: 8px;
      top: 4px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-container input:checked ~ .checkmark:after {
      display: block;
    }

    .delete-btn {
      background: none;
      border: none;
      color: #f8bbd0;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .delete-btn:hover {
      color: #ec407a;
      background: #fff5f7;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskItemComponent {
  task = input.required<Task>();
  toggle = output<string>();
  delete = output<string>();
  selected = output<Task>();

  onToggle() {
    this.toggle.emit(this.task().id);
  }

  onDelete() {
    this.delete.emit(this.task().id);
  }

  onSelected() {
    this.selected.emit(this.task());
  }

  getPriorityClass() {
    switch (this.task().priority) {
      case 'low': return 'text-blue-400 bg-blue-400/10';
      case 'medium': return 'text-green-400 bg-green-400/10';
      case 'high': return 'text-yellow-400 bg-yellow-400/10';
      case 'urgent': return 'text-red-400 bg-red-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  }
}
