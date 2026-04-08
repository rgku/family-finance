import { create } from "zustand";
import { createClient } from "@/lib/supabase";
import type { Transaction, Category, Goal, User } from "@/types";

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  familyMembers: User[];
  loading: boolean;
  error: string | null;
  isDemoMode: boolean;
  
  fetchTransactions: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchFamilyMembers: () => Promise<void>;
  
  addTransaction: (transaction: Omit<Transaction, "id" | "created_at">) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addCategory: (category: Omit<Category, "id" | "created_at">) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  
  addGoal: (goal: Omit<Goal, "id" | "created_at" | "current_amount">) => Promise<void>;
  updateGoal: (id: string, currentAmount: number) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  
  subscribeToRealtime: () => () => void;
}

const supabase = createClient();

const demoCategories: Category[] = [
  { id: "1", family_id: "demo", name: "Alimentação", icon: "utensils", color: "#10B981", budget_limit: 500, created_at: "" },
  { id: "2", family_id: "demo", name: "Transportes", icon: "car", color: "#3B82F6", budget_limit: 200, created_at: "" },
  { id: "3", family_id: "demo", name: "Casa", icon: "home", color: "#8B5CF6", budget_limit: 800, created_at: "" },
  { id: "4", family_id: "demo", name: "Saúde", icon: "heart", color: "#EF4444", budget_limit: 150, created_at: "" },
  { id: "5", family_id: "demo", name: "Lazer", icon: "film", color: "#F59E0B", budget_limit: 300, created_at: "" },
  { id: "6", family_id: "demo", name: "Compras", icon: "shopping-bag", color: "#EC4899", budget_limit: 250, created_at: "" },
  { id: "7", family_id: "demo", name: "Salário", icon: "banknote", color: "#22C55E", budget_limit: null, created_at: "" },
  { id: "8", family_id: "demo", name: "Outros", icon: "more-horizontal", color: "#6B7280", budget_limit: null, created_at: "" },
];

const demoTransactions: Transaction[] = [
  { id: "1", user_id: "demo", category_id: "1", amount: 45.50, description: "Continente", date: new Date().toISOString(), type: "expense", created_at: "" },
  { id: "2", user_id: "demo", category_id: "2", amount: 30.00, description: "Gasolina", date: new Date().toISOString(), type: "expense", created_at: "" },
  { id: "3", user_id: "demo", category_id: "7", amount: 1500.00, description: "Salário", date: new Date().toISOString(), type: "income", created_at: "" },
];

const demoGoals: Goal[] = [
  { id: "1", family_id: "demo", name: "Férias", target_amount: 2000, current_amount: 500, deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), created_at: "" },
  { id: "2", family_id: "demo", name: "Fundo de Emergência", target_amount: 5000, current_amount: 1500, deadline: null, created_at: "" },
];

function loadFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveToLocalStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

