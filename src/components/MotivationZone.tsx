import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Volume2, Cpu, RefreshCw, Zap, ShieldAlert, Heart, BrainCircuit } from "lucide-react";
import { Task } from "../types";

interface MotivationZoneProps {
  tasks: Task[];
  onSeekMotivation: (taskTitle: string, deadline: string, mode: string) => Promise<{ text: string; tip: string }>;
  onUnlockMotivationBadge: () => void;
}

const COACH_MODES = [
  {
    id: "overhype",
    name: "Hyper Hype-Man",
    description: "BEAST MODE. Zero chill. Lots of screaming, CAPS lock, and energy-drink energy.",
    icon: Zap,
    color: "from-amber-400 to-orange-600",
    bgAccent: "bg-orange-500/10 border-orange-500/20",
    textStyle: "text-orange-400",
    speechConfig: { rate: 1.35, pitch: 1.15 }
  },
  {
    id: "sugar-coated",
    name: "Fairy Godmother",
    description: "Warm grandmotherly cuddles. Warm tea. Thinks you are a gorgeous sparkling star.",
    icon: Heart,
    color: "from-pink-400 to-rose-600",
    bgAccent: "bg-rose-500/10 border-rose-500/20",
    textStyle: "text-rose-400",
    speechConfig: { rate: 0.95, pitch: 1.35 }
  },
  {
    id: "serious",
    name: "Drill Sergeant",
    description: "Military discipline. Consequences of weakness. Strict executive order. Stop whining.",
    icon: ShieldAlert,
    color: "from-red-500 to-rose-700",
    bgAccent: "bg-red-500/10 border-red-500/20",
    textStyle: "text-red-400",
    speechConfig: { rate: 0.88, pitch: 0.75 }
  },
  {
    id: "practical",
    name: "Systems Architect",
    description: "Psychology of resistance. Logical momentum. Break down starting friction scientifically.",
    icon: BrainCircuit,
    color: "from-cyan-400 to-indigo-600",
    bgAccent: "bg-cyan-500/10 border-cyan-500/20",
    textStyle: "text-cyan-400",
    speechConfig: { rate: 1.1, pitch: 1.0 }
  }
];

