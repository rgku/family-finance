"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Plus, TrendingUp, TrendingDown, Target, Download, ChevronLeft, ChevronRight, AlertTriangle, Edit2, Trash2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { TransactionType } from "@/types";

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B", "#EC4899", "#22C55E", "#6B7280"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function MobileDashboard() {
  const { transactions, categories, goals, fetchTransactions, fetchCategories, fetchGoals, addTransaction, deleteTransaction, updateTransaction, subscribeToRealtime } = useStore();
  const [activeTab, setActiveTab] = useState<"dashboard" | "add" | "goals">("dashboard");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [newTransaction, setNewTransaction] = useState({ amount: "", category_id: "", type: "expense" as TransactionType, description: "" });
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);

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

  const totalIncome = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpense = filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;
  const isHealthy = balance >= 0;

  const expenseByCategory = categories
    .map((cat) => ({
      name: cat.name,
      value: filteredTransactions.filter((t) => t.type === "expense" && t.category_id === cat.id).reduce((sum, t) => sum + Number(t.amount), 0),
      color: cat.color,
      budget_limit: cat.budget_limit,
    }))
    .filter((c) => c.value > 0);

  const budgetAlerts = expenseByCategory
    .filter((c) => c.budget_limit && c.value >= c.budget_limit * 0.8)
    .sort((a, b) => (b.value / (b.budget_limit || 1)) - (a.value / (a.budget_limit || 1)))
    .slice(0, 3);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.category_id || !newTransaction.amount) return;
    await addTransaction({
      user_id: "demo-user",
      category_id: newTransaction.category_id,
      amount: Number(newTransaction.amount),
      description: newTransaction.description || "",
      type: newTransaction.type,
      date: new Date(selectedYear, selectedMonth, new Date().getDate()).toISOString(),
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
    setNewTransaction({ amount: "", category_id: "", type: "expense", description: "" });
    setActiveTab("dashboard");
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Tens a certeza que queres eliminar esta transação?")) {
      await deleteTransaction(id);
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    await updateTransaction(editingTransaction.id, {
      amount: Number(editingTransaction.amount),
      category_id: editingTransaction.category_id,
      description: editingTransaction.description || "",
      type: editingTransaction.type,
    });
    setEditingTransaction(null);
  };

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    else if (newMonth > 11) { newMonth = 0; newYear++; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const exportToPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = await import("jspdf-autotable");
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Relatório de Transações", 14, 22);
    doc.text(`${MONTHS[selectedMonth]} ${selectedYear}`, 14, 30);
    const tableData = filteredTransactions.map((t) => [
      new Date(t.date).toLocaleDateString("pt-PT"),
      t.description || t.category?.name || "-",
      t.type === "income" ? `+${Number(t.amount).toFixed(2)}€` : `-${Number(t.amount).toFixed(2)}€`,
    ]);
    autoTable.default(doc, { startY: 40, head: [["Data", "Descrição", "Valor"]], body: tableData, theme: "striped" });
    doc.save(`transacoes_${MONTHS[selectedMonth]}_${selectedYear}.pdf`);
    setShowExportMenu(false);
  };

  const exportToExcel = async () => {
    const XLSX = await import("xlsx");
    const data = filteredTransactions.map((t) => ({
      Data: new Date(t.date).toLocaleDateString("pt-PT"),
      Descrição: t.description || t.category?.name || "-",
      Tipo: t.type === "income" ? "Receita" : "Despesa",
      Valor: t.type === "income" ? Number(t.amount) : -Number(t.amount),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transações");
    XLSX.writeFile(wb, `transacoes_${MONTHS[selectedMonth]}_${selectedYear}.xlsx`);
    setShowExportMenu(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-slate-700 rounded">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium">{MONTHS[selectedMonth]}</span>
            <button onClick={() => changeMonth(1)} className="p-1 hover:bg-slate-700 rounded">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="p-2 hover:bg-slate-700 rounded-lg">
              <Download className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-full mt-1 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50">
                  <button onClick={exportToPDF} className="block w-full px-4 py-2 text-left hover:bg-slate-700 text-sm">Exportar PDF</button>
                  <button onClick={exportToExcel} className="block w-full px-4 py-2 text-left hover:bg-slate-700 text-sm">Exportar Excel</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="px-4 py-2 bg-red-500/20 border-y border-red-500/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs font-semibold text-red-400">Orçamentos em risco</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {budgetAlerts.map((cat) => (
              <span key={cat.name} className="px-2 py-0.5 bg-red-500/30 rounded-full text-xs text-red-200">
                {cat.name} {((cat.value / (cat.budget_limit || 1)) * 100).toFixed(0)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {activeTab === "dashboard" && (
          <div className="p-4 space-y-4">
            {/* Main Balance */}
            <div className={`rounded-3xl p-6 ${isHealthy ? "bg-gradient-to-br from-green-600 to-green-700" : "bg-gradient-to-br from-red-600 to-red-700"}`}>
              <p className="text-white/80 text-sm mb-1">Quanto podes gastar</p>
              <p className="text-5xl font-bold">{balance.toFixed(2)}€</p>
              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-1">
                  <span className="text-green-200 text-sm">+{totalIncome.toFixed(0)}€</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-red-200 text-sm">-{totalExpense.toFixed(0)}€</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <p className="text-slate-400 text-xs">Receitas</p>
                <p className="text-green-400 text-xl font-bold">+{totalIncome.toFixed(2)}€</p>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <p className="text-slate-400 text-xs">Despesas</p>
                <p className="text-red-400 text-xl font-bold">-{totalExpense.toFixed(2)}€</p>
              </div>
            </div>

            {/* Goals Preview */}
            {goals.length > 0 && (
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold">Metas</h3>
                  </div>
                  <Link href="/dashboard/goals" className="text-blue-400 text-sm">Ver todas</Link>
                </div>
                <div className="space-y-2">
                  {goals.slice(0, 2).map((goal) => (
                    <div key={goal.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{goal.name}</span>
                        <span className="text-slate-400">{Number(goal.current_amount).toFixed(0)}€ / {Number(goal.target_amount).toFixed(0)}€</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions */}
            <div className="bg-slate-800/50 rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Transações</h3>
              {filteredTransactions.length === 0 ? (
                <p className="text-slate-400 text-center py-4 text-sm">Sem transações este mês</p>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex justify-between items-center py-2 border-b border-slate-700/50 last:border-0">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{t.description || t.category?.name || "Sem descrição"}</p>
                        <p className="text-xs text-slate-400">{new Date(t.date).toLocaleDateString("pt-PT")}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={t.type === "income" ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                          {t.type === "income" ? "+" : "-"}{Number(t.amount).toFixed(2)}€
                        </span>
                        <button onClick={() => setEditingTransaction({ ...t, amount: t.amount.toString() })} className="p-1 hover:bg-slate-700 rounded">
                          <Edit2 className="w-3 h-3 text-slate-400" />
                        </button>
                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 hover:bg-slate-700 rounded">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categories */}
            {expenseByCategory.length > 0 && (
              <div className="bg-slate-800/50 rounded-2xl p-4">
                <h3 className="font-semibold mb-3">Por categoria</h3>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={30} outerRadius={60} dataKey="value">
                        {expenseByCategory.map((entry, index) => (
                          <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }} formatter={(value) => `${Number(value).toFixed(2)}€`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {expenseByCategory.slice(0, 4).map((cat, i) => (
                    <div key={cat.name} className="flex items-center gap-1 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || COLORS[i] }} />
                      <span className="text-slate-300">{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "add" && (
          <div className="p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-slate-800/50 rounded-3xl p-6">
              <h2 className="text-xl font-bold text-center mb-6">Nova Transação</h2>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewTransaction({ ...newTransaction, type: "expense" })} className={`flex-1 py-3 rounded-xl font-medium transition-all ${newTransaction.type === "expense" ? "bg-red-500 text-white" : "bg-slate-700 text-slate-300"}`}>Despesa</button>
                  <button type="button" onClick={() => setNewTransaction({ ...newTransaction, type: "income" })} className={`flex-1 py-3 rounded-xl font-medium transition-all ${newTransaction.type === "income" ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300"}`}>Receita</button>
                </div>
                <div className="relative">
                  <input type="number" step="0.01" placeholder="0,00" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} className="w-full p-4 bg-slate-700 border-2 border-transparent rounded-xl text-center text-3xl font-bold focus:outline-none focus:border-blue-500" autoFocus required />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">€</span>
                </div>
                <input type="text" placeholder="Descrição (opcional)" value={newTransaction.description || ""} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl" />
                <select value={newTransaction.category_id} onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl" required>
                  <option value="">Selecionar categoria</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg transition-all active:scale-95">Guardar</button>
              </form>
            </motion.div>

            <AnimatePresence>
              {showSuccess && (
                <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
                  <div className="bg-green-500 rounded-full p-8">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === "goals" && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Metas</h2>
              <Link href="/dashboard/goals" className="text-blue-400 text-sm">Gerir</Link>
            </div>
            {goals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Sem metas ainda</p>
                <Link href="/dashboard/goals" className="text-blue-400 text-sm">Criar primeira meta</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => {
                  const progress = Number(goal.current_amount) / Number(goal.target_amount);
                  const isCompleted = progress >= 1;
                  return (
                    <div key={goal.id} className={`bg-slate-800/50 rounded-2xl p-4 ${isCompleted ? "border-2 border-green-500" : ""}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{goal.name}</h3>
                          <p className="text-xs text-slate-400">{Number(goal.current_amount).toFixed(0)}€ de {Number(goal.target_amount).toFixed(0)}€</p>
                        </div>
                        <span className={`text-2xl font-bold ${isCompleted ? "text-green-400" : "text-purple-400"}`}>{(progress * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`} style={{ width: `${Math.min(progress * 100, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-4 py-2">
        <div className="flex justify-around items-center">
          <button onClick={() => setActiveTab("dashboard")} className={`flex flex-col items-center p-2 ${activeTab === "dashboard" ? "text-blue-400" : "text-slate-400"}`}>
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button onClick={() => setActiveTab("add")} className={`flex flex-col items-center p-2 ${activeTab === "add" ? "text-blue-400" : "text-slate-400"}`}>
            <div className={`w-14 h-14 -mt-8 rounded-full flex items-center justify-center ${activeTab === "add" ? "bg-blue-500" : "bg-slate-700"}`}>
              <Plus className="w-8 h-8" />
            </div>
          </button>
          <button onClick={() => setActiveTab("goals")} className={`flex flex-col items-center p-2 ${activeTab === "goals" ? "text-blue-400" : "text-slate-400"}`}>
            <Target className="w-6 h-6" />
            <span className="text-xs mt-1">Metas</span>
          </button>
        </div>
      </nav>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingTransaction(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-slate-800 rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">Editar Transação</h2>
              <form onSubmit={handleUpdateTransaction} className="space-y-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingTransaction({ ...editingTransaction, type: "expense" })} className={`flex-1 py-3 rounded-xl font-medium ${editingTransaction.type === "expense" ? "bg-red-500 text-white" : "bg-slate-700 text-slate-300"}`}>Despesa</button>
                  <button type="button" onClick={() => setEditingTransaction({ ...editingTransaction, type: "income" })} className={`flex-1 py-3 rounded-xl font-medium ${editingTransaction.type === "income" ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300"}`}>Receita</button>
                </div>
                <input type="number" step="0.01" placeholder="0,00€" value={editingTransaction.amount} onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })} className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl text-center text-2xl font-bold" required />
                <input type="text" placeholder="Descrição (opcional)" value={editingTransaction.description || ""} onChange={(e) => setEditingTransaction({ ...editingTransaction, description: e.target.value })} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl" />
                <select value={editingTransaction.category_id} onChange={(e) => setEditingTransaction({ ...editingTransaction, category_id: e.target.value })} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl" required>
                  <option value="">Selecionar categoria</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">Guardar</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
