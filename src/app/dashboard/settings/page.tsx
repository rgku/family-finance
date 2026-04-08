"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { X, Plus, Edit2, Trash2, Palette, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ICONS = ["utensils", "car", "home", "heart", "film", "shopping-bag", "banknote", "more-horizontal", "zap", "book", "gift", "phone"];

const COLORS_PALETTE = [
  "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B", "#EC4899", "#22C55E", "#6B7280",
  "#14B8A6", "#6366F1", "#F97316", "#84CC16"
];

export default function SettingsPage() {
  const { categories, fetchCategories, addCategory, updateCategory, deleteCategory, goals, fetchGoals, addGoal, deleteGoal } = useStore();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [newCategory, setNewCategory] = useState({ name: "", color: "#10B981", icon: "folder", budget_limit: "" });
  const [newGoal, setNewGoal] = useState({ name: "", target_amount: "", deadline: "" });
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
    fetchGoals();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCategory({
      family_id: "demo",
      name: newCategory.name,
      color: newCategory.color,
      icon: newCategory.icon,
      budget_limit: newCategory.budget_limit ? Number(newCategory.budget_limit) : null,
    });
    setShowCategoryModal(false);
    setNewCategory({ name: "", color: "#10B981", icon: "folder", budget_limit: "" });
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    await updateCategory(editingCategory.id, {
      name: editingCategory.name,
      color: editingCategory.color,
      icon: editingCategory.icon,
      budget_limit: editingCategory.budget_limit ? Number(editingCategory.budget_limit) : null,
    });
    setEditingCategory(null);
    setShowCategoryModal(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (confirm("Tens a certeza que queres eliminar esta categoria?")) {
      await deleteCategory(id);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    await addGoal({
      family_id: "demo",
      name: newGoal.name,
      target_amount: Number(newGoal.target_amount),
      deadline: newGoal.deadline || null,
    });
    setShowGoalModal(false);
    setNewGoal({ name: "", target_amount: "", deadline: "" });
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm("Tens a certeza que queres eliminar esta meta?")) {
      await deleteGoal(id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-1 hover:bg-slate-700 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold">Definições</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div className="bg-slate-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Categorias</h2>
            <button onClick={() => setShowCategoryModal(true)} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: cat.color }}>
                    <span className="text-white text-xs font-bold">{cat.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    {cat.budget_limit && (
                      <p className="text-xs text-slate-400">Limite: {cat.budget_limit}€</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingCategory({ ...cat, budget_limit: cat.budget_limit?.toString() || "" }); setShowCategoryModal(true); }} className="p-2 hover:bg-slate-600 rounded-lg">
                    <Edit2 className="w-4 h-4 text-slate-400" />
                  </button>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 hover:bg-slate-600 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Metas</h2>
            <button onClick={() => setShowGoalModal(true)} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            {goals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium">{goal.name}</p>
                  <p className="text-xs text-slate-400">
                    {Number(goal.current_amount).toFixed(0)}€ / {Number(goal.target_amount).toFixed(0)}€
                  </p>
                </div>
                <div className="flex gap-1">
                  <div className="w-16 h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100)}%` }} />
                  </div>
                  <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 hover:bg-slate-600 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
            {goals.length === 0 && (
              <p className="text-slate-400 text-center py-4">Sem metas ainda</p>
            )}
          </div>
        </div>
      </main>

      <AnimatePresence>
        {(showCategoryModal || editingCategory) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full bg-slate-800 rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editingCategory ? "Editar Categoria" : "Nova Categoria"}</h2>
                <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} className="p-2 hover:bg-slate-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={editingCategory ? handleUpdateCategory : handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Nome</label>
                  <input
                    type="text"
                    value={editingCategory ? editingCategory.name : newCategory.name}
                    onChange={(e) => editingCategory ? setEditingCategory({ ...editingCategory, name: e.target.value }) : setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Cor</label>
                  <div className="flex flex-wrap gap-2">
                    {COLORS_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => editingCategory ? setEditingCategory({ ...editingCategory, color }) : setNewCategory({ ...newCategory, color })}
                        className={`w-8 h-8 rounded-full border-2 ${(editingCategory ? editingCategory.color : newCategory.color) === color ? "border-white" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Limite de Orçamento (€)</label>
                  <input
                    type="number"
                    value={editingCategory ? editingCategory.budget_limit : newCategory.budget_limit}
                    onChange={(e) => editingCategory ? setEditingCategory({ ...editingCategory, budget_limit: e.target.value }) : setNewCategory({ ...newCategory, budget_limit: e.target.value })}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    placeholder="Opcional"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  {editingCategory ? "Guardar Alterações" : "Criar Categoria"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGoalModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setShowGoalModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full bg-slate-800 rounded-t-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Nova Meta</h2>
                <button onClick={() => setShowGoalModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddGoal} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Nome da Meta</label>
                  <input
                    type="text"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    placeholder="Ex: Férias"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Valor Alvo (€)</label>
                  <input
                    type="number"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Deadline (opcional)</label>
                  <input
                    type="date"
                    value={newGoal.deadline}
                    onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                    className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                >
                  Criar Meta
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
