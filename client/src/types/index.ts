export type SessionIntent = 'BUILD' | 'EXPLORE' | 'CONTINUE';

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  createdAt: string;
}

export interface Category {
  id: number;
  slug: string;
  label: string;
  icon?: string;
}

export interface Session {
  id: string;
  userId: string;
  intent: SessionIntent;
  categoryId?: number;
  converted: boolean;
  convertedPlanId?: string;
  createdAt: string;
  endedAt?: string;
}

export interface InspirationItem {
  id: string;
  categoryId: number;
  title: string;
  body?: string;
  imageUrl?: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  userId: string;
  categoryId: number;
  title: string;
  description?: string;
  status: 'IDEA' | 'ACTIVE' | 'STALLED' | 'COMPLETED' | 'ARCHIVED';
  targetDate?: string;
  stalledSince?: string;
  createdAt: string;
  updatedAt: string;
  category?: Category;
}