export const useStore = create<AppState>((set, get) => ({
  transactions: loadFromLocalStorage("ff_transactions", demoTransactions),
  categories: loadFromLocalStorage("ff_categories", demoCategories),
  goals: loadFromLocalStorage("ff_goals", demoGoals),
  familyMembers: [],
  loading: false,
  error: null,
  isDemoMode: true,

  fetchTransactions: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, category:categories(*), user:users(*)")
        .order("date", { ascending: false });
      
      if (error || !data || data.length === 0) {
        const cached = loadFromLocalStorage("ff_transactions", demoTransactions);
        set({ transactions: cached, loading: false, isDemoMode: true });
      } else {
        set({ transactions: data, loading: false, isDemoMode: false });
        saveToLocalStorage("ff_transactions", data);
      }
    } catch {
      const cached = loadFromLocalStorage("ff_transactions", demoTransactions);
      set({ transactions: cached, loading: false, isDemoMode: true });
    }
  },

  fetchCategories: async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");
      
      if (error || !data || data.length === 0) {
        const cached = loadFromLocalStorage("ff_categories", demoCategories);
        set({ categories: cached });
      } else {
        set({ categories: data });
        saveToLocalStorage("ff_categories", data);
      }
    } catch {
      const cached = loadFromLocalStorage("ff_categories", demoCategories);
      set({ categories: cached });
    }
  },

  fetchGoals: async () => {
    try {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error || !data || data.length === 0) {
        const cached = loadFromLocalStorage("ff_goals", demoGoals);
        set({ goals: cached });
      } else {
        set({ goals: data });
        saveToLocalStorage("ff_goals", data);
      }
    } catch {
      const cached = loadFromLocalStorage("ff_goals", demoGoals);
      set({ goals: cached });
    }
  },

  fetchFamilyMembers: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from("users")
      .select("family_id")
      .eq("id", user.id)
      .single();

    if (!userData) return;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("family_id", userData.family_id);

    if (data) {
      set({ familyMembers: data });
    }
  },

  addTransaction: async (transaction) => {
    const { isDemoMode } = get();
    
    if (isDemoMode) {
      const newTransaction = { ...transaction, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
      const updated = [newTransaction, ...get().transactions];
      set({ transactions: updated });
      saveToLocalStorage("ff_transactions", updated);
      return;
    }

    const { error } = await supabase.from("transactions").insert([transaction]);
    if (!error) {
      get().fetchTransactions();
    }
  },

  updateTransaction: async (id, updates) => {
    const { isDemoMode } = get();
    
    if (isDemoMode) {
      const updated = get().transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      );
      set({ transactions: updated });
      saveToLocalStorage("ff_transactions", updated);
      return;
    }

    await supabase.from("transactions").update(updates).eq("id", id);
    get().fetchTransactions();
  },

  deleteTransaction: async (id) => {
    const { isDemoMode } = get();
    
    if (isDemoMode) {
      const updated = get().transactions.filter((t) => t.id !== id);
      set({ transactions: updated });
      saveToLocalStorage("ff_transactions", updated);
      return;
    }

    await supabase.from("transactions").delete().eq("id", id);
    get().fetchTransactions();
  },

  addCategory: async (category) => {
    const { isDemoMode, categories } = get();
    
    if (isDemoMode) {
      const newCategory = { ...category, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
      const updated = [...categories, newCategory];
      set({ categories: updated });
      saveToLocalStorage("ff_categories", updated);
      return;
    }

    await supabase.from("categories").insert([category]);
    get().fetchCategories();
  },

  updateCategory: async (id, updates) => {
    const { isDemoMode, categories } = get();
    
    if (isDemoMode) {
      const updated = categories.map((c) => c.id === id ? { ...c, ...updates } : c);
      set({ categories: updated });
      saveToLocalStorage("ff_categories", updated);
      return;
    }

    await supabase.from("categories").update(updates).eq("id", id);
    get().fetchCategories();
  },

  deleteCategory: async (id) => {
    const { isDemoMode, categories } = get();
    
    if (isDemoMode) {
      const updated = categories.filter((c) => c.id !== id);
      set({ categories: updated });
      saveToLocalStorage("ff_categories", updated);
      return;
    }

    await supabase.from("categories").delete().eq("id", id);
    get().fetchCategories();
  },

  addGoal: async (goal) => {
    const { isDemoMode, goals } = get();
    
    if (isDemoMode) {
      const newGoal = { ...goal, id: Math.random().toString(36).substr(2, 9), current_amount: 0, created_at: new Date().toISOString() };
      const updated = [newGoal, ...goals];
      set({ goals: updated });
      saveToLocalStorage("ff_goals", updated);
      return;
    }

    await supabase.from("goals").insert([goal]);
    get().fetchGoals();
  },

  updateGoal: async (id, currentAmount) => {
    const { isDemoMode, goals } = get();
    
    if (isDemoMode) {
      const updated = goals.map((g) => g.id === id ? { ...g, current_amount: currentAmount } : g);
      set({ goals: updated });
      saveToLocalStorage("ff_goals", updated);
      return;
    }

    await supabase.from("goals").update({ current_amount: currentAmount }).eq("id", id);
    get().fetchGoals();
  },

  deleteGoal: async (id) => {
    const { isDemoMode, goals } = get();
    
    if (isDemoMode) {
      const updated = goals.filter((g) => g.id !== id);
      set({ goals: updated });
      saveToLocalStorage("ff_goals", updated);
      return;
    }

    await supabase.from("goals").delete().eq("id", id);
    get().fetchGoals();
  },

  subscribeToRealtime: () => {
    const { isDemoMode } = get();
    if (isDemoMode) return () => {};

    const channel = supabase
      .channel("app-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, () => {
        get().fetchTransactions();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "goals" }, () => {
        get().fetchGoals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
