import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { QUIZ_QUESTIONS } from "../lib/quizQuestions";
import { UserPersonality } from "../types";
import { Compass, ChevronRight, Sparkles, Target } from "lucide-react";
import confetti from "canvas-confetti";

interface QuizProps {
  username: string;
  onComplete: (personality: UserPersonality, focusGoal: string) => void;
}

export default function Quiz({ username, onComplete }: QuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState<{ [key in UserPersonality]: number }>({
    [UserPersonality.SLACKER]: 0,
    [UserPersonality.PERFECTIONIST]: 0,
    [UserPersonality.OVERWHELMED]: 0,
    [UserPersonality.BALANCED]: 0,
  });
  const [focusGoal, setFocusGoal] = useState("");
  const [step, setStep] = useState<"quiz" | "goal">("quiz");

  const handleAnswer = (points: { [key in UserPersonality]: number }) => {
    const updatedScores = { ...scores };
    Object.keys(points).forEach((key) => {
      const p = key as UserPersonality;
      updatedScores[p] = (updatedScores[p] || 0) + (points[p] || 0);
    });
    setScores(updatedScores);

    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStep("goal");
    }
  };

  const handleFinish = () => {
    if (!focusGoal.trim()) return;

    // Find highest score personality
    let highestPersonality = UserPersonality.SLACKER;
    let highestScore = -1;

    Object.keys(scores).forEach((key) => {
      const p = key as UserPersonality;
      if (scores[p] > highestScore) {
        highestScore = scores[p];
        highestPersonality = p;
      }
    });

    // Trigger celebratory confetti!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#22d3ee", "#818cf8", "#a78bfa"]
    });

    onComplete(highestPersonality, focusGoal.trim());
  };

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];
  const progressPercent = ((currentIndex + 1) / QUIZ_QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xl relative z-10 bg-[#0f172a]/80 border border-gray-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl"
      >
        <div className="absolute -top-px left-12 right-12 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

        {step === "quiz" ? (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-2 text-indigo-400 font-mono text-xs uppercase tracking-widest">
                <Compass className="w-4 h-4 text-indigo-400 animate-spin-slow" />
                <span>Onboarding Diagnostic</span>
              </div>
              <span className="text-xs font-mono text-gray-400">
                Question {currentIndex + 1} of {QUIZ_QUESTIONS.length}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-800 h-1.5 rounded-full mb-8 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Question Text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="min-h-[220px] flex flex-col justify-between"
              >
                <h2 className="text-xl font-semibold tracking-tight font-sans text-white mb-6">
                  {currentQuestion.question}
                </h2>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option.points)}
                      className="w-full text-left bg-[#1e293b]/40 hover:bg-[#1e293b]/80 border border-gray-800 hover:border-indigo-500/40 px-5 py-4 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-indigo-500/30 font-sans text-gray-300 hover:text-white flex items-center justify-between group"
                    >
                      <span className="flex-1 pr-4">{option.text}</span>
                      <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Focus Alignment</h2>
              <p className="text-sm text-gray-400 mt-2">
                What is your absolute highest-priority goal or deadline this week?
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-widest text-indigo-400">
                Primary Mission Objective
              </label>
              <textarea
                value={focusGoal}
                onChange={(e) => setFocusGoal(e.target.value)}
                placeholder="e.g., Complete my college coding assignment before Sunday, prepare launch deck for VCs..."
                rows={3}
                className="w-full bg-[#1e293b]/50 border border-gray-700 focus:border-indigo-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-sans placeholder-gray-500 text-white resize-none"
              />
            </div>

            <button
              onClick={handleFinish}
              disabled={!focusGoal.trim()}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 border-t border-white/15"
            >
              <Sparkles className="w-4 h-4" />
              <span className="font-sans">CALIBRATE COMPANION ENGINE</span>
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
