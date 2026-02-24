import { Injectable, inject, signal, effect } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface AppNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private supabase = inject(SupabaseService);
  private authService = inject(AuthService);

  notifications = signal<AppNotification[]>([]);
  private realtimeChannel: RealtimeChannel | null = null;
  private checkInterval: any;

  constructor() {
    // Monitor auth state to start/stop services
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.initialize(user.id);
      } else {
        this.cleanup();
      }
    });
  }

  initialize(userId: string) {
    this.checkDueTasks(userId);
    this.startRealtimeSubscription(userId);

    // Check due dates every 5 minutes
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => {
      this.checkDueTasks(userId);
    }, 5 * 60 * 1000);
  }

  cleanup() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  addNotification(message: string, type: 'info' | 'warning' | 'error' | 'success' = 'info') {
    const newNotification: AppNotification = {
      id: crypto.randomUUID(),
      message,
      type,
      timestamp: Date.now()
    };
    
    this.notifications.update(current => [newNotification, ...current]);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      this.removeNotification(newNotification.id);
    }, 5000);
  }

  removeNotification(id: string) {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }

  private async checkDueTasks(userId: string) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Fetch tasks for user and filter client-side to be safe and avoid errors if schema is partially updated
    const { data, error } = await this.supabase.client
      .from('tasks')
      .select('*')
      .eq('assignee_id', userId);

    if (error) {
      console.error('Error checking due tasks:', error);
      return;
    }

    // Filter non-completed tasks client-side
    const tasks = data?.filter(t => !t.completed) || [];

    if (tasks && tasks.length > 0) {
      tasks.forEach(task => {
        if (!task.due_date) return;
        
        const dueDate = new Date(task.due_date).getTime();
        const nowTime = now.getTime();
        const tomorrowTime = tomorrow.getTime();

        if (dueDate >= nowTime && dueDate <= tomorrowTime) {
          this.addNotification(`Task "${task.title}" is due soon!`, 'warning'); 
        }
      });
    }
  }

  private startRealtimeSubscription(userId: string) {
    if (this.realtimeChannel) this.realtimeChannel.unsubscribe();

    this.realtimeChannel = this.supabase.client.channel(`user-notifications:${userId}`)
      // Listen for assignments
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tasks', filter: `assignee_id=eq.${userId}` },
        (payload) => {
          this.addNotification(`You have been assigned a new task: "${payload.new['title']}"`, 'info');
        }
      )
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'tasks', filter: `assignee_id=eq.${userId}` },
        (payload) => {
           // Notify if mapped to me or priority changed?
           // Minimal: Notify on assignment change to me?
           
           if (payload.old['assignee_id'] !== userId) {
             this.addNotification(`You have been assigned to task: "${payload.new['title']}"`, 'info');
           }
        }
      )
      // Listen for mentions in comments
      // We can't filter by content ILIKE '%@user%' in realtime easily.
      // We have to listen to ALL comments and check content?
      // Or listen to comments where I am the task owner? 
      // The requirement: "when someone lo etiquete".
      // We will listen to all comments (global)? No, too much.
      // Comments on tasks I'm assigned to? Or just all comments?
      // Given it's a "To-Do List" likely small team. listening to all comments might be ok.
      // BETTER: Listen to 'comments' table, no filter (or filter by board if we had context, but this is global service).
      // We will check content for `@UserEmail` or `@UserName`.
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
           const content = payload.new['content'] as string;
           const userEmail = this.authService.currentUser()?.email;
           // Assuming mention format is @email or just check if email is in string
           if (userEmail && content.includes(`@${userEmail}`)) { // Simple check
              this.addNotification(`You were mentioned in a comment`, 'info');
           }
           // Also check specifically for "tags" if implemented as a separate system, but prompt says "etiquete en un comentario".
        }
      )
      .subscribe();
  }
}
