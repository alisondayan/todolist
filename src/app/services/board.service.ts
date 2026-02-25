import { Injectable, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Task, Priority } from '../models/task.model';
import { Board, Column } from '../models/board.model';

@Injectable({
  providedIn: 'root',
})
export class BoardService {
  private supabase = inject(SupabaseService);

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

  async getBoardById(id: string) {
    const { data, error } = await this.supabase.client
      .from('boards')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Board;
  }

  async getUserBoards() {
    const { data, error } = await this.supabase.client
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Board[];
  }

  async createBoard(name: string, ownerId: string) {
    const { data, error } = await this.supabase.client
      .from('boards')
      .insert([{ name, owner_id: ownerId }])
      .select()
      .single();

    if (error) throw error;
    return data as Board;
  }

  async getColumns(boardId: string) {
    const { data, error } = await this.supabase.client
      .from('columns')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data as Column[];
  }

  async createColumn(boardId: string, name: string, position: number) {
    const { data, error } = await this.supabase.client
      .from('columns')
      .insert([{ board_id: boardId, name, position }])
      .select()
      .single();

    if (error) throw error;
    return data as Column;
  }

  async updateBoard(id: string, name: string) {
    const { data, error } = await this.supabase.client
      .from('boards')
      .update({ name })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Board;
  }

  async getTasks(boardId: string) {
    const columns = await this.getColumns(boardId);
    const columnIds = columns.map(c => c.id);
    
    if (columnIds.length === 0) return [];

    const { data, error } = await this.supabase.client
      .from('tasks')
      .select('*, tags(*), comments(*)')
      .in('column_id', columnIds)
      .order('position', { ascending: true });

    if (error) throw error;
    return (data || []).map(t => this.mapTask(t));
  }

  async updateTaskPosition(taskId: string, columnId: string, position: number) {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .update({ column_id: columnId, position })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;
    return this.mapTask(data);
  }
  private realtimeChannel: any;
  private updatesSubject = new Subject<any>();
  boardUpdates$ = this.updatesSubject.asObservable();

  subscribeToBoard(boardId: string) {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }

    this.realtimeChannel = this.supabase.client.channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          this.updatesSubject.next({ type: 'TASK', payload });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'columns', filter: `board_id=eq.${boardId}` },
        (payload) => {
          this.updatesSubject.next({ type: 'COLUMN', payload });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments' },
        (payload) => {
          this.updatesSubject.next({ type: 'COLUMN', payload });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_tags' },
        (payload) => {
          this.updatesSubject.next({ type: 'COLUMN', payload });
        }
      )
      .subscribe();
  }

  unsubscribeFromBoard() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
  }
}
