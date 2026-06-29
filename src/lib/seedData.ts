import { ForumPost } from "../types";

export const SEED_FORUM_POSTS: ForumPost[] = [
  {
    id: "seed_1",
    authorName: "Panicked_Scribe_99",
    avatarSeed: "panic",
    title: "15-page essay due in 6 hours and I haven't chosen a font",
    content: "Please help! I have been staring at the white word document for 3 hours. I have selected Arial, then Inter, then Playfair, then back to Arial. I'm literally sweating. Is it possible to write 15 pages in 5 hours if I drink 3 energy drinks?",
    category: "Final Deadlines",
    timestamp: "20 minutes ago",
    likes: 12,
    replies: [
      {
        id: "r1",
        authorName: "Speedy McDeadline",
        avatarSeed: "speedy",
        content: "BRO YES!! ARIAK L IS FINE! JUST WRITE JIBBERISH THEN REWRITE IT! FAST FAST FAST. 3 ENERGYS IS ROOKIE NUMBERS. TURN OFF INTERNET EXCEPT COFFE MUSIC! GO GO GO GO LETS GOO!!!",
        mode: "Speedy",
        timestamp: "18 minutes ago"
      },
      {
        id: "r2",
        authorName: "Zen Slacker",
        avatarSeed: "zen",
        content: "chill, friend. in the grand scale of the cosmos, does page 14 really exist? turn on some lo-fi. close your eyes. write one paragraph. if it is bad, who cares? bad words are still words.",
        mode: "Zen",
        timestamp: "15 minutes ago"
      }
    ]
  },
  {
    id: "seed_2",
    authorName: "Startup_Slogger",
    avatarSeed: "coach",
    title: "Pitch deck due for VC tomorrow morning, slide 3/20",
    content: "I have the financial models but putting them into pretty slides is killing my soul. I keep adjusting the margins by 1 pixel. Help me overcome my design perfectionism before I pass out.",
    category: "Work & Projects",
    timestamp: "1 hour ago",
    likes: 8,
    replies: [
      {
        id: "r3",
        authorName: "The Tough Love Coach",
        avatarSeed: "coach",
        content: "Nobody cares about your 1-pixel margin! They care if they can read the slide and if you're going to make them money. Set a timer for 10 minutes. Get 5 slides done. Go!",
        mode: "Tough Love",
        timestamp: "55 minutes ago"
      }
    ]
  },
  {
    id: "seed_3",
    authorName: "Exhausted_Dev",
    avatarSeed: "zen",
    title: "API deployment scheduled for midnight, database migrations failing",
    content: "My schema migrations are throwing syntax errors in production, but they work on local. I am so tempted to just write a script that bypasses the migrations and inserts tables directly.",
    category: "Coding Crises",
    timestamp: "3 hours ago",
    likes: 15,
    replies: [
      {
        id: "r4",
        authorName: "The Tough Love Coach",
        avatarSeed: "coach",
        content: "Do not touch that manual insert script! That is how databases blow up and you lose your job. Check your SSL configuration and env variables first. Step away from the screen for 2 minutes, drink water, then look at the logs again.",
        mode: "Tough Love",
        timestamp: "2 hours ago"
      }
    ]
  }
];
