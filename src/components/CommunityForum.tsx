import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Users, Send, Heart, RefreshCw, Sparkles } from "lucide-react";
import { ForumPost, ForumReply } from "../types";

interface CommunityForumProps {
  posts: ForumPost[];
  onAddPost: (title: string, category: string, content: string) => Promise<string>;
  onTriggerCommunityReply: (postId: string, category: string, content: string) => Promise<void>;
  onLikePost: (postId: string) => void;
  loadingReplies: { [postId: string]: boolean };
}

const CATEGORIES = [
  "General Procrastination",
  "Final Deadlines",
  "Work & Projects",
  "Coding Crises",
  "Unimportant Distractions"
];

const AVATAR_MAP: { [key: string]: string } = {
  panic: "😰",
  speedy: "⚡",
  zen: "🧘",
  coach: "🎩",
  general: "👥"
};

const MODE_COLOR_MAP: { [key: string]: string } = {
  Speedy: "from-amber-400 to-yellow-600 border-yellow-500/20 text-yellow-300",
  Zen: "from-teal-400 to-emerald-600 border-emerald-500/20 text-emerald-300",
  "Tough Love": "from-red-500 to-rose-700 border-rose-500/20 text-rose-300",
  Panic: "from-purple-500 to-indigo-600 border-indigo-500/20 text-indigo-300"
};

export default function CommunityForum({
  posts,
  onAddPost,
  onTriggerCommunityReply,
  onLikePost,
  loadingReplies,
}: CommunityForumProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError("Both a distress signal title and description are required.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      // Add the post
      const newPostId = await onAddPost(title.trim(), category, content.trim());
      
      // Clear fields and minimize
      setTitle("");
      setContent("");
      setIsPosting(false);

      // Trigger AI simulated members replying!
      await onTriggerCommunityReply(newPostId, category, content.trim());
    } catch (err) {
      console.error(err);
      setFormError("Failed to broadcast distress signals. Server connection lost.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Forum Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <span>Community Panic & Support Board</span>
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Broadcast your procrastination panic and get dynamic, humorous AI advice from fellow slackers.
          </p>
        </div>

        <button
          onClick={() => setIsPosting(!isPosting)}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-mono text-xs font-semibold py-2 px-4 rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{isPosting ? "CLOSE PANEL" : "BROADCAST PANIC"}</span>
        </button>
      </div>

      {/* Distress Post Form */}
      <AnimatePresence>
        {isPosting && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="bg-[#0f172a]/70 border border-pink-500/10 rounded-2xl p-6 space-y-4 shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-widest text-pink-400 mb-2">
                    Distress Signal Title / Procrastination Crisis
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setFormError("");
                    }}
                    placeholder="e.g., Exam starting in 3 hours, currently playing browser games..."
                    className="w-full bg-[#1e293b]/50 border border-gray-700 focus:border-pink-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none text-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-widest text-pink-400 mb-2">
                    Crisis Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#1e293b]/50 border border-gray-700 focus:border-pink-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none text-white font-sans"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-pink-400 mb-2">
                  Write your story (vent out your complete lack of focus)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setFormError("");
                  }}
                  placeholder="Tell us about the font choosing crisis, the sudden cleaning of the entire bathroom instead of working, or the panic naps..."
                  rows={4}
                  className="w-full bg-[#1e293b]/50 border border-gray-700 focus:border-pink-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none text-white placeholder-gray-500 resize-none font-sans"
                />
              </div>

              {formError && <p className="text-xs text-red-400 font-mono">⚠ {formError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 hover:from-pink-400 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5 border-t border-white/10"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                    <span>BROADCASTING PANIC FREQUENCIES...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-1 animate-pulse" />
                    <span>BROADCAST PANIC & GET AI SUPPORT</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Forum Feed */}
      <div className="space-y-5">
        {posts.map((post) => {
          const loadingReply = loadingReplies[post.id];
          return (
            <motion.div
              key={post.id}
              layout
              className="bg-[#0f172a]/70 border border-gray-800 rounded-3xl p-6 relative"
            >
              <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-gray-800 to-transparent" />

              {/* Author & Timestamp */}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-3 font-mono">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{AVATAR_MAP[post.avatarSeed] || "👤"}</span>
                  <span className="font-semibold text-gray-300">@{post.authorName}</span>
                </div>
                <span>{post.timestamp}</span>
              </div>

              {/* Title & Category */}
              <div className="space-y-1.5 mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded leading-none">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-base font-extrabold text-white tracking-tight leading-snug">
                  {post.title}
                </h3>
              </div>

              {/* Main Content */}
              <p className="text-xs text-gray-300 leading-relaxed font-sans mb-4 whitespace-pre-wrap">
                {post.content}
              </p>

              {/* Like / Reactions panel */}
              <div className="flex items-center space-x-4 border-t border-gray-800/60 pt-4 mt-4">
                <button
                  onClick={() => onLikePost(post.id)}
                  className={`flex items-center space-x-1.5 text-xs font-mono transition-all px-3 py-1.5 rounded-xl border ${
                    post.userLiked
                      ? "bg-pink-500/15 border-pink-500/30 text-pink-400 font-bold"
                      : "bg-[#111827]/40 border-gray-800/80 text-gray-500 hover:text-pink-400"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${post.userLiked ? "fill-current" : ""}`} />
                  <span>{post.likes} Sliders Agree</span>
                </button>

                <div className="text-[10px] font-mono text-gray-500 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{post.replies.length} AI Companions commenting</span>
                </div>
              </div>

              {/* Nested Replies Section */}
              {post.replies.length > 0 || loadingReply ? (
                <div className="mt-4 pt-4 border-t border-gray-800/40 space-y-3">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-2">
                    AI SUPPORT RESPONSES
                  </p>

                  <div className="space-y-3 pl-3 md:pl-6 border-l-2 border-indigo-500/10">
                    {post.replies.map((reply) => (
                      <div key={reply.id} className="bg-[#111827]/50 border border-gray-800/60 rounded-2xl p-4 text-xs relative">
                        <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs">{AVATAR_MAP[reply.avatarSeed] || "🤖"}</span>
                            <span className="font-bold text-gray-300">{reply.authorName}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase leading-none font-bold bg-gradient-to-br ${
                              MODE_COLOR_MAP[reply.mode] || "from-gray-500 to-gray-600 text-gray-300"
                            }`}>
                              {reply.mode}
                            </span>
                          </div>
                          <span>{reply.timestamp}</span>
                        </div>

                        <p className="text-gray-300 leading-relaxed font-sans">{reply.content}</p>
                      </div>
                    ))}

                    {/* Simulating Active typing indicator */}
                    {loadingReply && (
                      <div className="bg-[#111827]/30 border border-dashed border-gray-800 rounded-2xl p-4 text-xs flex items-center space-x-3 text-gray-500 font-mono">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400 flex-shrink-0" />
                        <span className="animate-pulse">Active forum members are drafting replies...</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
