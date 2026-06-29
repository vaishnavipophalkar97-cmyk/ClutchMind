import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Motivation
  app.post("/api/gemini/motivation", async (req, res) => {
    const { taskTitle, deadline, mode } = req.body;
    try {
      const ai = getGeminiClient();

      let systemPrompt = "";
      if (mode === "overhype") {
        systemPrompt = "You are a hyper-energetic, overly enthusiastic hypeman. Use lots of CAPS, exclamation marks, and intense slang like 'LETS GOOO', 'BEAST MODE', 'MONSTER EFFORT'. Make the user feel like they are about to conquer the universe by starting this task.";
      } else if (mode === "sugar-coated") {
        systemPrompt = "You are an incredibly sweet, nurturing companion. Talk like a grandmother or a highly supportive fairy godmother who thinks the user is a precious star. Use emojis, warm expressions, and tell them that even the tiniest step is a beautiful victory.";
      } else if (mode === "serious") {
        systemPrompt = "You are a stern, no-nonsense military drill sergeant or a strict high-performance executive. Speak with absolute authority, emphasize discipline, consequences of failure, and the pure satisfaction of duty. No excuses.";
      } else if (mode === "practical") {
        systemPrompt = "You are a grounded, logical, highly efficient systems architect. Break down the psychology of why they are avoiding the task, give them 2 immediate steps that take under 2 minutes, and focus on simple physics: momentum over perfection.";
      } else {
        systemPrompt = "You are a balanced, supportive, and clever productivity coach.";
      }

      const prompt = `Task: "${taskTitle}"
Deadline/Context: "${deadline || "ASAP"}"

Provide a highly personalized and motivating speech matching your character. Keep it short (3-4 sentences max). Also provide one "Quick Hack" (1 sentence) for starting immediately.
Return your response strictly in JSON format matching this schema:
{
  "text": "The motivational speech goes here",
  "tip": "The quick start hack goes here"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(response.text?.trim() || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/gemini/motivation:", error);
      const fallbackText = mode === "overhype" 
        ? "LETS GOOOO! The clock is ticking but you are an absolute BEAST! Open that file right now and crush it!"
        : mode === "sugar-coated"
        ? "Oh sweetie, you've done so well just by acknowledging this. Even starting with one sentence is a beautiful victory. Take a deep breath!"
        : mode === "serious"
        ? "No excuses. Every second spent idling is a direct compromise of your future goals. Start the work immediately with discipline."
        : "Let's focus on momentum over perfection. Pick the absolute smallest subtask and do it for just two minutes.";
      
      res.json({
        text: fallbackText,
        tip: "Set a 10-minute timer and just do whatever you can. Momentum is key!"
      });
    }
  });

  // API Route: Plan Task
  app.post("/api/gemini/plan-task", async (req, res) => {
    try {
      const { goal, timeFrame } = req.body;
      const ai = getGeminiClient();

      const prompt = `Generate a realistic step-by-step action plan to accomplish the following goal: "${goal}" within a total timeframe of "${timeFrame || "not specified"}".
Since the user is likely procrastinating, stressed, or doing things last-minute, the steps must be extremely bite-sized, low-friction, sequential, and highly actionable.
Return your response strictly in JSON format with a "subtasks" array. Each subtask must have "title" (the action), "durationMinutes" (estimated time to complete), and "importance" ("low", "medium", or "high"). Limit to 4-6 subtasks.
JSON Schema:
{
  "subtasks": [
    { "title": "Bite-sized step description", "durationMinutes": 10, "importance": "high" }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert deadline rescuer who specializes in breaking down complex tasks into atomic, non-intimidating, high-momentum steps for stressed students and professionals.",
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(response.text?.trim() || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/gemini/plan-task:", error);
      res.json({
        subtasks: [
          { title: "Open the required tools, documents, and clear desktop distractions", durationMinutes: 5, importance: "high" },
          { title: "Draft the absolute simplest, low-friction outline or skeleton of the work", durationMinutes: 15, importance: "medium" },
          { title: "Set a 25-minute focus timer and work on the first high-impact item", durationMinutes: 25, importance: "high" },
          { title: "Review progress, make quick adjustments, and complete the final touches", durationMinutes: 15, importance: "medium" }
        ]
      });
    }
  });

  // API Route: Community Reply
  app.post("/api/gemini/community-reply", async (req, res) => {
    try {
      const { postContent, postCategory } = req.body;
      const ai = getGeminiClient();

      const prompt = `A user has shared a struggle in our last-minute support forum:
Category: "${postCategory || "General Procrastination"}"
Post: "${postContent}"

We want to simulate 2 distinct forum members replying to support or motivate them, with highly distinct personalities:
1. "Speedy McDeadline" (hyperactive procrastinator who works 100x speed under panic, lots of speed-fueled typos, funny high-energy support).
2. "The Tough Love Coach" (very direct, emphasizes structure, tells them to stop reading the forum and start working right now, but with love).
3. "Zen Slacker" (super laid back, thinks deadlines are social constructs, reminds them to breathe, play music, and do just 5 minutes of work).
4. "The Panicked Perfectionist" (shares the panic, overanalyzes, but offers a hyper-organized template or quick template tip).

Select 2 of the above personalities that fit best or would make a funny, highly engaging contrast. Return exactly 2 replies.
Return your response strictly in JSON format matching this schema:
{
  "replies": [
    {
      "authorName": "Name of character",
      "avatarSeed": "short seed name like 'speedy' or 'zen' or 'coach' or 'panic'",
      "content": "Reply text, highly in-character (2-3 sentences)",
      "mode": "The personality archetype name"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction: "You are a simulator for a humorous, supportive community of last-minute conquerors and procrastinators helping each other survive deadlines.",
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(response.text?.trim() || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/gemini/community-reply:", error);
      
      // Select 2 funny, highly distinct fallbacks matching the requested persona options
      const fallbacks = [
        {
          authorName: "Speedy McDeadline",
          avatarSeed: "speedy",
          content: `OMG SAME!! 😱 i literally have 20 mins to finish my paper and im typing at 300 words per minute!!! MY KEYBOARD IS ON FIRE!! just open the doc and type gibberish if u have to, you can fix it later!! LETS GOOOO ⚡⚡`,
          mode: "Speedy McDeadline"
        },
        {
          authorName: "The Tough Love Coach",
          avatarSeed: "coach",
          content: `I'm going to say this with love: close this tab. Yes, right now. You are procrastinating by reading about procrastinating. Set a timer for 15 minutes, put your phone in another room, and do not look up until that timer dings! You've got this, now move!`,
          mode: "The Tough Love Coach"
        }
      ];
      res.json({ replies: fallbacks });
    }
  });

  // API Route: Panic Prediction Engine
  app.post("/api/gemini/panic-prediction", async (req, res) => {
    const { tasks, profile } = req.body;
    try {
      const ai = getGeminiClient();

      // Formulate task representation for Gemini
      const outstandingTasks = (tasks || [])
        .filter((t: any) => !t.completed)
        .map((t: any) => ({
          title: t.title,
          priority: t.priority,
          category: t.category,
          deadline: t.deadline || "ASAP",
          subtasksCount: t.subtasks ? t.subtasks.length : 0,
          completedSubtasksCount: t.subtasks ? t.subtasks.filter((s: any) => s.completed).length : 0
        }));

      const systemPrompt = `You are a high-performance cognitive neural diagnostic engine. You specialize in analyzing stress levels, work backlogs, upcoming deadlines, and user psychological personality profiles (like Slacker, Perfectionist, Overwhelmed) to evaluate extreme procrastination risks.`;

      const prompt = `User Profile:
- Personality: "${profile?.personality || "Balanced Builder"}"
- Active Streak: ${profile?.streak || 1} days
- Focus Goal: "${profile?.focusGoal || "Complete Outstanding Work"}"
- XP Points: ${profile?.points || 0}

Outstanding Tasks:
${JSON.stringify(outstandingTasks, null, 2)}

Instructions:
1. Calculate a personalized "Panic Risk Score" from 0 to 100 representing their current psychological crisis threat based on how close their deadlines are and their outstanding priority lanes. If no tasks, the score should be low (under 15).
2. Formulate a diagnostic psychological assessment (2-3 sentences max) explaining how their personality type (e.g. Master Procrastinator) combined with their outstanding high/critical priority tasks is leading to this specific stress/panic curve.
3. Recommend a customized preemptive "Atomic Defusion Schedule" consisting of exactly 3 low-friction, high-velocity sequential hourly action points to build immediate momentum and defuse stress. Keep the schedules practical and short.
Return your response strictly in JSON format matching this schema:
{
  "score": 75,
  "riskLevel": "Severe",
  "assessment": "Detailed diagnostic feedback here...",
  "preemptiveSchedule": [
    { "time": "Hour 1", "action": "Action point 1 description" },
    { "time": "Hour 2", "action": "Action point 2 description" },
    { "time": "Hour 3", "action": "Action point 3 description" }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(response.text?.trim() || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/gemini/panic-prediction:", error);
      const tasksCount = tasks ? tasks.filter((t: any) => !t.completed).length : 0;
      let score = 10;
      let riskLevel = "Minimal";
      let assessment = "You are currently in a highly stable flow state with little to no pending friction lanes.";
      
      if (tasksCount > 0) {
        score = Math.min(15 + tasksCount * 15, 95);
        if (score > 75) {
          riskLevel = "Critical";
          assessment = "Outstanding high-priority deliverables are converging to create a classic procrastination-panic peak. Action is urgently recommended.";
        } else if (score > 45) {
          riskLevel = "Moderate";
          assessment = "Moderate backlogs are starting to accumulate. You still have time to take proactive steps before panic sets in.";
        } else {
          riskLevel = "Low";
          assessment = "Your workload is currently well-spaced, but starting early on high priority tasks will protect your peace of mind.";
        }
      }
      
      res.json({
        score,
        riskLevel,
        assessment,
        preemptiveSchedule: [
          { time: "Hour 1", action: "Execute a 2-minute starter hack on your most urgent task." },
          { time: "Hour 2", action: "Block off all notifications and run a high-intensity 25-minute Pomodoro." },
          { time: "Hour 3", action: "Take a 5-minute deep breathing break, then log your completed wins." }
        ]
      });
    }
  });

  // API Route: Optimize & Reprioritize Tasks based on Friction Profile
  app.post("/api/gemini/optimize-lanes", async (req, res) => {
    const { tasks = [] } = req.body || {};
    try {
      const ai = getGeminiClient();

      const prompt = `You are a cognitive momentum optimizer. Analyze the following list of active tasks, taking into account their deadlines, categories, original priorities, and especially their *friction profiles/blockers* (missingSupplies, highCognitive, timeConsuming, lowEnergy).

Tasks to analyze:
${JSON.stringify(tasks, null, 2)}

Your goal is to intelligently re-prioritize each task into one of the priority lanes ("high", "medium", or "low") to maximize immediate execution potential and eliminate decision paralysis.

Guiding Principles for Calibration:
- If a task has "missingSupplies" (e.g. they don't have particular sheets, materials, or tools to do it), they cannot do it immediately. Downgrade its main priority to "medium" or "low", OR if extremely urgent, keep it "medium" and auto-generate an immediate friction-breaker subtask to acquire those supplies first.
- If a task has "highCognitive" (e.g. requires learning complex concepts or logic) AND "lowEnergy" is checked, prioritize a smaller, easier "low-friction" study task to build momentum first, or make sure to add a small 5-min learning subtask.
- If a task has "timeConsuming" or "lowEnergy", break it down by adding a very simple "warm-up" action as a subtask.
- For each task with any checked friction factors, you MUST generate 1-2 practical, atomic "Friction Breaker" subtasks.
  - For missingSupplies, add subtasks like: "🛒 Go to stationary or store to acquire [supplies needed]"
  - For highCognitive, add subtasks like: "📺 5-10 min tutorial/review: Understand the core concepts or logic of [Topic]"
  - For timeConsuming, add subtasks like: "⏱️ Open file and outline/draft the skeleton (just 10 minutes)"
  - For lowEnergy, add subtasks like: "🍫 2-minute starter: Set up the desk space or watch a quick motivational video"

Keep any existing completed or incomplete subtasks if they exist, but PREPEND the new Friction Breaker subtasks at the top of the "subtasks" array for that task so they act as the immediate entry points! Each subtask must follow the schema: { "title": "...", "durationMinutes": number, "importance": "high"|"medium"|"low", "completed": false }.

Return your response strictly in JSON format matching this schema:
{
  "tasks": [
    {
      "id": "original_task_id",
      "priority": "high" | "medium" | "low",
      "subtasks": [
        { "title": "Bite-sized step description", "durationMinutes": 15, "importance": "high", "completed": false }
      ]
    }
  ],
  "focusTip": "Detailed momentum optimization tip explaining your changes (2-3 sentences max)."
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert cognitive psychologist and productivity coach who designs ultra-low-friction workflows for stressed students.",
          responseMimeType: "application/json",
        },
      });

      const data = JSON.parse(response.text?.trim() || "{}");
      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/gemini/optimize-lanes:", error);
      res.json({
        tasks: tasks.map((t: any) => ({
          id: t.id,
          priority: t.priority,
          subtasks: t.subtasks || []
        })),
        focusTip: "Cognitive lanes are stable. Ready for manual task planning or Pomodoro activation."
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
