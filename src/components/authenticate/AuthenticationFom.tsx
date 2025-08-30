"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

interface AuthenticationFormProps {
  onSuccess?: () => Promise<void> | void;
  handlerAction?: () => void;
  isGuest?: boolean;
  callbackUrl?: string; // relative path preferred (starts with "/")
}

const ERROR_MAP: Record<string, string> = {
  CredentialsSignin: "Invalid email or password.",
  OAuthSignin: "Could not sign in with the provider.",
  OAuthCallback: "The provider did not authorize this login.",
  OAuthAccountNotLinked:
    "Account already exists with a different sign-in method.",
  default: "Login failed. Please try again.",
};

export default function AuthenticationForm({
  onSuccess,
  handlerAction = () => {},
  isGuest = false,
  callbackUrl,
}: AuthenticationFormProps) {
  const pathname = usePathname();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { loginWithCredentials, loginWithProvider, isAuthBusy } = useUser();

  const safeCb = useMemo(() => {
    if (!callbackUrl) return pathname || "/profile";
    try {
      const u = new URL(callbackUrl, "http://dummy");
      return u.pathname + u.search + u.hash;
    } catch {
      return callbackUrl.startsWith("/") ? callbackUrl : pathname || "/profile";
    }
  }, [callbackUrl, pathname]);

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const match = document.cookie.match(/guest_id=([^;]+)/);
    if (!match) {
      const guestId = crypto.randomUUID();
      document.cookie = `guest_id=${guestId}; max-age=${
        60 * 60 * 24 * 30
      }; path=/; SameSite=Lax`;
      location.reload()
    }
    handlerAction?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: fullName, email, password }),
        });
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({ error: "" }));
          throw new Error(msg || "Signup failed");
        }
      }

      const result = await loginWithCredentials({
        email,
        password,
        callbackUrl: safeCb,
      });

      if (!result.ok) {
        setError(ERROR_MAP[result.error] ?? ERROR_MAP.default);
        return;
      }

      await onSuccess?.(); // close modal
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
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
            onClick={() => {
              setMode(m);
              setError(null);
            }}
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
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
          />

          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-400"
            required
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />

          <button
            type="submit"
            disabled={loading || isAuthBusy}
            className={`w-full py-2 rounded-md transition ${
              mode === "login"
                ? "bg-indigo-500 hover:bg-indigo-600 text-white"
                : "bg-pink-500 hover:bg-pink-600 text-white"
            }`}
          >
            {loading || isAuthBusy
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
        <button
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"
          type="button"
          onClick={() =>
            loginWithProvider({ provider: "google", callbackUrl: safeCb })
          }
          aria-label="Sign in with Google"
        >
          <GlobeAltIcon className="h-6 w-6 text-gray-600" />
        </button>

        <button className="p-2 bg-gray-100 rounded-full" type="button" disabled>
          <DevicePhoneMobileIcon className="h-6 w-6 text-gray-600" />
        </button>
        <button className="p-2 bg-gray-100 rounded-full" type="button" disabled>
          <CubeIcon className="h-6 w-6 text-gray-600" />
        </button>

        {isGuest && (
          <button
            className="text-sm text-gray-500 hover:text-gray-700 hover:underline mt-4"
            onClick={handleGuestLogin}
            type="button"
          >
            Continue as Guest
          </button>
        )}
      </motion.div>

      <motion.div
        className="mt-6 text-center text-gray-500 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.8 } }}
      >
        {mode === "login" ? "Don't have an account?" : "Already have an account?"}
        <button
          className="ml-1 text-indigo-500 hover:underline focus:outline-none"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setError(null);
          }}
          type="button"
        >
          {mode === "login" ? "Sign Up" : "Log In"}
        </button>
      </motion.div>
    </div>
  );
}
