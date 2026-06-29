import React, { useState } from "react";
import { motion } from "motion/react";
import { Shield, Sparkles, Zap, Terminal, Loader2, Brain } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { signInAnonymously, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthPageProps {
  onSignInSuccess?: () => void;
  onLocalSignIn?: (user: any) => void;
}

const AVATAR_OPTIONS = [
  { seed: "panic", label: "Panicked", color: "from-red-500 to-orange-500", emoji: "😰" },
  { seed: "speedy", label: "Hyper Speed", color: "from-amber-400 to-yellow-600", emoji: "⚡" },
  { seed: "zen", label: "Zen master", color: "from-teal-400 to-emerald-600", emoji: "🧘" },
  { seed: "coach", label: "Executive", color: "from-purple-500 to-indigo-600", emoji: "🎩" },
];

export default function AuthPage({ onSignInSuccess, onLocalSignIn }: AuthPageProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("panic");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOfflineBypassOption, setShowOfflineBypassOption] = useState(false);

  const startLocalOfflineSession = () => {
    if (onLocalSignIn) {
      const randomId = Math.floor(100000 + Math.random() * 900000);
      onLocalSignIn({
        uid: `local_${randomId}`,
        email: `guest_${randomId}@clutchmind.local`,
        isAnonymous: true,
        isLocalGuest: true,
        username: username.trim() || `Guest_${Math.floor(1000 + Math.random() * 9000)}`
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user profile already exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const initialProfile = {
          username: (isSignUp && username.trim()) ? username.trim() : (user.displayName || `Agent_${Math.floor(1000 + Math.random() * 9000)}`),
          avatar: isSignUp ? selectedAvatar : "zen", // Default to Zen master for google sign ins
          personality: null,
          focusGoal: "",
          points: 10,
          streak: 1,
          lastActive: new Date().toISOString(),
          completedQuiz: false,
          badges: [],
        };
        await setDoc(doc(db, "users", user.uid), initialProfile);
      }

      if (onSignInSuccess) {
        onSignInSuccess();
      }
    } catch (err: any) {
      console.error("Google sign in failed:", err);
      if (err.code === "auth/operation-not-allowed" || err.code === "auth/admin-restricted-operation") {
        setShowOfflineBypassOption(true);
        setError("Google Sign-In is not enabled in your Firebase Console. Please enable Google provider in Firebase Auth, or start an Offline Demo Session!");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Google Sign-In popup was closed before completion.");
      } else {
        setError(err.message || "Unable to sign in with Google.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError("");
    setLoading(true);
    try {
      let user;
      try {
        const userCredential = await signInAnonymously(auth);
        user = userCredential.user;

        // Check if anonymous/fallback profile already exists
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          const initialProfile = {
            username: `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
            avatar: "panic",
            personality: null,
            focusGoal: "",
            points: 10,
            streak: 1,
            lastActive: new Date().toISOString(),
            completedQuiz: false,
            badges: [],
          };
          await setDoc(doc(db, "users", user.uid), initialProfile);
        }

        if (onSignInSuccess) {
          onSignInSuccess();
        }
      } catch (anonErr: any) {
        console.warn("Anonymous sign-in failed/disabled, using robust local offline guest fallback:", anonErr);
        if (anonErr.code === "auth/operation-not-allowed" || anonErr.code === "auth/admin-restricted-operation") {
          setShowOfflineBypassOption(true);
        }
        startLocalOfflineSession();
        return;
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/operation-not-allowed" || err.code === "auth/admin-restricted-operation") {
        setShowOfflineBypassOption(true);
        startLocalOfflineSession();
      } else {
        setError("Unable to initiate Guest Session: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-cyan-500/30">
      {/* Glow backgrounds */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Terminal Header Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 rounded-2xl blur-md opacity-70 group-hover:opacity-100 transition-opacity animate-pulse duration-3000" />
            <div className="relative p-4 bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-center">
              <div className="relative">
                <Brain className="w-10 h-10 text-cyan-400 stroke-[1.5]" />
                <div className="absolute -right-1 -bottom-1 bg-[#0b0f19] p-1 rounded-full border border-indigo-500/35 shadow-md">
                  <Zap className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-wider bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent font-sans">
            CLUTCHMIND
          </h1>
          <p className="text-xs text-gray-400 mt-2 tracking-widest font-mono uppercase">
            [ AI-Powered Procrastination Decimator ]
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#0f172a]/70 border border-gray-800 backdrop-blur-md rounded-3xl p-8 shadow-2xl relative">
          <div className="absolute -top-px left-10 right-10 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
          
          {/* Tab Selection */}
          <div className="flex bg-[#111827] p-1 rounded-xl border border-gray-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError("");
              }}
              className={`flex-1 py-2 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer ${
                !isSignUp
                  ? "bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError("");
              }}
              className={`flex-1 py-2 font-mono text-xs font-bold rounded-lg transition-all cursor-pointer ${
                isSignUp
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>

          <div className="space-y-4">
            {/* Username designation - Sign Up only */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">
                  User Designation (Optional Username)
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter custom username..."
                  className="w-full bg-[#1e293b]/50 border border-gray-700 focus:border-cyan-500/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-sans placeholder-gray-500 text-white"
                />
              </div>
            )}

            {/* Avatar Selector - Sign Up only */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">
                  Select Your Initial Vibe
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.seed}
                      type="button"
                      onClick={() => setSelectedAvatar(avatar.seed)}
                      className={`flex items-center space-x-3 p-3 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer group ${
                        selectedAvatar === avatar.seed
                          ? "bg-[#1e293b]/80 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.1)] text-white"
                          : "bg-[#111827]/40 border-gray-800 text-gray-400 hover:border-gray-700"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatar.color} flex items-center justify-center text-lg shadow-sm`}>
                        {avatar.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium font-sans truncate">{avatar.label}</p>
                        <p className="text-[10px] font-mono text-gray-500 truncate">{`@${avatar.seed}`}</p>
                      </div>
                      {selectedAvatar === avatar.seed && (
                        <div className="absolute right-2 top-2 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 mt-2 font-mono border border-red-500/20 bg-red-500/5 p-4 rounded-xl flex flex-col space-y-3"
              >
                <div>⚠ {error}</div>
                {showOfflineBypassOption && (
                  <button
                    type="button"
                    onClick={startLocalOfflineSession}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold py-2 px-3 rounded-lg shadow-md transition-all text-center text-xs font-sans uppercase tracking-wider cursor-pointer"
                  >
                    🚀 Start Offline Demo Session
                  </button>
                )}
              </motion.div>
            )}

            {/* Google Action Button - Main Cta */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleSignIn}
              className="w-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 disabled:opacity-60 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center space-x-2.5 border-t border-white/20 cursor-pointer mt-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.45 1.625l2.437-2.437C17.312 1.696 14.933 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.795 0 10.254-4.074 10.254-10.24 0-.695-.08-1.355-.22-1.955H12.24z"/>
                </svg>
              )}
              <span className="font-sans text-xs uppercase tracking-wider">
                {loading ? "AUTHENTICATING..." : isSignUp ? "Create Account with Google" : "Sign In with Google"}
              </span>
            </button>

            {/* Guest Entry alternative */}
            {!loading && (
              <div className="pt-2 text-center space-y-2">
                <span className="text-[10px] font-mono text-gray-500 block mb-1">OR</span>
                <div className="flex flex-col space-y-2 items-center">
                  <button
                    type="button"
                    onClick={handleGuestLogin}
                    className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    Continue as Guest Agent (Anonymous)
                  </button>
                  <button
                    type="button"
                    onClick={startLocalOfflineSession}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    ⚡ Bypass Auth (Offline Local Demo Mode)
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Subtext info */}
          <div className="mt-6 pt-6 border-t border-gray-800/80 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span className="flex items-center space-x-1">
              <Terminal className="w-3 h-3 text-cyan-500" />
              <span>SECURE END-TO-END AUTH</span>
            </span>
            <span>v1.0.5 - STABLE</span>
          </div>
        </div>

        {/* Dynamic quote underneath */}
        <div className="text-center mt-6 text-xs text-gray-500 font-mono italic max-w-xs mx-auto">
          "Procrastination is the arrogant assumption that God will give you another chance to do tomorrow what you were meant to do today."
        </div>
      </motion.div>
    </div>
  );
}