export default function MotivationZone({ tasks, onSeekMotivation, onUnlockMotivationBadge }: MotivationZoneProps) {
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [selectedMode, setSelectedMode] = useState("overhype");
  const [speechOutput, setSpeechOutput] = useState<{ text: string; tip: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Filter out completed tasks since they don't need motivation
  const pendingTasks = tasks.filter((t) => !t.completed);

  const handleAwakenCoach = async () => {
    let taskTitle = "General goals";
    let deadline = "ASAP";

    if (selectedTaskId) {
      const task = tasks.find((t) => t.id === selectedTaskId);
      if (task) {
        taskTitle = task.title;
        deadline = task.deadline;
      }
    }

    setLoading(true);
    setSpeechOutput(null);

    try {
      const result = await onSeekMotivation(taskTitle, deadline, selectedMode);
      setSpeechOutput(result);

      // Play voice automatically if desired
      setTimeout(() => {
        handleSpeak(result.text);
      }, 300);
    } catch (e) {
      console.error("Coach fell asleep: ", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = (text: string) => {
    if (!text || !('speechSynthesis' in window)) return;

    // Stop current speaking
    window.speechSynthesis.cancel();

    const modeObj = COACH_MODES.find((m) => m.id === selectedMode);
    const utterance = new SpeechSynthesisUtterance(text);
    
    if (modeObj) {
      utterance.rate = modeObj.speechConfig.rate;
      utterance.pitch = modeObj.speechConfig.pitch;
    }

    // Attempt to pick a fitting voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      if (selectedMode === "serious") {
        // Find deep masculine voice
        const maleVoice = voices.find((v) => v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david"));
        if (maleVoice) utterance.voice = maleVoice;
      } else if (selectedMode === "sugar-coated") {
        // Find sweet female voice
        const femaleVoice = voices.find((v) => v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("zira") || v.name.toLowerCase().includes("samantha"));
        if (femaleVoice) utterance.voice = femaleVoice;
      }
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    onUnlockMotivationBadge();
  };

  const activeMode = COACH_MODES.find((m) => m.id === selectedMode) || COACH_MODES[0];

  return (
    <div className="space-y-6">
      {/* Zone Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Psychological Defibrillator Zone</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Shatter starting friction and engage absolute focus with your dynamic AI coach.
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="coach"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Step 1: Config Parameters */}
          <div className="bg-[#0f172a]/70 border border-gray-800 rounded-3xl p-6 flex flex-col justify-between h-fit space-y-6">
            {/* Target Task */}
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-widest text-cyan-400">
                Step 1: Select Active Target
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full bg-[#1e293b]/50 border border-gray-700 focus:border-cyan-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none text-white font-sans"
              >
                <option value="">🎯 General Goals / Broad Intention</option>
                {pendingTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {getCategoryEmoji(t.category)} {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Coach Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase tracking-widest text-cyan-400">
                Step 2: Awaken Your Vibe Archetype
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {COACH_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`flex items-start space-x-3.5 p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        selectedMode === mode.id
                          ? "bg-[#1e293b]/80 border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.05)] text-white"
                          : "bg-[#111827]/40 border-gray-800 text-gray-400 hover:border-gray-700"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${mode.color} flex items-center justify-center text-white mt-0.5 shadow-sm`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold font-sans">{mode.name}</p>
                        <p className="text-[10px] text-gray-500 leading-normal mt-0.5">{mode.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Execute */}
            <button
              onClick={handleAwakenCoach}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1 border-t border-white/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                  <span>COACH ASSEMBLING PROFILES...</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-1 animate-pulse" />
                  <span>AWAKEN VOICE COACH</span>
                </>
              )}
            </button>
          </div>

          {/* Step 2: The Coach Speech Box */}
          <div className="lg:col-span-2 bg-[#0f172a]/70 border border-gray-800 rounded-3xl p-6 md:p-8 flex flex-col justify-between min-h-[380px] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />

            {/* Character visual indicator */}
            <div className="flex items-center space-x-3 pb-4 border-b border-gray-800/80">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${activeMode.color} flex items-center justify-center text-white shadow-lg`}>
                <activeMode.icon className="w-5 h-5 animate-bounce-slow" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-cyan-400">ACTIVE FREQUENCY</p>
                <h3 className="text-sm font-bold text-white">{activeMode.name}</h3>
              </div>

              {isSpeaking && (
                <div className="ml-auto flex items-center space-x-0.5">
                  <span className="w-1 h-3 bg-cyan-400 rounded-full animate-bar-1" />
                  <span className="w-1 h-5 bg-cyan-400 rounded-full animate-bar-2" />
                  <span className="w-1 h-4 bg-cyan-400 rounded-full animate-bar-3" />
                  <span className="w-1 h-2 bg-cyan-400 rounded-full animate-bar-4" />
                </div>
              )}
            </div>

            {/* Main output text */}
            <div className="flex-1 flex flex-col justify-center py-6">
              <AnimatePresence mode="wait">
                {speechOutput ? (
                  <motion.div
                    key={speechOutput.text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <p className={`text-base md:text-lg font-medium leading-relaxed font-sans italic ${activeMode.textStyle}`}>
                      "{speechOutput.text}"
                    </p>

                    <div className="p-4 bg-slate-900/40 border border-gray-800 rounded-2xl">
                      <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        <span>Immediate Friction Hack</span>
                      </p>
                      <p className="text-xs text-gray-300 font-sans leading-relaxed">
                        {speechOutput.tip}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="text-center text-gray-500 space-y-2 py-8">
                    <Cpu className="w-12 h-12 text-gray-700 mx-auto animate-pulse mb-3" />
                    <p className="text-xs font-mono uppercase tracking-wider">Coach Offline</p>
                    <p className="text-[11px] text-gray-600 max-w-xs mx-auto">
                      Configure your variables in the sidebar and tap "Awaken Voice Coach" to establish a direct telepathic line.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Audio controls */}
            {speechOutput && (
              <div className="pt-4 border-t border-gray-800/60 flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-500">
                  🗣 Browser Speech Engine: Web Speech API active
                </span>

                <button
                  onClick={() => handleSpeak(speechOutput.text)}
                  className="py-1.5 px-3.5 bg-[#111827] hover:bg-slate-800 border border-gray-800 hover:border-gray-700 text-white rounded-xl text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isSpeaking ? "REPLAY VOICE" : "SPEAK OUT LOUD"}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

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
