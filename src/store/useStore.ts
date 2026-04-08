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
  
  fetchTransactions: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchFamilyMembers: () => Promise<void>;
  
  addTransaction: (transaction: Omit<Transaction, "id" | "created_at">) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  addCategory: (category: Omit<Category, "id" | "created_at">) => Promise<void>;
  updateGoal: (id: string, currentAmount: number) => Promise<void>;
  addGoal: (goal: Omit<Goal, "id" | "created_at" | "current_amount">) => Promise<void>;
  
  subscribeToRealtime: () => () => void;
}

const supabase = createClient();

export const useStore = create<AppState>((set, get) => ({
  transactions: [],
  categories: [],
  goals: [],
  familyMembers: [],
  loading: false,
  error: null,

  fetchTransactions: async () => {
    set({ loading: true });
    const { data, error } = await supabase
      .from("transactions")
      .select("*, category:categories(*), user:users(*)")
      .order("date", { ascending: false });
    
    if (error) {
      set({ error: error.message, loading: false });
    } else {
      set({ transactions: data || [], loading: false });
    }
  },

  fetchCategories: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    
    if (!error) {
      set({ categories: data || [] });
    }
  },

  fetchGoals: async () => {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error) {
      set({ goals: data || [] });
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
    const { error } = await supabase.from("transactions").insert([transaction]);
    if (error) {
      set({ error: error.message });
    }
  },

  updateTransaction: async (id, updates) => {
    const { error } = await supabase
      .from("transactions")
      .update(updates)
      .eq("id", id);
    
    if (error) {
      set({ error: error.message });
    }
  },

  deleteTransaction: async (id) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) {
      set({ error: error.message });
    }
  },

  addCategory: async (category) => {
    const { error } = await supabase.from("categories").insert([category]);
    if (error) {
      set({ error: error.message });
    }
  },

  updateGoal: async (id, currentAmount) => {
    const { error } = await supabase
      .from("goals")
      .update({ current_amount: currentAmount })
      .eq("id", id);
    
    if (error) {
      set({ error: error.message });
    }
  },

  addGoal: async (goal) => {
    const { error } = await supabase.from("goals").insert([goal]);
    if (error) {
      set({ error: error.message });
    }
  },

  subscribeToRealtime: () => {
    const channel = supabase
      .channel("app-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === "INSERT") {
            get().fetchTransactions();
          } else if (eventType === "UPDATE") {
            set((state) => ({
              transactions: state.transactions.map((t) =>
                t.id === oldRecord.id ? { ...t, ...newRecord } : t
              ),
            }));
          } else if (eventType === "DELETE") {
            set((state) => ({
              transactions: state.transactions.filter((t) => t.id !== oldRecord.id),
            }));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals" },
        () => {
          get().fetchGoals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
