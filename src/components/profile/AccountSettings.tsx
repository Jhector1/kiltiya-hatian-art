// ============================================================
// File: src/components/profile/AccountSettings.tsx
// Slick, accessible, responsive password change card
// ============================================================
"use client";

import { useMemo, useState } from "react";
import { KeyIcon, EyeIcon, EyeSlashIcon, ExclamationCircleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function AccountSettings() {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const strength = useMemo(() => {
    let s = 0;
    if (pw.length >= 8) s += 1;
    if (/[A-Z]/.test(pw)) s += 1;
    if (/[a-z]/.test(pw)) s += 1;
    if (/[0-9]/.test(pw)) s += 1;
    if (/[^A-Za-z0-9]/.test(pw)) s += 1;
    return s; // 0..5
  }, [pw]);

  const match = pw.length > 0 && pw === pw2;
  const valid = strength >= 3 && match;

  const strengthLabel = ["Very weak", "Weak", "Fair", "Good", "Strong", "Excellent"][strength] || "";
  const strengthPct = (strength / 5) * 100;

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900">Account Settings</h3>

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-gray-200 shadow-sm p-6">
        <form
          className="grid grid-cols-1 gap-5 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            // TODO: call your API
            alert("Password changed (demo)");
          }}
        >
          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <div className="mt-1 relative">
              <input
                id="new-password"
                type={showPw ? "text" : "password"}
                className="block w-full rounded-xl border border-gray-200 bg-white/90 px-3 py-2.5 pr-10 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-2.5 my-auto p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>

            {/* Strength meter */}
            <div className="mt-3">
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${strengthPct}%`, backgroundColor: strength >= 4 ? "#22c55e" : strength >= 3 ? "#f59e0b" : "#ef4444" }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-600">{strengthLabel}</p>
              <ul className="mt-1 text-xs text-gray-500 grid grid-cols-2 gap-x-3">
                <li className="flex items-center gap-1">{pw.length >= 8 ? <CheckCircleIcon className="h-4 w-4 text-emerald-500"/> : <ExclamationCircleIcon className="h-4 w-4 text-gray-400"/>} 8+ characters</li>
                <li className="flex items-center gap-1">{/[A-Z]/.test(pw) ? <CheckCircleIcon className="h-4 w-4 text-emerald-500"/> : <ExclamationCircleIcon className="h-4 w-4 text-gray-400"/>} Uppercase A–Z</li>
                <li className="flex items-center gap-1">{/[0-9]/.test(pw) ? <CheckCircleIcon className="h-4 w-4 text-emerald-500"/> : <ExclamationCircleIcon className="h-4 w-4 text-gray-400"/>} Number 0–9</li>
                <li className="flex items-center gap-1">{/[^A-Za-z0-9]/.test(pw) ? <CheckCircleIcon className="h-4 w-4 text-emerald-500"/> : <ExclamationCircleIcon className="h-4 w-4 text-gray-400"/>} Symbol !@#</li>
              </ul>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                id="confirm-password"
                type={showPw2 ? "text" : "password"}
                className={`block w-full rounded-xl border bg-white/90 px-3 py-2.5 pr-10 text-gray-900 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${pw2 && !match ? "border-rose-300" : "border-gray-200"}`}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw2((v) => !v)}
                className="absolute inset-y-0 right-2.5 my-auto p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
                aria-label={showPw2 ? "Hide password" : "Show password"}
              >
                {showPw2 ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
            {!match && pw2.length > 0 && (
              <p className="mt-1 text-sm text-rose-600" role="alert">Passwords do not match.</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!valid}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${valid ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-300 text-gray-700"}`}
            >
              <KeyIcon className="h-5 w-5" />
              Change Password
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
