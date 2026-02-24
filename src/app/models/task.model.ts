export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  userName?: string;
  content: string;
  createdAt: number;
}

export interface Task {
  id: string;
  columnId: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: number;
  priority: Priority;
  assigneeId?: string;
  position: number;
  createdAt: number;
  tags?: Tag[];
  comments?: Comment[];
}
