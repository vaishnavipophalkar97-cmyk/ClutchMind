/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, CheckSquare, Sparkles, MessagesSquare, Sun, Moon, Bell, LogOut, Brain, Zap } from "lucide-react";
import AuthPage from "./components/AuthPage";
import Quiz from "./components/Quiz";
import Dashboard from "./components/Dashboard";
import TaskManager from "./components/TaskManager";
import MotivationZone from "./components/MotivationZone";
import CommunityForum from "./components/CommunityForum";
import { UserProfile, Task, Badge, ForumPost, ForumReply, NotificationAlert, UserPersonality } from "./types";
import { SEED_FORUM_POSTS } from "./lib/seedData";
import confetti from "canvas-confetti";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, writeBatch } from "firebase/firestore";

export default function App() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks" | "motivation" | "community">("dashboard");

  // Firebase auth trace
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Core authenticated profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Dynamic state databases
  const [tasks, setTasks] = useState<Task[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPost[]>([]);
  const [notifications, setNotifications] = useState<NotificationAlert[]>([]);

  // Async load indicators
  const [loadingPlans, setLoadingPlans] = useState<{ [taskId: string]: boolean }>({});
  const [loadingReplies, setLoadingReplies] = useState<{ [postId: string]: boolean }>({});
  const [isOptimizingLanes, setIsOptimizingLanes] = useState(false);

  // Synchronize Auth and state with Firestore or Local Cache
  useEffect(() => {
    const cachedLocalUser = localStorage.getItem("cl_local_user");
    if (cachedLocalUser) {
      const parsed = JSON.parse(cachedLocalUser);
      setCurrentUser(parsed);
      setLoadingAuth(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // 1. Subscribe to User Profile
        const profileRef = doc(db, "users", user.uid);
        const profileUnsubscribe = onSnapshot(profileRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoadingAuth(false);
        });

        // 2. Subscribe to User Tasks
        const tasksRef = collection(db, "users", user.uid, "tasks");
        const tasksUnsubscribe = onSnapshot(tasksRef, (snap) => {
          const tasksList: Task[] = [];
          snap.forEach((doc) => {
            tasksList.push(doc.data() as Task);
          });
          tasksList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTasks(tasksList);
        });

        // 3. Subscribe to Notifications
        const notifRef = collection(db, "users", user.uid, "notifications");
        const notifUnsubscribe = onSnapshot(notifRef, (snap) => {
          const notifList: NotificationAlert[] = [];
          snap.forEach((doc) => {
            notifList.push(doc.data() as NotificationAlert);
          });
          setNotifications(notifList);
        });

        // 4. Subscribe to Shared Forum Posts
        const postsRef = collection(db, "posts");
        const postsUnsubscribe = onSnapshot(postsRef, async (snap) => {
          if (snap.empty) {
            const batch = writeBatch(db);
            SEED_FORUM_POSTS.forEach((post) => {
              const dRef = doc(db, "posts", post.id);
              batch.set(dRef, post);
            });
            await batch.commit();
          } else {
            const postsList: ForumPost[] = [];
            snap.forEach((doc) => {
              postsList.push(doc.data() as ForumPost);
            });
            postsList.sort((a, b) => b.id.localeCompare(a.id));
            setForumPosts(postsList);
          }
        });

        return () => {
          profileUnsubscribe();
          tasksUnsubscribe();
          notifUnsubscribe();
          postsUnsubscribe();
        };
      } else {
        const currentCached = localStorage.getItem("cl_local_user");
        if (currentCached) {
          const parsed = JSON.parse(currentCached);
          setCurrentUser(parsed);
          setLoadingAuth(false);
        } else {
          setCurrentUser(null);
          setProfile(null);
          setTasks([]);
          setNotifications([]);
          setLoadingAuth(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Local guest fallback loading
  useEffect(() => {
    if (currentUser?.isLocalGuest) {
      // Load Profile
      const cachedProfile = localStorage.getItem(`cl_profile_${currentUser.uid}`);
      if (cachedProfile) {
        setProfile(JSON.parse(cachedProfile));
      } else {
        const initialProfile: UserProfile = {
          username: currentUser.username || "Guest Agent",
          avatar: "panic",
          personality: null,
          focusGoal: "",
          points: 10,
          streak: 1,
          lastActive: new Date().toISOString(),
          completedQuiz: false,
          badges: [],
        };
        setProfile(initialProfile);
        localStorage.setItem(`cl_profile_${currentUser.uid}`, JSON.stringify(initialProfile));
      }

      // Load Tasks
      const cachedTasks = localStorage.getItem(`cl_tasks_${currentUser.uid}`);
      if (cachedTasks) {
        setTasks(JSON.parse(cachedTasks));
      } else {
        setTasks([]);
      }

      // Load Notifications
      const cachedNotifs = localStorage.getItem(`cl_notifs_${currentUser.uid}`);
      if (cachedNotifs) {
        setNotifications(JSON.parse(cachedNotifs));
      } else {
        setNotifications([]);
      }

      // Load Forum Posts
      const cachedPosts = localStorage.getItem(`cl_posts`);
      if (cachedPosts) {
        setForumPosts(JSON.parse(cachedPosts));
      } else {
        setForumPosts(SEED_FORUM_POSTS);
        localStorage.setItem(`cl_posts`, JSON.stringify(SEED_FORUM_POSTS));
      }
      
      setLoadingAuth(false);
    }
  }, [currentUser]);

  // Fetch cached theme preference on initial boot
  useEffect(() => {
    const cachedTheme = localStorage.getItem("sl_theme") as "dark" | "light" | null;
    if (cachedTheme) {
      setTheme(cachedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sl_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // Gamified Badge and Level Checker
  const checkAndAwardBadges = async (updatedProfile: UserProfile, triggerType: string, customContext?: any) => {
    if (!currentUser) return;
    const gainedBadges = [...updatedProfile.badges];
    let newlyUnlocked = false;

    const unlockBadge = async (badgeId: string) => {
      if (!gainedBadges.includes(badgeId)) {
        gainedBadges.push(badgeId);
        newlyUnlocked = true;

        // Post custom in-app notification
        const titleMap: { [key: string]: string } = {
          quiz_completed: "Self-Aware Slacker",
          first_task: "First Spark",
          ai_planner: "Micro-Architect",
          streak_3: "Momentum Machine",
          motivation_seeker: "Vibe Explorer",
          forum_active: "Crisis Comrade",
          deadline_dodger: "Deadline Ninja"
        };

        const alert: NotificationAlert = {
          id: Math.random().toString(),
          title: `🏆 Badge Unlocked: ${titleMap[badgeId]}`,
          message: `Congratulations! Your incredible slacker progression has earned you a new milestone badge. Inspect it in your Bento Showcase.`,
          type: "badge",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: false,
        };

        if (currentUser.isLocalGuest) {
          const nextNotifs = [alert, ...notifications];
          setNotifications(nextNotifs);
          localStorage.setItem(`cl_notifs_${currentUser.uid}`, JSON.stringify(nextNotifs));
        } else {
          await setDoc(doc(db, "users", currentUser.uid, "notifications", alert.id), alert);
        }

        // Pop confetti!
        setTimeout(() => {
          confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ["#ec4899", "#8b5cf6", "#3b82f6"]
          });
        }, 150);
      }
    };

    if (triggerType === "quiz") {
      await unlockBadge("quiz_completed");
    }
    if (triggerType === "task_completed") {
      await unlockBadge("first_task");
      if (customContext && customContext.priority === "high") {
        await unlockBadge("deadline_dodger");
      }
    }
    if (triggerType === "ai_breakdown") {
      await unlockBadge("ai_planner");
    }
    if (triggerType === "motivation") {
      await unlockBadge("motivation_seeker");
    }
    if (triggerType === "forum") {
      await unlockBadge("forum_active");
    }

    if (updatedProfile.streak >= 3) {
      await unlockBadge("streak_3");
    }

    if (newlyUnlocked) {
      const nextProfile = {
        ...updatedProfile,
        badges: gainedBadges,
      };
      if (currentUser.isLocalGuest) {
        setProfile(nextProfile);
        localStorage.setItem(`cl_profile_${currentUser.uid}`, JSON.stringify(nextProfile));
      } else {
        await setDoc(doc(db, "users", currentUser.uid), nextProfile);
      }
    }
  };

  // Onboarding Quiz complete callback
  const handleQuizComplete = async (personality: UserPersonality, focusGoal: string) => {
    if (!profile || !currentUser) return;
    const updatedProfile = {
      ...profile,
      personality,
      focusGoal,
      completedQuiz: true,
      points: profile.points + 50, // Onboarding completion bonus
    };
    if (currentUser.isLocalGuest) {
      setProfile(updatedProfile);
      localStorage.setItem(`cl_profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
    } else {
      await setDoc(doc(db, "users", currentUser.uid), updatedProfile);
    }
    await checkAndAwardBadges(updatedProfile, "quiz");
  };

  // Task Actions
  const handleAddTask = async (
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
  ) => {
    if (!currentUser) return;
    const newTask: Task = {
      id: Math.random().toString(),
      title,
      category,
      priority,
      completed: false,
      subtasks: [],
      difficulty: priority === "high" ? "epic" : priority === "medium" ? "moderate" : "atomic",
      createdAt: new Date().toISOString(),
      deadline,
      missingSupplies: friction?.missingSupplies || false,
      highCognitive: friction?.highCognitive || false,
      timeConsuming: friction?.timeConsuming || false,
      lowEnergy: friction?.lowEnergy || false,
    };

    // Push local alert notification
    const alert: NotificationAlert = {
      id: Math.random().toString(),
      title: `🎯 New Target Slated: ${title}`,
      message: `Your objective is logged with ${priority} priority. Build an AI atomic breakdown to prevent procrastination panic!`,
      type: "deadline",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };

    if (currentUser.isLocalGuest) {
      const nextTasks = [newTask, ...tasks];
      setTasks(nextTasks);
      localStorage.setItem(`cl_tasks_${currentUser.uid}`, JSON.stringify(nextTasks));

      const nextNotifs = [alert, ...notifications];
      setNotifications(nextNotifs);
      localStorage.setItem(`cl_notifs_${currentUser.uid}`, JSON.stringify(nextNotifs));
    } else {
      await setDoc(doc(db, "users", currentUser.uid, "tasks", newTask.id), newTask);
      await setDoc(doc(db, "users", currentUser.uid, "notifications", alert.id), alert);
    }
  };

  const handleOptimizeLanes = async () => {
    if (!currentUser || tasks.length === 0) return;
    setIsOptimizingLanes(true);
    try {
      const incompleteTasks = tasks.filter(t => !t.completed);
      const response = await fetch("/api/gemini/optimize-lanes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: incompleteTasks }),
      });

      if (!response.ok) throw new Error("Lane optimization failed");
      const data = await response.json();

      if (data.tasks && Array.isArray(data.tasks)) {
        let updatedTasks = [...tasks];
        for (const optTask of data.tasks) {
          const idx = updatedTasks.findIndex(t => t.id === optTask.id);
          if (idx !== -1) {
            const existingSubtasks = updatedTasks[idx].subtasks || [];
            
            // Build the new subtasks list
            const newSubWithIds = (optTask.subtasks || []).map((st: any) => ({
              id: st.id || Math.random().toString(),
              title: st.title,
              durationMinutes: st.durationMinutes || 15,
              importance: st.importance || "high",
              completed: st.completed || false
            }));

            // Prepend new ones, avoid repeating old ones with the exact same name
            const combinedSubtasks = [...newSubWithIds];
            for (const ext of existingSubtasks) {
              if (!combinedSubtasks.some(c => c.title.toLowerCase() === ext.title.toLowerCase())) {
                combinedSubtasks.push(ext);
              }
            }

            updatedTasks[idx] = {
              ...updatedTasks[idx],
              priority: optTask.priority,
              subtasks: combinedSubtasks
            };

            if (!currentUser.isLocalGuest) {
              await updateDoc(doc(db, "users", currentUser.uid, "tasks", optTask.id), {
                priority: optTask.priority,
                subtasks: combinedSubtasks
              });
            }
          }
        }

        if (currentUser.isLocalGuest) {
          setTasks(updatedTasks);
          localStorage.setItem(`cl_tasks_${currentUser.uid}`, JSON.stringify(updatedTasks));
        }

        if (data.focusTip) {
          const alert: NotificationAlert = {
            id: Math.random().toString(),
            title: "🔮 Cognitive Lanes Calibrated!",
            message: data.focusTip,
            type: "motivation",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            read: false,
          };

          if (currentUser.isLocalGuest) {
            const nextNotifs = [alert, ...notifications];
            setNotifications(nextNotifs);
            localStorage.setItem(`cl_notifs_${currentUser.uid}`, JSON.stringify(nextNotifs));
          } else {
            await setDoc(doc(db, "users", currentUser.uid, "notifications", alert.id), alert);
          }
        }
      }
    } catch (e) {
      console.error("Failed to optimize lanes:", e);
    } finally {
      setIsOptimizingLanes(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!currentUser) return;
    if (currentUser.isLocalGuest) {
      const nextTasks = tasks.filter((t) => t.id !== taskId);
      setTasks(nextTasks);
      localStorage.setItem(`cl_tasks_${currentUser.uid}`, JSON.stringify(nextTasks));
    } else {
      await deleteDoc(doc(db, "users", currentUser.uid, "tasks", taskId));
    }
  };

  const handleToggleSubtask = async (taskId: string, subtaskId: string) => {
    if (!profile || !currentUser) return;
    let pointsAwarded = 0;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSub = task.subtasks.map((st) => {
      if (st.id === subtaskId) {
        const nextState = !st.completed;
        if (nextState) pointsAwarded += 10; // +10 XP for subtask completed
        return { ...st, completed: nextState };
      }
      return st;
    });

    if (currentUser.isLocalGuest) {
      const nextTasks = tasks.map((t) => t.id === taskId ? { ...t, subtasks: updatedSub } : t);
      setTasks(nextTasks);
      localStorage.setItem(`cl_tasks_${currentUser.uid}`, JSON.stringify(nextTasks));
    } else {
      await updateDoc(doc(db, "users", currentUser.uid, "tasks", taskId), { subtasks: updatedSub });
    }

    if (pointsAwarded > 0) {
      const updatedProfile = {
        ...profile,
        points: profile.points + pointsAwarded,
      };
      if (currentUser.isLocalGuest) {
        setProfile(updatedProfile);
        localStorage.setItem(`cl_profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
      } else {
        await setDoc(doc(db, "users", currentUser.uid), updatedProfile);
      }
      await checkAndAwardBadges(updatedProfile, "task_completed");

      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.8 },
        colors: ["#22d3ee", "#a78bfa"]
      });
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!profile || !currentUser) return;
    let pointsAwarded = 0;
    let isCompleting = false;
    let targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const nextState = !targetTask.completed;
    if (nextState) {
      pointsAwarded += 50; // +50 XP for entire task completed!
      isCompleting = true;
    }

    const completedAtVal = nextState ? new Date().toISOString() : null;

    if (currentUser.isLocalGuest) {
      const nextTasks = tasks.map((t) => t.id === taskId ? { ...t, completed: nextState, completedAt: completedAtVal || undefined } : t);
      setTasks(nextTasks);
      localStorage.setItem(`cl_tasks_${currentUser.uid}`, JSON.stringify(nextTasks));
    } else {
      await updateDoc(doc(db, "users", currentUser.uid, "tasks", taskId), { 
        completed: nextState,
        completedAt: completedAtVal
      });
    }

    if (pointsAwarded > 0 && targetTask) {
      const updatedProfile = {
        ...profile,
        points: profile.points + pointsAwarded,
        streak: profile.streak + 1, // Complete task boosts streak!
      };

      // Local Alert
      const alert: NotificationAlert = {
        id: Math.random().toString(),
        title: `🔥 Task Defused! +50 XP`,
        message: `Incredible effort! You slayed "${targetTask.title}". Your streak was boosted to ${updatedProfile.streak} days. Keep moving!`,
        type: "streak",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: false,
      };

      if (currentUser.isLocalGuest) {
        setProfile(updatedProfile);
        localStorage.setItem(`cl_profile_${currentUser.uid}`, JSON.stringify(updatedProfile));

        const nextNotifs = [alert, ...notifications];
        setNotifications(nextNotifs);
        localStorage.setItem(`cl_notifs_${currentUser.uid}`, JSON.stringify(nextNotifs));
      } else {
        await setDoc(doc(db, "users", currentUser.uid), updatedProfile);
        await setDoc(doc(db, "users", currentUser.uid, "notifications", alert.id), alert);
      }

      await checkAndAwardBadges(updatedProfile, "task_completed", targetTask);

      // Major Confetti burst!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#22d3ee"]
      });
    }
  };

  // AI Planner Generator Call
  const handleGeneratePlan = async (taskId: string) => {
    if (!profile || !currentUser) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    setLoadingPlans((prev) => ({ ...prev, [taskId]: true }));

    try {
      const response = await fetch("/api/gemini/plan-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: task.title, timeFrame: "2 hours" }),
      });

      if (!response.ok) throw new Error("Service unavailable");

      const data = await response.json();
      if (data.subtasks && Array.isArray(data.subtasks)) {
        const subtasksWithIds = data.subtasks.map((st: any) => ({
          ...st,
          id: Math.random().toString(),
          completed: false,
        }));

        if (currentUser.isLocalGuest) {
          const nextTasks = tasks.map((t) => t.id === taskId ? { ...t, subtasks: subtasksWithIds } : t);
          setTasks(nextTasks);
          localStorage.setItem(`cl_tasks_${currentUser.uid}`, JSON.stringify(nextTasks));
        } else {
          await updateDoc(doc(db, "users", currentUser.uid, "tasks", taskId), {
            subtasks: subtasksWithIds
          });
        }

        // Award badge check
        const updatedProfile = {
          ...profile,
          points: profile.points + 20, // bonus for planning
        };

        if (currentUser.isLocalGuest) {
          setProfile(updatedProfile);
          localStorage.setItem(`cl_profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
        } else {
          await setDoc(doc(db, "users", currentUser.uid), updatedProfile);
        }
        await checkAndAwardBadges(updatedProfile, "ai_breakdown");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPlans((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  // AI Motivation Coach Call
  const handleSeekMotivation = async (taskTitle: string, deadline: string, mode: string) => {
    const response = await fetch("/api/gemini/motivation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskTitle, deadline, mode }),
    });

    if (!response.ok) throw new Error("Voice Coach asleep");

    const data = await response.json();
    return data; // returns { text, tip }
  };

  // Forum Actions
  const handleAddForumPost = async (title: string, category: string, content: string): Promise<string> => {
    if (!profile || !currentUser) return "";
    const newPostId = Math.random().toString();
    const newPost: ForumPost = {
      id: newPostId,
      authorName: profile.username,
      avatarSeed: profile.avatar,
      title,
      category,
      content,
      timestamp: "Just now",
      likes: 0,
      replies: [],
    };

    if (currentUser.isLocalGuest) {
      const nextPosts = [newPost, ...forumPosts];
      setForumPosts(nextPosts);
      localStorage.setItem(`cl_posts`, JSON.stringify(nextPosts));
    } else {
      await setDoc(doc(db, "posts", newPostId), newPost);
    }
    return newPostId;
  };

  const handleTriggerCommunityReply = async (postId: string, category: string, content: string) => {
    if (!profile || !currentUser) return;
    setLoadingReplies((prev) => ({ ...prev, [postId]: true }));

    try {
      const response = await fetch("/api/gemini/community-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postContent: content, postCategory: category }),
      });

      if (!response.ok) throw new Error("No replies available");

      const data = await response.json();
      if (data.replies && Array.isArray(data.replies)) {
        const formattedReplies: ForumReply[] = data.replies.map((r: any) => ({
          ...r,
          id: Math.random().toString(),
          timestamp: "1 min ago",
        }));

        const post = forumPosts.find((p) => p.id === postId);
        if (post) {
          const updatedReplies = [...post.replies, ...formattedReplies];
          if (currentUser.isLocalGuest) {
            const nextPosts = forumPosts.map((p) => p.id === postId ? { ...p, replies: updatedReplies } : p);
            setForumPosts(nextPosts);
            localStorage.setItem(`cl_posts`, JSON.stringify(nextPosts));
          } else {
            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, {
              replies: updatedReplies
            });
          }
        }

        // Award badge check
        const updatedProfile = {
          ...profile,
          points: profile.points + 15,
        };
        if (currentUser.isLocalGuest) {
          setProfile(updatedProfile);
          localStorage.setItem(`cl_profile_${currentUser.uid}`, JSON.stringify(updatedProfile));
        } else {
          await setDoc(doc(db, "users", currentUser.uid), updatedProfile);
        }
        await checkAndAwardBadges(updatedProfile, "forum");
      }
    } catch (e) {
      console.error("Failed to generate replies, applying local mock safety fallback:", e);
      
      const localFallbacks: ForumReply[] = [
        {
          id: Math.random().toString(),
          authorName: "Speedy McDeadline",
          avatarSeed: "speedy",
          content: "OMG SAME!! 😱 MY KEYBOARD IS ON FIRE! Just write anything, you can polish it later! Let's go!",
          mode: "Speedy McDeadline",
          timestamp: "1 min ago"
        },
        {
          id: Math.random().toString(),
          authorName: "The Tough Love Coach",
          avatarSeed: "coach",
          content: "Close this tab and focus! You are procrastinating by reading support forums. Open your editor right now!",
          mode: "The Tough Love Coach",
          timestamp: "1 min ago"
        }
      ];
      
      const post = forumPosts.find((p) => p.id === postId);
      if (post) {
        const updatedReplies = [...post.replies, ...localFallbacks];
        if (currentUser.isLocalGuest) {
          const nextPosts = forumPosts.map((p) => p.id === postId ? { ...p, replies: updatedReplies } : p);
          setForumPosts(nextPosts);
          localStorage.setItem(`cl_posts`, JSON.stringify(nextPosts));
        } else {
          try {
            const postRef = doc(db, "posts", postId);
            await updateDoc(postRef, { replies: updatedReplies });
          } catch (dbErr) {
            const nextPosts = forumPosts.map((p) => p.id === postId ? { ...p, replies: updatedReplies } : p);
            setForumPosts(nextPosts);
          }
        }
      }
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    const post = forumPosts.find((p) => p.id === postId);
    if (!post) return;

    const userLiked = !post.userLiked;
    if (currentUser.isLocalGuest) {
      const nextPosts = forumPosts.map((p) => p.id === postId ? {
        ...p,
        likes: userLiked ? p.likes + 1 : p.likes - 1,
        userLiked: userLiked,
      } : p);
      setForumPosts(nextPosts);
      localStorage.setItem(`cl_posts`, JSON.stringify(nextPosts));
    } else {
      const postRef = doc(db, "posts", postId);
      await updateDoc(postRef, {
        likes: userLiked ? post.likes + 1 : post.likes - 1,
        userLiked: userLiked,
      });
    }
  };

  // Local alarm simulation trigger
  const handleTriggerPushAlert = async () => {
    if (!profile || !currentUser) return;
    const randomDeadlines = [
      "Your English research thesis deadline is collapsing in 3 hours!",
      "The product pitch slides for VCs are due in 4 hours, and you're still choosing colors!",
      "The credit bill expires at midnight. Avoid fees, pay now!",
      "Coding deployment scheduled in 2 hours. Your database is throwing warnings!",
    ];
    const randomMessage = randomDeadlines[Math.floor(Math.random() * randomDeadlines.length)];

    const alert: NotificationAlert = {
      id: Math.random().toString(),
      title: "🚨 URGENT: Deadline Proximity Alarm!",
      message: `${randomMessage} Navigate to the Psychological Defibrillator Zone to get an instant productivity trigger.`,
      type: "deadline",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
    };

    if (currentUser.isLocalGuest) {
      const nextNotifs = [alert, ...notifications];
      setNotifications(nextNotifs);
      localStorage.setItem(`cl_notifs_${currentUser.uid}`, JSON.stringify(nextNotifs));
    } else {
      await setDoc(doc(db, "users", currentUser.uid, "notifications", alert.id), alert);
    }

    // Show a native browser notification if permitted!
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("ClutchMind Emergency Alarm!", {
        body: randomMessage,
      });
    }
  };

  // Ask for browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Auto-mark notifications as read when viewing dashboard
  useEffect(() => {
    if (activeTab === "dashboard" && currentUser) {
      const unreadNotifs = notifications.filter(n => !n.read);
      if (unreadNotifs.length > 0) {
        const markAllAsRead = async () => {
          if (currentUser.isLocalGuest) {
            const updated = notifications.map(n => ({ ...n, read: true }));
            setNotifications(updated);
            localStorage.setItem(`cl_notifs_${currentUser.uid}`, JSON.stringify(updated));
          } else {
            try {
              const batch = writeBatch(db);
              unreadNotifs.forEach((notif) => {
                const notifRef = doc(db, "users", currentUser.uid, "notifications", notif.id);
                batch.update(notifRef, { read: true });
              });
              await batch.commit();
            } catch (err) {
              console.error("Failed to mark notifications as read:", err);
            }
          }
        };
        markAllAsRead();
      }
    }
  }, [activeTab, notifications, currentUser]);

  const handleClearNotifications = async () => {
    if (!currentUser) return;
    if (currentUser.isLocalGuest) {
      setNotifications([]);
      localStorage.setItem(`cl_notifs_${currentUser.uid}`, JSON.stringify([]));
    } else {
      const batch = writeBatch(db);
      notifications.forEach((notif) => {
        const notifRef = doc(db, "users", currentUser.uid, "notifications", notif.id);
        batch.delete(notifRef);
      });
      await batch.commit();
    }
  };

  const handleLogOut = async () => {
    if (currentUser?.isLocalGuest) {
      setCurrentUser(null);
      setProfile(null);
      setTasks([]);
      setNotifications([]);
      localStorage.removeItem("cl_local_user");
    } else {
      await signOut(auth);
    }
    setActiveTab("dashboard");
  };

  // Guard: Loading Check
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center justify-center p-4">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="p-3 bg-[#111827] border border-cyan-500/30 rounded-2xl mb-4">
          <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
        </div>
        <p className="text-xs font-mono tracking-widest text-cyan-400 uppercase animate-pulse">
          CONNECTING TO SECURE SYSTEM STORAGE CORE...
        </p>
      </div>
    );
  }

  // Guard: Auth Check
  if (!currentUser || !profile) {
    return <AuthPage onLocalSignIn={(localUser) => {
      localStorage.setItem("cl_local_user", JSON.stringify(localUser));
      setCurrentUser(localUser);
    }} />;
  }

  // Guard: Quiz Onboarding check
  if (!profile.completedQuiz) {
    return <Quiz username={profile.username} onComplete={handleQuizComplete} />;
  }

  const activeNotificationsCount = notifications.filter((n) => !n.read).length;

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      theme === "dark" ? "bg-[#030712] text-gray-100" : "bg-[#f8fafc] text-gray-800"
    }`}>
      {/* Background radial effects */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-10 transition-colors ${
          theme === "dark" ? "bg-indigo-500" : "bg-indigo-300"
        }`} />
        <div className={`absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] opacity-10 transition-colors ${
          theme === "dark" ? "bg-cyan-500" : "bg-cyan-300"
        }`} />
      </div>

      {/* Main Navigation Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b relative z-10 transition-all ${
        theme === "dark" ? "bg-[#030712]/80 border-gray-800" : "bg-white/80 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
              <Brain className="w-5 h-5 stroke-[1.8]" />
              <div className="absolute -right-0.5 -bottom-0.5 bg-[#030712] p-0.5 rounded-full border border-indigo-500/30">
                <Zap className="w-2 h-2 text-amber-400 fill-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent leading-none">
                CLUTCHMIND
              </h1>
              <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">
                {profile.personality}
              </span>
            </div>
          </div>

          {/* Navigation Tab Links */}
          <nav className="hidden md:flex items-center space-x-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "tasks", label: "Atomic Tasks", icon: CheckSquare },
              { id: "motivation", label: "Defibrillator Coach", icon: Sparkles },
              { id: "community", label: "Community Panic", icon: MessagesSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 py-2 px-3.5 rounded-xl text-xs font-semibold transition-all relative ${
                    activeTab === tab.id
                      ? theme === "dark"
                        ? "bg-[#1e293b]/80 border border-indigo-500/30 text-white"
                        : "bg-indigo-50 border border-indigo-200 text-indigo-700"
                      : "text-gray-400 hover:text-cyan-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User controls */}
          <div className="flex items-center space-x-3">
            {/* Alarm notifications visual count */}
            {activeNotificationsCount > 0 && (
              <div className="relative group p-1.5 hover:bg-slate-800/10 rounded-lg cursor-pointer" onClick={() => setActiveTab("dashboard")}>
                <Bell className="w-4.5 h-4.5 text-amber-500 animate-bounce" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-mono font-bold text-white shadow-sm leading-none">
                  {activeNotificationsCount}
                </span>
              </div>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className={`p-2 rounded-xl border transition-all ${
                theme === "dark"
                  ? "bg-[#111827] border-gray-800 text-gray-400 hover:text-yellow-400"
                  : "bg-white border-slate-200 text-gray-500 hover:text-indigo-600"
              }`}
              title="Toggle Night Mode"
            >
              {theme === "dark" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Log out */}
            <button
              onClick={handleLogOut}
              className={`p-2 rounded-xl border transition-all ${
                theme === "dark"
                  ? "bg-[#111827] border-gray-800 text-gray-400 hover:text-red-400"
                  : "bg-white border-slate-200 text-gray-500 hover:text-red-500"
              }`}
              title="De-authorize Session"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === "dashboard" && (
              <Dashboard
                profile={profile}
                tasks={tasks}
                notifications={notifications}
                onTriggerNotification={handleTriggerPushAlert}
                onClearNotifications={handleClearNotifications}
              />
            )}

            {activeTab === "tasks" && (
              <TaskManager
                tasks={tasks}
                onAddTask={handleAddTask}
                onDeleteTask={handleDeleteTask}
                onToggleSubtask={handleToggleSubtask}
                onToggleTask={handleToggleTask}
                onGeneratePlan={handleGeneratePlan}
                loadingPlans={loadingPlans}
                onOptimizeLanes={handleOptimizeLanes}
                isOptimizingLanes={isOptimizingLanes}
              />
            )}

            {activeTab === "motivation" && (
              <MotivationZone
                tasks={tasks}
                onSeekMotivation={handleSeekMotivation}
                onUnlockMotivationBadge={() => checkAndAwardBadges(profile, "motivation")}
              />
            )}

            {activeTab === "community" && (
              <CommunityForum
                posts={forumPosts}
                onAddPost={handleAddForumPost}
                onTriggerCommunityReply={handleTriggerCommunityReply}
                onLikePost={handleLikePost}
                loadingReplies={loadingReplies}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Sticky Tab Navigation */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 border-t backdrop-blur-md py-3 px-4 flex items-center justify-around z-40 transition-colors ${
        theme === "dark" ? "bg-[#030712]/95 border-gray-800" : "bg-white/95 border-slate-200"
      }`}>
        {[
          { id: "dashboard", label: "Dash", icon: LayoutDashboard },
          { id: "tasks", label: "Tasks", icon: CheckSquare },
          { id: "motivation", label: "Coach", icon: Sparkles },
          { id: "community", label: "Panic", icon: MessagesSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center space-y-1 ${
                activeTab === tab.id
                  ? "text-indigo-500 font-bold"
                  : "text-gray-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Visual buffer underneath mobile sticky bar */}
      <div className="h-16 md:hidden flex-shrink-0" />
    </div>
  );
}
