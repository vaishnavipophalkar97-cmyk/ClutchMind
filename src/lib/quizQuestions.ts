import { UserPersonality } from "../types";

export interface QuizQuestionOption {
  text: string;
  points: {
    [key in UserPersonality]: number;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizQuestionOption[];
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "A major project is due tomorrow at 9:00 AM. It is currently 8:00 PM the night before. What are you doing?",
    options: [
      {
        text: "Just opening the document now. Time to start researching what the topic actually means.",
        points: {
          [UserPersonality.SLACKER]: 3,
          [UserPersonality.PERFECTIONIST]: 1,
          [UserPersonality.OVERWHELMED]: 2,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "Pacing around the room, hyperventilating, rewriting the title page for the 45th time to make it look 'industry-grade'.",
        points: {
          [UserPersonality.SLACKER]: 1,
          [UserPersonality.PERFECTIONIST]: 3,
          [UserPersonality.OVERWHELMED]: 2,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "Staring at a task list of 180 action items, crying softly while trying to answer 15 emails at once.",
        points: {
          [UserPersonality.SLACKER]: 0,
          [UserPersonality.PERFECTIONIST]: 2,
          [UserPersonality.OVERWHELMED]: 3,
          [UserPersonality.BALANCED]: 1,
        }
      },
      {
        text: "Reviewing my completed draft, adjusting a final citation, and preparing to go to sleep by 10:30 PM.",
        points: {
          [UserPersonality.SLACKER]: 0,
          [UserPersonality.PERFECTIONIST]: 0,
          [UserPersonality.OVERWHELMED]: 0,
          [UserPersonality.BALANCED]: 3,
        }
      }
    ]
  },
  {
    id: "q2",
    question: "What is your primary relationship with deadlines?",
    options: [
      {
        text: "Deadlines are merely mild suggestions or cosmic theories. I only feel alive in the final hour.",
        points: {
          [UserPersonality.SLACKER]: 3,
          [UserPersonality.PERFECTIONIST]: 0,
          [UserPersonality.OVERWHELMED]: 1,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "They are absolute terror. If I don't turn in a perfect masterpiece, I feel like a total failure.",
        points: {
          [UserPersonality.SLACKER]: 0,
          [UserPersonality.PERFECTIONIST]: 3,
          [UserPersonality.OVERWHELMED]: 1,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "I say 'yes' to everything, so I have 10 deadlines collapsing on me simultaneously like a game of Jenga.",
        points: {
          [UserPersonality.SLACKER]: 1,
          [UserPersonality.PERFECTIONIST]: 1,
          [UserPersonality.OVERWHELMED]: 3,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "I schedule milestones, use a calendar daily, and execute tasks in comfortable chunks.",
        points: {
          [UserPersonality.SLACKER]: 0,
          [UserPersonality.PERFECTIONIST]: 1,
          [UserPersonality.OVERWHELMED]: 0,
          [UserPersonality.BALANCED]: 3,
        }
      }
    ]
  },
  {
    id: "q3",
    question: "Which thought loop occupies your brain when you are procrastinating?",
    options: [
      {
        text: "'I'll do it later. 10 minutes of social media won't hurt.' (Repeat for 6 hours)",
        points: {
          [UserPersonality.SLACKER]: 3,
          [UserPersonality.PERFECTIONIST]: 1,
          [UserPersonality.OVERWHELMED]: 1,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "'I don't know enough yet. I need to read 5 more books and watch 8 videos before I can write the first word.'",
        points: {
          [UserPersonality.SLACKER]: 0,
          [UserPersonality.PERFECTIONIST]: 3,
          [UserPersonality.OVERWHELMED]: 2,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "'There's too much to do. I am paralyzed by the sheer weight of existence. I'm going to take a panic nap.'",
        points: {
          [UserPersonality.SLACKER]: 1,
          [UserPersonality.PERFECTIONIST]: 2,
          [UserPersonality.OVERWHELMED]: 3,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "'This task is straightforward. I'll get it out of the way so I can enjoy my weekend guilt-free.'",
        points: {
          [UserPersonality.SLACKER]: 0,
          [UserPersonality.PERFECTIONIST]: 0,
          [UserPersonality.OVERWHELMED]: 0,
          [UserPersonality.BALANCED]: 3,
        }
      }
    ]
  },
  {
    id: "q4",
    question: "What is your main goal for using this application?",
    options: [
      {
        text: "I want to stop destroying my sleep schedule and actually start tasks before the 11th hour.",
        points: {
          [UserPersonality.SLACKER]: 3,
          [UserPersonality.PERFECTIONIST]: 1,
          [UserPersonality.OVERWHELMED]: 2,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "I want to learn to let go of perfectionism, make decisions faster, and ship work that is 'good enough'.",
        points: {
          [UserPersonality.SLACKER]: 1,
          [UserPersonality.PERFECTIONIST]: 3,
          [UserPersonality.OVERWHELMED]: 1,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "I want a clear brain dump, extreme micro-prioritization, and someone to tell me what single task to do first.",
        points: {
          [UserPersonality.SLACKER]: 1,
          [UserPersonality.PERFECTIONIST]: 1,
          [UserPersonality.OVERWHELMED]: 3,
          [UserPersonality.BALANCED]: 0,
        }
      },
      {
        text: "I want to optimize my flow, track my achievements, and play with cool futuristic dashboards.",
        points: {
          [UserPersonality.SLACKER]: 0,
          [UserPersonality.PERFECTIONIST]: 0,
          [UserPersonality.OVERWHELMED]: 0,
          [UserPersonality.BALANCED]: 3,
        }
      }
    ]
  }
];
