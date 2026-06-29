export enum UserPersonality {
  SLACKER = "Slacker / Master Procrastinator",
  PERFECTIONIST = "Panicked Perfectionist",
  OVERWHELMED = "Overwhelmed Overachiever",
  BALANCED = "Balanced Builder"
}

export interface UserProfile {
  username: string;
  avatar: string;
  personality: UserPersonality | null;
  focusGoal: string;
  points: number;
  streak: number;
  lastActive: string; // ISO String
  completedQuiz: boolean;
  badges: string[]; // Badge ID list
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  durationMinutes: number;
  importance: "high" | "medium" | "low";
}

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO String
  category: "work" | "study" | "health" | "life" | "bills";
  priority: "high" | "medium" | "low";
  completed: boolean;
  completedAt?: string; // ISO String
  subtasks: SubTask[];
  difficulty: "atomic" | "moderate" | "epic";
  notes?: string;
  aiHack?: string; // AI generated quick start hack
  createdAt: string;
  missingSupplies?: boolean;
  highCognitive?: boolean;
  timeConsuming?: boolean;
  lowEnergy?: boolean;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
  unlockedAt?: string;
}

export interface ForumReply {
  id: string;
  authorName: string;
  avatarSeed: string;
  content: string;
  mode: string; // e.g. Speedy, Coach, Zen
  timestamp: string;
}

export interface ForumPost {
  id: string;
  authorName: string;
  avatarSeed: string;
  title: string;
  content: string;
  category: string;
  timestamp: string;
  likes: number;
  userLiked?: boolean;
  replies: ForumReply[];
}

export interface NotificationAlert {
  id: string;
  title: string;
  message: string;
  type: "deadline" | "streak" | "badge" | "motivation";
  timestamp: string;
  read: boolean;
}
