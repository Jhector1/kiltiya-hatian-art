// File: src/components/AuthenticationForm.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { signIn } from "next-auth/react";
// import { useUser } from "@/contexts/UserContext";
// import { useCart } from "@/contexts/CartContext";
// import { useFavorites } from "@/contexts/FavoriteContext";

// interface AuthenticationFormProps {
//   closeModalAction: () => void;
// }

export default function AuthenticationForm(
//   {
//   // closeModalAction,
// }: AuthenticationFormProps

) {
  // const { setUser } = useUser();
  // const { refreshCart } = useCart();
  // const { refreshFavorites } = useFavorites();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // NextAuth’s credentials provider only supports “login” flow;
      // for signup you’ll still post to your /api/auth/signup endpoint,
      // but it can set the same cookie and then call signIn() to finish.
      if (mode === "signup") {
        // 1) call your signup endpoint to create the user & set cookie
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: fullName, email, password }),
        });
        if (!res.ok) {
          const { error: msg } = await res.json();
          throw new Error(msg || "Signup failed");
        }
      }

      // 2) Now sign in via NextAuth credentials provider:
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (!result || result.error) {
        throw new Error(result?.error || "Login failed");
      }

      // 3) Session is now active; pull session.user
      //    (you could also call `/api/auth/me`, but useSession will update)
      //    For simplicity, we’ll reload the page so that useSession context populates:
      window.location.reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.4 } },
  };
  const formVariants = {
    hidden: { x: mode === "login" ? -50 : 50, opacity: 0 },
    show: { x: 0, opacity: 1, transition: { duration: 0.5 } },
    exit: {
      x: mode === "login" ? 50 : -50,
      opacity: 0,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-xl">
      <motion.div
        className="flex justify-center mb-6 bg-gray-100 rounded-full p-1"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-6 py-2 rounded-full font-medium transition-all focus:outline-none ${
              mode === m
                ? "bg-white shadow-lg"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {m === "login" ? "Login" : "Sign Up"}
          </button>
        ))}
      </motion.div>

      {error && <p className="text-red-500 text-center mb-4">{error}</p>}

      <AnimatePresence mode="wait">
        <motion.form
          key={mode}
          onSubmit={handleSubmit}
          variants={formVariants}
          initial="hidden"
          animate="show"
          exit="exit"
          className="space-y-4"
        >
          {mode === "signup" && (
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              type="text"
              placeholder="Full Name"
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-400"
              required
            />
          )}

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-400"
            required
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-400"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md transition ${
              mode === "login"
                ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                : "bg-pink-500 hover:bg-pink-600 text-white"
            }`}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
              ? "Log In"
              : "Sign Up"}
          </button>
        </motion.form>
      </AnimatePresence>

      <motion.div
        className="mt-6 text-center text-gray-500 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.4 } }}
      >
        Or continue with
      </motion.div>
      <motion.div
        className="flex justify-center space-x-4 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.6 } }}
      >
        <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
          <GlobeAltIcon className="h-6 w-6 text-gray-600" />
        </button>
        <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
          <DevicePhoneMobileIcon className="h-6 w-6 text-gray-600" />
        </button>
        <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
          <CubeIcon className="h-6 w-6 text-gray-600" />
        </button>
      </motion.div>

      <motion.div
        className="mt-6 text-center text-gray-500 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.8 } }}
      >
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}
        <button
          className="ml-1 text-indigo-500 hover:underline focus:outline-none"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login" ? "Sign Up" : "Log In"}
        </button>
      </motion.div>
    </div>
  );
}
