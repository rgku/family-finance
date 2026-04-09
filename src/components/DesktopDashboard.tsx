"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Plus, TrendingUp, TrendingDown, Target, Download, Settings, Home, CreditCard, PieChart, ChevronLeft, ChevronRight, AlertTriangle, Edit2, Trash2 } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { Transaction, TransactionType } from "@/types";

interface TransactionFormData {
  id: string;
  amount: string;
  category_id: string;
  type: TransactionType;
  description: string;
}

const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B", "#EC4899", "#22C55E", "#6B7280"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

interface DesktopDashboardProps {
  isMobile?: boolean;
}

export default function DesktopDashboard({ isMobile }: DesktopDashboardProps) {
  const { transactions, categories, goals, fetchTransactions, fetchCategories, fetchGoals, addTransaction, deleteTransaction, updateTransaction, subscribeToRealtime } = useStore();
  const [activePage, setActivePage] = useState<"dashboard" | "transactions" | "goals" | "settings">("dashboard");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [newTransaction, setNewTransaction] = useState({ amount: "", category_id: "", type: "expense" as TransactionType, description: "" });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionFormData | null>(null);

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

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(selectedYear, selectedMonth - 5 + i, 1);
    const monthTransactions = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    });
    const income = monthTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = monthTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Number(t.amount), 0);
    return { month: MONTHS[month.getMonth()].slice(0, 3), income, expense };
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.category_id) return;
    const amount = Number(newTransaction.amount);
    if (!amount || amount <= 0) return;
    await addTransaction({
      user_id: "demo-user",
      category_id: newTransaction.category_id,
      amount,
      description: newTransaction.description?.trim() || "",
      type: newTransaction.type,
      date: new Date(selectedYear, selectedMonth, new Date().getDate()).toISOString(),
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 1500);
    setNewTransaction({ amount: "", category_id: "", type: "expense", description: "" });
    setShowAddModal(false);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Tens a certeza que queres eliminar esta transação?")) {
      await deleteTransaction(id);
    }
  };

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;
    const amount = Number(editingTransaction.amount);
    if (!amount || amount <= 0) return;
    await updateTransaction(editingTransaction.id, {
      amount,
      category_id: editingTransaction.category_id,
      description: editingTransaction.description?.trim() || "",
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

  const SidebarItem = ({ icon: Icon, label, page }: { icon: any; label: string; page: typeof activePage }) => (
    <button
      onClick={() => setActivePage(page)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${activePage === page ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800/50 border-r border-slate-700 p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Family Finance</h1>
        </div>
        <nav className="flex-1 space-y-2">
          <SidebarItem icon={Home} label="Dashboard" page="dashboard" />
          <SidebarItem icon={CreditCard} label="Transações" page="transactions" />
          <SidebarItem icon={Target} label="Metas" page="goals" />
          <SidebarItem icon={Settings} label="Definições" page="settings" />
        </nav>
        <button onClick={() => setShowAddModal(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> Nova Transação
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-800 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xl font-semibold">{MONTHS[selectedMonth]} {selectedYear}</span>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-800 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg">
              <Download className="w-5 h-5" /> Exportar
            </button>
            <AnimatePresence>
              {showExportMenu && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-full mt-2 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-50">
                  <button onClick={exportToPDF} className="block w-full px-4 py-2 text-left hover:bg-slate-700">Exportar PDF</button>
                  <button onClick={exportToExcel} className="block w-full px-4 py-2 text-left hover:bg-slate-700">Exportar Excel</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Budget Alerts */}
        {budgetAlerts.length > 0 && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="font-semibold text-red-400">Atenção: Orçamentos em risco</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {budgetAlerts.map((cat) => (
                <span key={cat.name} className="px-3 py-1 bg-red-500/30 rounded-full text-sm text-red-200">
                  {cat.name}: {((cat.value / (cat.budget_limit || 1)) * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          </div>
        )}

        {activePage === "dashboard" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Balance Card */}
            <div className={`col-span-2 rounded-2xl p-8 ${isHealthy ? "bg-gradient-to-br from-green-600 to-green-700" : "bg-gradient-to-br from-red-600 to-red-700"}`}>
              <p className="text-white/80 text-lg mb-2">Quanto podes gastar</p>
              <p className="text-7xl font-bold">{balance.toFixed(2)}€</p>
              <div className="flex gap-8 mt-6">
                <div>
                  <p className="text-green-200 text-sm">Receitas</p>
                  <p className="text-2xl font-bold">+{totalIncome.toFixed(2)}€</p>
                </div>
                <div>
                  <p className="text-red-200 text-sm">Despesas</p>
                  <p className="text-2xl font-bold">-{totalExpense.toFixed(2)}€</p>
                </div>
              </div>
            </div>

            {/* Goals Card */}
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Metas</h3>
                <Link href="/dashboard/goals" className="text-blue-400 text-sm">Ver todas</Link>
              </div>
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal) => {
                  const targetAmount = Number(goal.target_amount);
                  const progress = targetAmount > 0 ? Number(goal.current_amount) / targetAmount : 0;
                  return (
                    <div key={goal.id}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{goal.name}</span>
                        <span className="text-slate-400">{(progress * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${progress >= 1 ? "bg-green-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`} style={{ width: `${Math.min(progress * 100, 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
                {goals.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Sem metas ainda</p>}
              </div>
            </div>

            {/* Expenses by Category */}
            <div className="bg-slate-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Gastos por Categoria</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={expenseByCategory} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name }) => name}>
                      {expenseByCategory.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }} formatter={(value) => `${Number(value).toFixed(2)}€`} />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Chart */}
            <div className="col-span-2 bg-slate-800/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Evolução Mensal</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }} />
                    <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activePage === "transactions" && (
          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Transações</h3>
            <div className="space-y-2">
              {filteredTransactions.length === 0 ? (
                <p className="text-slate-400 text-center py-8">Sem transações este mês</p>
              ) : (
                filteredTransactions.map((t) => (
                  <div key={t.id} className="flex justify-between items-center py-3 border-b border-slate-700/50 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium">{t.description || t.category?.name || "Sem descrição"}</p>
                      <p className="text-sm text-slate-400">{new Date(t.date).toLocaleDateString("pt-PT")}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold ${t.type === "income" ? "text-green-400" : "text-red-400"}`}>
                        {t.type === "income" ? "+" : "-"}{Number(t.amount).toFixed(2)}€
                      </span>
                      <button onClick={() => setEditingTransaction({ ...t, amount: t.amount.toString() })} className="p-1 hover:bg-slate-700 rounded" aria-label="Editar transação">
                        <Edit2 className="w-4 h-4 text-slate-400" />
                      </button>
                      <button onClick={() => handleDeleteTransaction(t.id)} className="p-1 hover:bg-slate-700 rounded" aria-label="Eliminar transação">
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activePage === "goals" && (
          <div className="bg-slate-800/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Metas</h3>
              <Link href="/dashboard/goals" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">Gerir Metas</Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {goals.map((goal) => {
                const targetAmount = Number(goal.target_amount);
                const progress = targetAmount > 0 ? Number(goal.current_amount) / targetAmount : 0;
                return (
                  <div key={goal.id} className="bg-slate-700/50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{goal.name}</h4>
                      <span className={`text-2xl font-bold ${progress >= 1 ? "text-green-400" : "text-purple-400"}`}>{(progress * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{Number(goal.current_amount).toFixed(0)}€ / {Number(goal.target_amount).toFixed(0)}€</p>
                    <div className="h-3 bg-slate-600 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${progress >= 1 ? "bg-green-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`} style={{ width: `${Math.min(progress * 100, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && <p className="text-slate-400 col-span-2 text-center py-8">Sem metas ainda</p>}
            </div>
          </div>
        )}

        {activePage === "settings" && (
          <div className="bg-slate-800/50 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Definições</h3>
            <Link href="/dashboard/settings" className="block py-3 border-b border-slate-700/50 hover:bg-slate-700/50 rounded-lg px-4">
              Gerir Categorias e Metas →
            </Link>
          </div>
        )}
      </main>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-md bg-slate-800 rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6">Nova Transação</h2>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="flex gap-2">
                  <button type="button" onClick={() => setNewTransaction({ ...newTransaction, type: "expense" })} className={`flex-1 py-3 rounded-xl font-medium ${newTransaction.type === "expense" ? "bg-red-500 text-white" : "bg-slate-700 text-slate-300"}`}>Despesa</button>
                  <button type="button" onClick={() => setNewTransaction({ ...newTransaction, type: "income" })} className={`flex-1 py-3 rounded-xl font-medium ${newTransaction.type === "income" ? "bg-green-500 text-white" : "bg-slate-700 text-slate-300"}`}>Receita</button>
                </div>
                <input type="number" step="0.01" placeholder="0,00€" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} className="w-full p-4 bg-slate-700 border border-slate-600 rounded-xl text-center text-2xl font-bold" required />
                <input type="text" placeholder="Descrição (opcional)" value={newTransaction.description || ""} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl" />
                <select value={newTransaction.category_id} onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })} className="w-full p-3 bg-slate-700 border border-slate-600 rounded-xl" required>
                  <option value="">Selecionar categoria</option>
                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                </select>
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold">Guardar</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Transaction Modal */}
      <AnimatePresence>
        {editingTransaction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setEditingTransaction(null)}>
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

      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="fixed inset-0 flex items-center justify-center z-[60] pointer-events-none">
            <div className="bg-green-500 rounded-full p-8"><svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
