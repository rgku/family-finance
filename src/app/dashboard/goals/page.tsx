"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import { Plus, X, Trash2, Target, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function GoalsPage() {
  const { goals, fetchGoals, addGoal, updateGoal, deleteGoal } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [contributingGoal, setContributingGoal] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [newGoal, setNewGoal] = useState({ name: "", target_amount: "", deadline: "" });

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    await addGoal({
      family_id: "demo",
      name: newGoal.name,
      target_amount: Number(newGoal.target_amount),
      deadline: newGoal.deadline || null,
    });
    setShowModal(false);
    setNewGoal({ name: "", target_amount: "", deadline: "" });
  };

  const handleContribute = async () => {
    if (!contributingGoal || !contributionAmount) return;
    
    const goal = goals.find((g) => g.id === contributingGoal);
    if (!goal) return;

    const newAmount = Number(goal.current_amount) + Number(contributionAmount);
    await updateGoal(contributingGoal, newAmount);
    
    setContributingGoal(null);
    setContributionAmount("");
    fetchGoals();
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm("Tens a certeza que queres eliminar esta meta?")) {
      await deleteGoal(id);
    }
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return "Sem prazo";
    const date = new Date(deadline);
    const now = new Date();
    const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return "Expirado";
    if (daysLeft === 0) return "Expires hoje";
    return `${daysLeft} dias restantes`;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="p-1 hover:bg-slate-700 rounded-lg">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold">Metas Partilhadas</h1>
            </div>
            <button onClick={() => setShowModal(true)} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Sem metas ainda</p>
            <p className="text-sm text-slate-500">Cria a tua primeira meta!</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = Number(goal.current_amount) / Number(goal.target_amount);
            const isCompleted = progress >= 1;
            
            return (
              <div key={goal.id} className={`bg-slate-800/50 rounded-2xl p-4 ${isCompleted ? "border-2 border-green-500" : ""}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{goal.name}</h3>
                    <p className="text-sm text-slate-400">{formatDeadline(goal.deadline)}</p>
                  </div>
                  <button onClick={() => handleDeleteGoal(goal.id)} className="p-2 hover:bg-slate-700 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{Number(goal.current_amount).toFixed(2)}€</span>
                    <span className="text-slate-400">{Number(goal.target_amount).toFixed(2)}€</span>
                  </div>
                  <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}
                      style={{ width: `${Math.min(progress * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-right text-sm text-slate-400 mt-1">
                    {(progress * 100).toFixed(0)}%
                  </p>
                </div>

                {!isCompleted && (
                  <div className="flex gap-2">
                    {contributingGoal === goal.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="number"
                          placeholder="Valor"
                          value={contributionAmount}
                          onChange={(e) => setContributionAmount(e.target.value)}
                          className="flex-1 p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm"
                        />
                        <button onClick={handleContribute} className="px-4 bg-green-600 rounded-lg text-sm font-medium">
                          ✓
                        </button>
                        <button onClick={() => { setContributingGoal(null); setContributionAmount(""); }} className="px-3 bg-slate-600 rounded-lg text-sm">
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setContributingGoal(goal.id)}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium"
                      >
                        Contribuir
                      </button>
                    )}
                  </div>
                )}

                {isCompleted && (
                  <div className="text-center py-2 bg-green-500/20 rounded-lg text-green-400 font-medium">
                    🎉 Meta atingida!
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex md:items-center justify-center"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full md:w-auto md:max-w-md bg-slate-800 rounded-t-2xl md:rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Nova Meta</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">
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
                    placeholder="Ex: Férias, Fundo de Emergência"
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
