import { Injectable, signal, computed, inject } from '@angular/core';
import { Task, Tag, Comment, Priority } from '../models/task.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private supabase = inject(SupabaseService);
  private tasksSignal = signal<Task[]>([]);
  private loadingSignal = signal<boolean>(false);

  // Exposed read-only signals
  tasks = this.tasksSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  completedTasks = computed(() => this.tasks().filter((t) => t.completed));
  pendingTasks = computed(() => this.tasks().filter((t) => !t.completed));

  constructor() {
    this.fetchTasks();
  }

  async fetchTasks() {
    this.loadingSignal.set(true);
    try {
      const { data, error } = await this.supabase.client
        .from('tasks')
        .select(`
          *,
          tags(*),
          comments(*)
        `)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase error fetching tasks:', error);
        throw error;
      }

      if (data) {
        this.tasksSignal.set(
          data.map((t: any) => this.mapTask(t))
        );
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  private mapTask(t: any): Task {
    return {
      id: t.id,
      columnId: t.column_id,
      title: t.title,
      description: t.description,
      completed: !!t.completed,
      dueDate: t.due_date ? new Date(t.due_date).getTime() : undefined,
      priority: t.priority as Priority,
      assigneeId: t.assignee_id,
      position: t.position || 0,
      createdAt: new Date(t.created_at).getTime(),
      tags: t.tags || [],
      comments: t.comments?.map((c: any) => ({
        id: c.id,
        taskId: c.task_id,
        userId: c.user_id,
        userName: c.user_name,
        content: c.content,
        createdAt: new Date(c.created_at).getTime(),
      })).sort((a: any, b: any) => a.createdAt - b.createdAt) || [],
    };
  }

  async addTask(title: string, columnId?: string, position?: number) {
    try {
      const taskData: any = { title };
      
      // If no columnId provided, try to find the first column of the first board
      if (!columnId) {
        const { data: boards } = await this.supabase.client.from('boards').select('id').limit(1);
        if (boards && boards.length > 0) {
          const { data: cols } = await this.supabase.client
            .from('columns')
            .select('id')
            .eq('board_id', boards[0].id)
            .order('position', { ascending: true })
            .limit(1);
          if (cols && cols.length > 0) {
            columnId = cols[0].id;
          }
        }
      }

      if (columnId) taskData.column_id = columnId;
      if (position !== undefined) taskData.position = position;

      const { data, error } = await this.supabase.client
        .from('tasks')
        .insert([taskData])
        .select('*, tags(*), comments(*)')
        .single();

      if (error) {
        console.error('Supabase error adding task:', error);
        throw error;
      }

      if (data) {
        const newTask = this.mapTask(data);
        this.tasksSignal.update((tasks) => [...tasks, newTask]);
        return newTask;
      }
    } catch (error) {
      console.error('Error adding task:', error);
      throw error;
    }
    return null;
  }

  async updateTask(id: string, updates: Partial<Task>) {
    try {
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate ? new Date(updates.dueDate).toISOString() : null;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.assigneeId !== undefined) dbUpdates.assignee_id = updates.assigneeId;
      if (updates.columnId !== undefined) dbUpdates.column_id = updates.columnId;
      if (updates.position !== undefined) dbUpdates.position = updates.position;

      const { error } = await this.supabase.client
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      this.tasksSignal.update((tasks) =>
        tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  async toggleTask(id: string) {
    const task = this.tasksSignal().find((t) => t.id === id);
    if (!task) return;
    await this.updateTask(id, { completed: !task.completed });
  }

  async deleteTask(id: string) {
    try {
      const { error } = await this.supabase.client.from('tasks').delete().eq('id', id);
      if (error) throw error;
      this.tasksSignal.update((tasks) => tasks.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  // Tags
  async getAllTags(): Promise<Tag[]> {
    const { data, error } = await this.supabase.client.from('tags').select('*').order('name');
    if (error) throw error;
    return data || [];
  }

  async createTag(name: string, color: string): Promise<Tag> {
    const { data, error } = await this.supabase.client
      .from('tags')
      .insert([{ name, color }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async addTagToTask(taskId: string, tagId: string) {
    const { error } = await this.supabase.client
      .from('task_tags')
      .insert([{ task_id: taskId, tag_id: tagId }]);
    if (error) throw error;
    await this.fetchTasks(); // Refresh to get nested data
  }

  async removeTagFromTask(taskId: string, tagId: string) {
    const { error } = await this.supabase.client
      .from('task_tags')
      .delete()
      .eq('task_id', taskId)
      .eq('tag_id', tagId);
    if (error) throw error;
    await this.fetchTasks();
  }

  // Comments
  async addComment(taskId: string, content: string, userName: string) {
    const { data: userData } = await this.supabase.client.auth.getUser();
    const userId = userData.user?.id;

    const { data, error } = await this.supabase.client
      .from('comments')
      .insert([{
        task_id: taskId,
        user_id: userId,
        content,
        user_name: userName
      }])
      .select()
      .single();

    if (error) throw error;

    this.tasksSignal.update(tasks => tasks.map(t => {
      if (t.id === taskId) {
        const newComment: Comment = {
          id: data.id,
          taskId: data.task_id,
          userId: data.user_id,
          userName: data.user_name,
          content: data.content,
          createdAt: new Date(data.created_at).getTime()
        };
        return { ...t, comments: [...(t.comments || []), newComment] };
      }
      return t;
    }));
  }
}

