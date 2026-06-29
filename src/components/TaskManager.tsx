import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Trash2,
  Cpu,
  Calendar,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  Gauge,
  Sliders,
  Shield,
  HelpCircle,
  Volume2
} from "lucide-react";
import { Task, SubTask } from "../types";
import confetti from "canvas-confetti";

interface TaskManagerProps {
  tasks: Task[];
  onAddTask: (
    title: string,
    category: Task["category"],
    priority: Task["priority"],
    deadline: string,
    friction?: {
      missingSupplies?: boolean;
      highCognitive?: boolean;
      timeConsuming?: boolean;
      lowEnergy?: boolean;
    }
  ) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onToggleTask: (taskId: string) => void;
  onGeneratePlan: (taskId: string) => Promise<void>;
  loadingPlans: { [taskId: string]: boolean };
  onOptimizeLanes?: () => void;
  isOptimizingLanes?: boolean;
}

export default function TaskManager({
  tasks,
  onAddTask,
  onDeleteTask,
  onToggleSubtask,
  onToggleTask,
  onGeneratePlan,
  loadingPlans,
  onOptimizeLanes,
  isOptimizingLanes = false,
}: TaskManagerProps) {
  // Input fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Task["category"]>("work");
  const [priority, setPriority] = useState<Task["priority"]>("high");
  const [deadline, setDeadline] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  // Friction checkboxes states
  const [missingSupplies, setMissingSupplies] = useState(false);
  const [highCognitive, setHighCognitive] = useState(false);
  const [timeConsuming, setTimeConsuming] = useState(false);
  const [lowEnergy, setLowEnergy] = useState(false);

  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);

  // Focus Core Interactive Timer (Pomodoro)
  const [timeLeft, setTimeLeft] = useState(1500); // 25 mins
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Web Audio Binaural soundscape states and references
  const [soundType, setSoundType] = useState<"off" | "alpha" | "theta">("off");
  const [binauralVolume, setBinauralVolume] = useState(0.3);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscLRef = useRef<OscillatorNode | null>(null);
  const oscRRef = useRef<OscillatorNode | null>(null);
  const gainLRef = useRef<GainNode | null>(null);
  const gainRRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const startBinaural = (type: "alpha" | "theta") => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      stopBinaural();

      const oscL = ctx.createOscillator();
      const oscR = ctx.createOscillator();
      const gainL = ctx.createGain();
      const gainR = ctx.createGain();
      const masterGain = ctx.createGain();

      if (type === "alpha") {
        oscL.frequency.value = 200; // Left channel: 200 Hz
        oscR.frequency.value = 210; // Right channel: 210 Hz (Alpha = 10 Hz difference)
      } else {
        oscL.frequency.value = 150; // Left channel: 150 Hz
        oscR.frequency.value = 156; // Right channel: 156 Hz (Theta = 6 Hz difference)
      }

      const merger = ctx.createChannelMerger(2);
      oscL.connect(gainL).connect(merger, 0, 0);
      oscR.connect(gainR).connect(merger, 0, 1);
      merger.connect(masterGain).connect(ctx.destination);

      gainL.gain.value = 0.5;
      gainR.gain.value = 0.5;
      masterGain.gain.value = binauralVolume;

      oscL.start();
      oscR.start();

      oscLRef.current = oscL;
      oscRRef.current = oscR;
      gainLRef.current = gainL;
      gainRRef.current = gainR;
      masterGainRef.current = masterGain;
    } catch (e) {
      console.error("Failed to start Web Audio Binaural Soundscape: ", e);
    }
  };

  const stopBinaural = () => {
    if (oscLRef.current) {
      try { oscLRef.current.stop(); } catch (e) {}
      oscLRef.current.disconnect();
      oscLRef.current = null;
    }
    if (oscRRef.current) {
      try { oscRRef.current.stop(); } catch (e) {}
      oscRRef.current.disconnect();
      oscRRef.current = null;
    }
    if (gainLRef.current) {
      gainLRef.current.disconnect();
      gainLRef.current = null;
    }
    if (gainRRef.current) {
      gainRRef.current.disconnect();
      gainRRef.current = null;
    }
    if (masterGainRef.current) {
      masterGainRef.current.disconnect();
      masterGainRef.current = null;
    }
  };

  const handleSelectSound = (type: "off" | "alpha" | "theta") => {
    setSoundType(type);
    if (type === "off") {
      stopBinaural();
    } else {
      startBinaural(type);
    }
  };

  const handleVolumeChange = (vol: number) => {
    setBinauralVolume(vol);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = vol;
    }
  };

  // Safe release of AudioContext
  useEffect(() => {
    return () => {
      stopBinaural();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Sync AudioContext state with Timer running state
  useEffect(() => {
    if (timerRunning) {
      if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume();
      }
      if (soundType !== "off") {
        startBinaural(soundType);
      }
    } else {
      stopBinaural();
    }
  }, [timerRunning]);

  // AI Focus Assistant advice state
  const [adviceText, setAdviceText] = useState("Establishing tactical neural focus lock. Select an objective to defuse.");
  const [isSynthesizingAdvice, setIsSynthesizingAdvice] = useState(false);

  // Filter tasks into priority-based cognitive lanes
  const criticalTasks = tasks.filter((t) => t.priority === "high");
  const highTasks = tasks.filter((t) => t.priority === "medium");
  const laterTasks = tasks.filter((t) => t.priority === "low");

  // Automatically determine a default active focus task if none selected
  const activeFocusTask = tasks.find((t) => t.id === activeFocusTaskId) || tasks.find((t) => !t.completed) || tasks[0];

  // Pomodoro countdown timer logic
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimerRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Trigger victory alarm confetti!
            confetti({
              particleCount: 150,
              spread: 90,
              colors: ["#ec4899", "#818cf8", "#34d399"]
            });
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning]);

  // Dynamically retrieve tactical tips for active tasks
  const handleGetAITip = async () => {
    if (!activeFocusTask) return;
    setIsSynthesizingAdvice(true);
    try {
      const response = await fetch("/api/gemini/motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle: activeFocusTask.title,
          deadline: activeFocusTask.deadline,
          mode: "practical"
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setAdviceText(data.text);
      } else {
        setAdviceText("Concentrate on the first action. Clear all browser tabs and focus on 15 minutes of solid output.");
      }
    } catch (e) {
      setAdviceText("Block distractions. Break the task down to one subtask and execute without hesitation.");
    } finally {
      setIsSynthesizingAdvice(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please specify what needs to be slayed.");
      return;
    }
    if (!deadline) {
      setError("A deadline timestamp is required to calibrate momentum.");
      return;
    }

    onAddTask(title.trim(), category, priority, deadline, {
      missingSupplies,
      highCognitive,
      timeConsuming,
      lowEnergy,
    });
    setTitle("");
    setDeadline("");
    setMissingSupplies(false);
    setHighCognitive(false);
    setTimeConsuming(false);
    setLowEnergy(false);
    setIsAdding(false);
    setError("");

    // Spark confetti
    confetti({
      particleCount: 30,
      angle: 70,
      spread: 60,
      origin: { x: 0 },
      colors: ["#22d3ee", "#818cf8"]
    });
  };

  const getCategoryEmoji = (cat: Task["category"]) => {
    switch (cat) {
      case "work": return "💼";
      case "study": return "📚";
      case "health": return "🥗";
      case "life": return "🪴";
      case "bills": return "💵";
      default: return "🎯";
    }
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainingSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 relative overflow-hidden">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">Cognitive Priority Lanes</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Segment task priority and engage high-fidelity hyper-focus structures.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* 🔮 AI Lane Optimizer button */}
          {onOptimizeLanes && tasks.filter(t => !t.completed).length > 0 && (
            <button
              onClick={onOptimizeLanes}
              disabled={isOptimizingLanes}
              className={`py-3 px-5 rounded-2xl font-mono text-xs font-bold uppercase transition-all duration-300 transform-gpu active:scale-95 border flex items-center space-x-1.5 shadow-lg ${
                isOptimizingLanes
                  ? "bg-indigo-950/80 border-indigo-500/50 text-indigo-300 animate-pulse"
                  : "bg-indigo-950 border-indigo-500/30 hover:border-indigo-500 hover:bg-indigo-900/40 text-indigo-400"
              }`}
              title="Intelligently reprioritize all outstanding tasks and defuse friction blockers with AI"
            >
              <Cpu className={`w-4 h-4 ${isOptimizingLanes ? "animate-spin" : "text-indigo-400"}`} />
              <span>{isOptimizingLanes ? "Reprioritizing..." : "🔮 AI Calibrate Lanes"}</span>
            </button>
          )}

          {/* Add task button */}
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-white font-mono text-xs font-semibold py-3 px-5 rounded-2xl shadow-lg transition-all duration-300 transform-gpu flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? "CANCEL" : "SCHEDULE TASK"}</span>
          </button>
        </div>
      </div>

      {/* Slide down Task Add Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: "auto", scale: 1 }}
            exit={{ opacity: 0, height: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-[#0f172a]/80 border border-cyan-500/20 backdrop-blur-md rounded-3xl p-6 space-y-4 shadow-xl relative">
              <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-2">
                    Task Title / Mission Objective
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setError("");
                    }}
                    placeholder="e.g., Complete computer systems report..."
                    className="w-full bg-[#1e293b]/50 border border-gray-700 focus:border-cyan-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none text-white placeholder-gray-500 transition-all duration-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-2">
                    Deadline Time
                  </label>
                  <input
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => {
                      setDeadline(e.target.value);
                      setError("");
                    }}
                    className="w-full bg-[#1e293b]/50 border border-gray-700 focus:border-cyan-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none text-white transition-all duration-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-2">
                    Operational Field
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Task["category"])}
                    className="w-full bg-[#1e293b]/50 border border-gray-700 focus:border-cyan-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none text-white font-sans transition-all duration-300"
                  >
                    <option value="work">💼 Work / Corporate</option>
                    <option value="study">📚 Study / Research</option>
                    <option value="health">🥗 Health & Vigor</option>
                    <option value="life">🪴 Life Admin</option>
                    <option value="bills">💵 Payments & Bills</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-cyan-400 mb-2">
                    Urgency Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["high", "medium", "low"] as Task["priority"][]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 rounded-xl text-xs font-mono uppercase border transition-all duration-300 transform-gpu ${
                          priority === p
                            ? p === "high"
                              ? "bg-red-500/20 border-red-500 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                              : p === "medium"
                              ? "bg-amber-500/20 border-amber-500 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                              : "bg-blue-500/20 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                            : "bg-[#111827]/40 border-gray-800 text-gray-500 hover:border-gray-700"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Task Friction / Blockers Quick-Tap Profile */}
              <div className="bg-[#111827]/30 border border-gray-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                    🚧 Task Friction Profile (Quick-Tap Blockers)
                  </label>
                  <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                    Zero-writing smart tagging
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMissingSupplies(!missingSupplies)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all duration-300 ${
                      missingSupplies
                        ? "bg-amber-500/10 border-amber-500 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)] font-bold scale-[1.02]"
                        : "bg-slate-900/60 border-gray-800 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <span>🛠️</span>
                    <span>Missing Supplies (Need to Buy/Get)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHighCognitive(!highCognitive)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all duration-300 ${
                      highCognitive
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.15)] font-bold scale-[1.02]"
                        : "bg-slate-900/60 border-gray-800 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <span>🧠</span>
                    <span>High Brainpower (Needs Concepts/Logic)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeConsuming(!timeConsuming)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all duration-300 ${
                      timeConsuming
                        ? "bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-bold scale-[1.02]"
                        : "bg-slate-900/60 border-gray-800 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <span>⏳</span>
                    <span>Time Consuming</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLowEnergy(!lowEnergy)}
                    className={`py-2 px-3.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all duration-300 ${
                      lowEnergy
                        ? "bg-rose-500/10 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)] font-bold scale-[1.02]"
                        : "bg-slate-900/60 border-gray-800 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <span>🥱</span>
                    <span>Low Energy / Motivation Drain</span>
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-red-400 font-mono">⚠ {error}</p>}

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-mono text-xs font-bold rounded-2xl shadow-lg transition-all duration-300 transform-gpu flex items-center justify-center space-x-1 border-t border-white/10"
              >
                <CheckCircle className="w-4 h-4" />
                <span>CONFIRM TARGET DEPLOYMENT</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MISSION CRITICAL Banner & Focus Core Container (Pulsing keyframe animation) */}
      <AnimatePresence>
        {activeFocusTask && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className={`animate-ambient-glow rounded-3xl border bg-slate-950/90 p-6 md:p-8 relative z-10 transition-all duration-500 transform-gpu`}
          >
            {/* Top 'MISSION CRITICAL' banner label */}
            <div className="absolute top-0 left-8 -translate-y-1/2 bg-rose-600 text-white font-mono text-[9px] font-black tracking-widest px-3.5 py-1.5 rounded-full shadow-[0_0_15px_rgba(225,29,72,0.6)] uppercase flex items-center space-x-1.5">
              <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              <span>MISSION CRITICAL FOCUS CORE</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
              {/* Focus Task details */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center space-x-2.5">
                  <span className="text-xs py-1.5 px-3 bg-[#111827] rounded-xl border border-gray-800 flex items-center text-white">
                    <span className="mr-1.5">{getCategoryEmoji(activeFocusTask.category)}</span>
                    <span className="uppercase text-[9px] font-mono font-black tracking-widest text-gray-300">{activeFocusTask.category}</span>
                  </span>
                  <span className="text-[9px] font-mono font-black tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded uppercase">
                    ACTIVE INTEL
                  </span>
                </div>

                <h3 className="text-xl md:text-2xl font-extrabold tracking-tight text-white leading-tight">
                  {activeFocusTask.title}
                </h3>

                <p className="text-xs text-gray-400 font-mono flex items-center">
                  <Clock className="w-4 h-4 text-cyan-400 mr-1.5" />
                  <span>CRITICAL WINDOW: <strong className="text-rose-400 font-bold">{new Date(activeFocusTask.deadline).toLocaleString()}</strong></span>
                </p>

                {/* Web Audio Binaural Soundscapes Synthesizer */}
                <div className="mt-6 p-4 bg-[#111827]/40 border border-gray-800 rounded-2xl space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-800/85 pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white tracking-wide">Binaural Brainwave Synthesizer</h4>
                        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Web Audio API Active</p>
                      </div>
                    </div>

                    {soundType !== "off" && (
                      <div className="flex items-center space-x-1.5 px-2 py-0.5 bg-cyan-500/15 border border-cyan-500/30 rounded-full text-[8px] font-mono text-cyan-400 uppercase tracking-widest animate-pulse">
                        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-ping" />
                        <span>{soundType} beat active</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Select sound frequency */}
                    <div className="flex-1 space-y-1.5">
                      <span className="block text-[9px] font-mono text-gray-400 uppercase tracking-wider">Select Frequency Wave:</span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => handleSelectSound("off")}
                          className={`py-2 px-2.5 rounded-xl text-[10px] font-mono font-bold tracking-wider transition-all cursor-pointer ${
                            soundType === "off"
                              ? "bg-slate-800 border border-slate-700 text-white"
                              : "bg-[#1e293b]/30 border border-gray-800 text-gray-400 hover:text-white"
                          }`}
                        >
                          OFF
                        </button>
                        <button
                          onClick={() => handleSelectSound("alpha")}
                          className={`py-2 px-2.5 rounded-xl text-[10px] font-mono font-bold tracking-wider transition-all flex flex-col items-center justify-center cursor-pointer ${
                            soundType === "alpha"
                              ? "bg-indigo-600 border border-indigo-500 text-white shadow-md shadow-indigo-950/20"
                              : "bg-[#1e293b]/30 border border-gray-800 text-gray-400 hover:text-white"
                          }`}
                        >
                          <span>ALPHA</span>
                          <span className="text-[8px] font-light text-indigo-300">Learning (10Hz)</span>
                        </button>
                        <button
                          onClick={() => handleSelectSound("theta")}
                          className={`py-2 px-2.5 rounded-xl text-[10px] font-mono font-bold tracking-wider transition-all flex flex-col items-center justify-center cursor-pointer ${
                            soundType === "theta"
                              ? "bg-violet-600 border border-violet-500 text-white shadow-md shadow-violet-950/20"
                              : "bg-[#1e293b]/30 border border-gray-800 text-gray-400 hover:text-white"
                          }`}
                        >
                          <span>THETA</span>
                          <span className="text-[8px] font-light text-violet-300">Deep Work (6Hz)</span>
                        </button>
                      </div>
                    </div>

                    {/* Volume slider */}
                    <div className="w-full sm:w-1/3 space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] font-mono text-gray-400">
                        <span>VOLUME</span>
                        <span>{Math.round(binauralVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={binauralVolume}
                        onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                        disabled={soundType === "off"}
                        className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-30"
                      />
                    </div>
                  </div>

                  {soundType !== "off" && (
                    <div className="pt-1.5 border-t border-gray-800/40 flex items-center justify-between text-[9px] font-mono text-gray-400">
                      <span>🎧 Connect stereo headphones to perceive beats</span>
                      <div className="flex items-center space-x-1">
                        <span className="w-1 h-2.5 bg-indigo-500 animate-pulse rounded-full" />
                        <span className="w-1 h-4 bg-indigo-500 animate-pulse rounded-full" style={{ animationDelay: "150ms" }} />
                        <span className="w-1 h-3 bg-indigo-500 animate-pulse rounded-full" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* High-Fidelity Interactive Focus Timer */}
              <div className="bg-[#111827]/80 border border-gray-800 p-6 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="relative flex items-center justify-center w-28 h-28 mb-3">
                  {/* Glowing pulsing timer outline */}
                  <div className={`absolute inset-0 rounded-full border-2 ${timerRunning ? "border-rose-500 animate-ping opacity-25" : "border-indigo-500/30"} transition-colors duration-300`} />
                  <div className="absolute inset-2 rounded-full border border-gray-800 flex flex-col items-center justify-center bg-slate-950">
                    <span className="text-2xl font-black font-mono tracking-tight text-white">
                      {formatTimer(timeLeft)}
                    </span>
                    <span className="text-[8px] font-mono text-gray-500 tracking-widest uppercase">
                      {timerRunning ? "LOCKDOWN" : "STANDBY"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full">
                  <button
                    onClick={() => setTimerRunning(!timerRunning)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1 transition-all duration-300 transform-gpu active:scale-95 ${
                      timerRunning
                        ? "bg-amber-500/20 border border-amber-500/30 text-amber-200"
                        : "bg-rose-600 hover:bg-rose-500 text-white"
                    }`}
                  >
                    {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{timerRunning ? "PAUSE" : "START BLOCK"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setTimerRunning(false);
                      setTimeLeft(1500);
                    }}
                    className="p-2 bg-slate-900 border border-gray-800 text-gray-400 hover:text-white rounded-xl transition-all duration-300 transform-gpu active:scale-95"
                    title="Reset Clock"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid/Priority Lanes Layout Container */}
      <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch relative">
        {/* CRITICAL PRIORITY LANE - Always visible */}
        <div className="flex-1 min-w-0 flex flex-col transform-gpu lg:w-1/3">
          <div className="bg-[#0f172a]/50 border border-red-500/10 rounded-3xl p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/60">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <h3 className="text-xs font-mono font-black tracking-widest uppercase text-red-400">
                  CRITICAL IMPACT
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500">{criticalTasks.length} pending</span>
            </div>

            <div className="space-y-4 flex-1">
              {criticalTasks.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-mono text-[11px] uppercase border border-dashed border-gray-800 rounded-2xl">
                  🛡 No Immediate Threats
                </div>
              ) : (
                criticalTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={activeFocusTaskId === task.id}
                    onSelect={() => {
                      setActiveFocusTaskId(task.id);
                      handleGetAITip();
                    }}
                    onToggleTask={onToggleTask}
                    onDeleteTask={onDeleteTask}
                    onToggleSubtask={onToggleSubtask}
                    onGeneratePlan={onGeneratePlan}
                    loading={loadingPlans[task.id]}
                    getCategoryEmoji={getCategoryEmoji}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* HIGH PRIORITY LANE */}
        <div className="transform-gpu flex flex-col w-full lg:w-1/3">
          <div className="bg-[#0f172a]/50 border border-amber-500/10 rounded-3xl p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/60">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-xs font-mono font-black tracking-widest uppercase text-amber-400">
                  HIGH CALIBER
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500">{highTasks.length} pending</span>
            </div>

            <div className="space-y-4 flex-1">
              {highTasks.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-mono text-[11px] uppercase border border-dashed border-gray-800 rounded-2xl">
                  ☕ Standby Clear
                </div>
              ) : (
                highTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={activeFocusTaskId === task.id}
                    onSelect={() => {
                      setActiveFocusTaskId(task.id);
                      handleGetAITip();
                    }}
                    onToggleTask={onToggleTask}
                    onDeleteTask={onDeleteTask}
                    onToggleSubtask={onToggleSubtask}
                    onGeneratePlan={onGeneratePlan}
                    loading={loadingPlans[task.id]}
                    getCategoryEmoji={getCategoryEmoji}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* LATER/LOW PRIORITY LANE */}
        <div className="transform-gpu flex flex-col w-full lg:w-1/3">
          <div className="bg-[#0f172a]/50 border border-blue-500/10 rounded-3xl p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/60">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-xs font-mono font-black tracking-widest uppercase text-blue-400">
                  LATER BACKLOG
                </h3>
              </div>
              <span className="text-[10px] font-mono text-gray-500">{laterTasks.length} pending</span>
            </div>

            <div className="space-y-4 flex-1">
              {laterTasks.length === 0 ? (
                <div className="py-12 text-center text-gray-500 font-mono text-[11px] uppercase border border-dashed border-gray-800 rounded-2xl">
                  🌱 Backlog Clean
                </div>
              ) : (
                laterTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={activeFocusTaskId === task.id}
                    onSelect={() => {
                      setActiveFocusTaskId(task.id);
                      handleGetAITip();
                    }}
                    onToggleTask={onToggleTask}
                    onDeleteTask={onDeleteTask}
                    onToggleSubtask={onToggleSubtask}
                    onGeneratePlan={onGeneratePlan}
                    loading={loadingPlans[task.id]}
                    getCategoryEmoji={getCategoryEmoji}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Individual TaskCard Component with Micro-interactions and global hover transitions */
interface TaskCardProps {
  key?: string;
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onGeneratePlan: (taskId: string) => Promise<void>;
  loading: boolean;
  getCategoryEmoji: (cat: Task["category"]) => string;
}

function TaskCard({
  task,
  isSelected,
  onSelect,
  onToggleTask,
  onDeleteTask,
  onToggleSubtask,
  onGeneratePlan,
  loading,
  getCategoryEmoji
}: TaskCardProps) {
  const hasPlan = task.subtasks && task.subtasks.length > 0;
  const deadlineDate = new Date(task.deadline);
  const formattedDeadline = deadlineDate.toLocaleDateString() + " " + deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      onClick={onSelect}
      className={`task-card-glow group bg-slate-900/60 border rounded-2xl p-4 cursor-pointer transform-gpu relative overflow-hidden flex flex-col justify-between ${
        isSelected
          ? "border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          : "border-gray-800 hover:scale-[1.02] hover:shadow-lg hover:border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          {/* Completion Checkbox with Micro-interactions */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleTask(task.id);
            }}
            className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-300 transform-gpu active:scale-95 ${
              task.completed
                ? "bg-emerald-500 border-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                : "border-gray-700 hover:border-cyan-500/60"
            }`}
          >
            {task.completed && <CheckCircle className="w-3.5 h-3.5" />}
          </button>

          <div className="min-w-0">
            {/* Category & Priority Badge info */}
            <div className="flex flex-wrap gap-1.5 items-center">
              <span className="text-[9px] font-mono text-gray-400 bg-slate-950 px-1.5 py-0.5 rounded border border-gray-800 leading-none">
                {getCategoryEmoji(task.category)} {task.category.toUpperCase()}
              </span>
              {task.missingSupplies && (
                <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 leading-none flex items-center space-x-1">
                  <span>🛠️</span>
                  <span>Needs Supplies</span>
                </span>
              )}
              {task.highCognitive && (
                <span className="text-[9px] font-mono text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 leading-none flex items-center space-x-1">
                  <span>🧠</span>
                  <span>Concepts</span>
                </span>
              )}
              {task.timeConsuming && (
                <span className="text-[9px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20 leading-none flex items-center space-x-1">
                  <span>⏳</span>
                  <span>Time Consuming</span>
                </span>
              )}
              {task.lowEnergy && (
                <span className="text-[9px] font-mono text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 leading-none flex items-center space-x-1">
                  <span>🥱</span>
                  <span>Dreaded</span>
                </span>
              )}
            </div>

            {/* Task Title with Wiping line-through animation */}
            <h4
              className={`text-sm font-bold text-white mt-2 leading-snug font-sans wipe-line-through ${
                task.completed ? "struck" : ""
              }`}
            >
              {task.title}
            </h4>

            <p className="text-[10px] text-gray-500 font-mono mt-1 flex items-center">
              <Clock className="w-3 h-3 text-cyan-500 mr-1" />
              <span>{formattedDeadline}</span>
            </p>
          </div>
        </div>

        {/* Custom neon vector illustration inside the card */}
        <div className="flex-shrink-0">
          <svg
            key={task.completed ? "completed" : "pending"}
            className={`w-8 h-8 transition-all duration-300 ${
              task.completed
                ? "animate-pop-shrink text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                : "text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.35)] group-hover:drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]"
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <circle cx="12" cy="12" r="3" className={task.completed ? "fill-emerald-400" : "fill-indigo-500/20"} />
          </svg>
        </div>
      </div>

      {/* Subtask / Action list drawer */}
      {hasPlan && (
        <div className="mt-4 pt-3 border-t border-gray-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest">
              Tactical Steps
            </span>
            <span className="text-[9px] font-mono text-gray-500">
              {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
            </span>
          </div>

          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {task.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSubtask(task.id, subtask.id);
                }}
                className={`p-2 rounded-xl border text-[11px] flex items-center justify-between cursor-pointer transition-all duration-300 ${
                  subtask.completed
                    ? "bg-slate-950/40 border-emerald-500/10 text-gray-500"
                    : "bg-slate-950/20 border-gray-800/60 text-gray-300 hover:border-indigo-500/30"
                }`}
              >
                <span className={`truncate mr-2 ${subtask.completed ? "line-through" : ""}`}>
                  {subtask.title}
                </span>
                <span className="text-[9px] font-mono text-gray-500 bg-slate-950 px-1 py-0.5 rounded leading-none flex-shrink-0">
                  ⏳ {subtask.durationMinutes}m
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trigger Plan Generation */}
      {!hasPlan && !task.completed && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGeneratePlan(task.id);
          }}
          disabled={loading}
          className="mt-3 w-full py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-xl text-[10px] font-mono font-bold tracking-wider flex items-center justify-center space-x-1 transition-all duration-300 disabled:opacity-50"
        >
          <Cpu className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
          <span>{loading ? "SCHEDULING..." : "AI ATOMIC BREAKDOWN"}</span>
        </button>
      )}

      {/* Delete task button */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteTask(task.id);
          }}
          className="p-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 text-red-400 hover:text-red-300 rounded-lg transition-colors duration-300"
          title="Decommission Target"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
