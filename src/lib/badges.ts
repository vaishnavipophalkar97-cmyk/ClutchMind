import { Badge } from "../types";

export const ALL_BADGES: Badge[] = [
  {
    id: "quiz_completed",
    title: "Self-Aware Slacker",
    description: "Completed the personality assessment quiz.",
    iconName: "Compass",
    color: "from-blue-500 to-indigo-600",
  },
  {
    id: "first_task",
    title: "First Spark",
    description: "Completed your first subtask or micro-action.",
    iconName: "Zap",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "ai_planner",
    title: "Micro-Architect",
    description: "Used AI to break down a terrifying task into micro-actions.",
    iconName: "Cpu",
    color: "from-purple-500 to-pink-600",
  },
  {
    id: "streak_3",
    title: "Momentum Machine",
    description: "Achieved a 3-day active streak.",
    iconName: "Flame",
    color: "from-red-500 to-rose-600",
  },
  {
    id: "motivation_seeker",
    title: "Vibe Explorer",
    description: "Requested AI motivation in at least two different coach modes.",
    iconName: "Sparkles",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "forum_active",
    title: "Crisis Comrade",
    description: "Posted your struggle on the Community Panic Board.",
    iconName: "MessageSquareText",
    color: "from-pink-500 to-fuchsia-600",
  },
  {
    id: "deadline_dodger",
    title: "Deadline Ninja",
    description: "Completed an epic task with high importance.",
    iconName: "ShieldAlert",
    color: "from-cyan-500 to-blue-600",
  }
];
