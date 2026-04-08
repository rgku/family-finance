export type TransactionType = 'income' | 'expense';

export interface Family {
  id: string;
  name: string;
  created_at: string;
}

export interface User {
  id: string;
  family_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  role: 'admin' | 'member';
  created_at: string;
}

export interface Category {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  color: string;
  budget_limit: number | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string;
  date: string;
  type: TransactionType;
  created_at: string;
  category?: Category;
  user?: User;
}

export interface Goal {
  id: string;
  family_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  created_at: string;
}
