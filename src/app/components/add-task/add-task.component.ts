import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-add-task',
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="taskForm" (ngSubmit)="onSubmit()" class="add-task-form">
      <div class="input-group">
        <input 
          type="text" 
          formControlName="title" 
          placeholder="What needs to be done?"
          aria-label="New task title"
        >
        <button 
          type="submit" 
          [disabled]="taskForm.invalid"
          aria-label="Add task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Task
        </button>
      </div>
    </form>
  `,
  styles: [`
    .add-task-form {
      margin-bottom: 2rem;
    }

    .input-group {
      display: flex;
      gap: 0.75rem;
    }

    input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.875rem 1.25rem;
      border-radius: 12px;
      color: #f8fafc;
      font-size: 1rem;
      transition: all 0.2s ease;
      outline: none;
    }

    input:focus {
      border-color: #4299e1;
      background: rgba(255, 255, 255, 0.08);
      box-shadow: 0 0 0 4px rgba(66, 153, 225, 0.15);
    }

    input::placeholder {
      color: #64748b;
    }

    button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #4299e1;
      color: white;
      border: none;
      padding: 0.875rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    button:hover:not(:disabled) {
      background: #3182ce;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
    }

    button:active:not(:disabled) {
      transform: translateY(0);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      filter: grayscale(1);
    }

    @media (max-width: 480px) {
      .input-group {
        flex-direction: column;
      }
      button {
        justify-content: center;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddTaskComponent {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);

  taskForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]]
  });

  onSubmit() {
    if (this.taskForm.valid) {
      const title = this.taskForm.value.title;
      if (title) {
        this.taskService.addTask(title);
        this.taskForm.reset();
      }
    }
  }
}
