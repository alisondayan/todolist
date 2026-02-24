import { Task } from './task.model';

export interface Board {
  id: string;
  name: string;
  created_at?: string;
  owner_id: string;
}

export interface Column {
  id: string;
  board_id: string;
  name: string;
  position: number;
  tasks?: Task[]; // Optional array to hold tasks for UI
}

