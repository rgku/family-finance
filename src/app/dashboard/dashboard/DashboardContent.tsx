"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { createClient } from "@/lib/supabase";
import { Plus, TrendingUp, TrendingDown, Target, X, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import type { TransactionType } from "@/types";

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B", "#EC4899", "#22C55E", "#6B7280"];

const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function DashboardContent() {
  const { transactions, categories, goals, fetchTransactions, fetchCategories, fetchGoals, addTransaction, deleteTransaction, updateTransaction, subscribeToRealtime } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [newTransaction, setNewTransaction] = useState({ amount: "", description: "", category_id: "", type: "expense" as TransactionType });
  const supabase = createClient();

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchGoals();
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe();
  }, []);

  const filteredTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
  });

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpense;

  const expenseByCategory = categories
    .map((cat) => {
      const total = filteredTransactions
        .filter((t) => t.type === "expense" && t.category_id === cat.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return { name: cat.name, value: total, color: cat.color };
    })
    .filter((c) => c.value > 0);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.category_id) return;

    await addTransaction({
      user_id: "demo-user",
      category_id: newTransaction.category_id,
      amount: Number(newTransaction.amount),
      description: newTransaction.description,
      type: newTransaction.type,
      date: new Date(selectedYear, selectedMonth, new Date().getDate()).toISOString(),
    });

    setShowAddModal(false);
    setNewTransaction({ amount: "", description: "", category_id: "", type: "expense" });
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || !editingTransaction.category_id) return;

    await updateTransaction(editingTransaction.id, {
      amount: Number(editingTransaction.amount),
      description: editingTransaction.description,
      category_id: editingTransaction.category_id,
      type: editingTransaction.type,
      date: new Date(selectedYear, selectedMonth, new Date().getDate()).toISOString(),
    });

    setShowEditModal(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Tens a certeza que queres eliminar esta transação?")) {
      await deleteTransaction(id);
    }
  };

  const openEditModal = (transaction: any) => {
    setEditingTransaction({
      ...transaction,
      amount: transaction.amount.toString(),
    });
    setShowEditModal(true);
  };

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-center">Family Finance</h1>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-700 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium min-w-[140px] text-center">
              {MONTHS[selectedMonth]} {selectedYear}
            </span>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-700 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg shadow-blue-500/20">
          <p className="text-blue-100 text-sm mb-1">Balanço do mês</p>
          <p className="text-3xl font-bold">{balance.toFixed(2)}€</p>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-300" />
              <span className="text-sm text-green-300">{totalIncome.toFixed(2)}€</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-300" />
              <span className="text-sm text-red-300">{totalExpense.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        {goals.length > 0 && (
          <div className="bg-slate-800/50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold">Metas</h2>
            </div>
            <div className="space-y-3">
              {goals.slice(0, 3).map((goal) => (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{goal.name}</span>
                    <span className="text-slate-400">
                      {goal.current_amount}€ / {goal.target_amount}€
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {expenseByCategory.length > 0 && (
          <div className="bg-slate-800/50 rounded-2xl p-4">
            <h2 className="font-semibold mb-4">Gastos por categoria</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry, index) => (
                      <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(value) => `${Number(value).toFixed(2)}€`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {expenseByCategory.slice(0, 4).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-2 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color || COLORS[i] }} />
                  <span className="text-slate-300 truncate">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-slate-800/50 rounded-2xl p-4">
          <h2 className="font-semibold mb-4">Transações</h2>
          {filteredTransactions.length === 0 ? (
            <p className="text-slate-400 text-center py-4">Sem transações neste mês</p>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((t) => (
                <div key={t.id} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                  <div className="flex-1">
                    <p className="font-medium">{t.description || t.category?.name}</p>
                    <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString("pt-PT")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={t.type === "income" ? "text-green-400" : "text-red-400"}>
                      {t.type === "income" ? "+" : "-"}{Number(t.amount).toFixed(2)}€
                    </span>
                    <button onClick={() => openEditModal(t)} className="p-1 text-slate-400 hover:text-blue-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 text-slate-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform hover:scale-110"
      >
        <Plus className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full bg-slate-800 rounded-t-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Nova Transação</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setNewTransaction({ ...newTransaction, type: "expense" })}
                    className={`flex-1 py-2 rounded-lg font-medium ${newTransaction.type === "expense" ? "bg-red-500 text-white" : "bg-slate-700 text-slate-300"}`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTransaction({ ...newTransaction, type: "income" })}
                    className={`flex-1 py-2 rounded-lg font-medium ${newTransaction.type === "income" ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300"}`}
                  >
                    Receita
                  </button>
                </div>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor (€)"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input
                  type="text"
                  placeholder="Descrição (opcional)"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <select
                  value={newTransaction.category_id}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecionar categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Guardar
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && editingTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full bg-slate-800 rounded-t-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Editar Transação</h2>
                <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditTransaction} className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setEditingTransaction({ ...editingTransaction, type: "expense" })}
                    className={`flex-1 py-2 rounded-lg font-medium ${editingTransaction.type === "expense" ? "bg-red-500 text-white" : "bg-slate-700 text-slate-300"}`}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTransaction({ ...editingTransaction, type: "income" })}
                    className={`flex-1 py-2 rounded-lg font-medium ${editingTransaction.type === "income" ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300"}`}
                  >
                    Receita
                  </button>
                </div>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor (€)"
                  value={editingTransaction.amount}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />

                <input
                  type="text"
                  placeholder="Descrição (opcional)"
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <select
                  value={editingTransaction.category_id}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, category_id: e.target.value })}
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecionar categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Guardar Alterações
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
