import React, { useState } from "react";
import { Eye, EyeOff, ArrowRight, X } from "lucide-react";
import { DEMO_ACCOUNTS, inputSoftClass } from "../../constants";

export default function LoginView({
  loginForm,
  setLoginForm,
  handleLogin,
  authLoading,
  authError,
  setAuthError,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const redirectTarget =
    typeof window !== "undefined"
      ? sessionStorage.getItem("firaza_login_redirect")
      : null;

  return (
    <div className="min-h-screen bg-[#F4F5F9] text-[#111111] flex flex-col justify-between p-6 md:p-10">
      {/* Top Brand Logo */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-extrabold text-base shadow-md">
            tf
          </div>
          <div>
            <p className="font-bold text-base tracking-tight">Toko Firaza</p>
            <p className="text-xs text-neutral-400">
              AI Custom Order Manager • DB15-G009
            </p>
          </div>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-white text-xs font-semibold text-neutral-500 shadow-soft">
          100% Local AI Engine
        </span>
      </div>

      {/* Center Login Card */}
      <div className="max-w-[440px] w-full mx-auto my-auto bg-white rounded-[32px] p-8 md:p-10 shadow-soft space-y-6">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#111111]">
            Masuk ke Akun 👋
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Masuk ke workspace manajemen pesanan bordir & ekstraksi AI Toko Firaza.
          </p>
        </div>

        {redirectTarget && (
          <div className="px-3.5 py-2.5 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-xs text-amber-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>
              Silakan login untuk membuka halaman{" "}
              <strong className="font-mono text-black">{redirectTarget}</strong>
            </span>
          </div>
        )}

        {authError && (
          <div className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 text-xs font-semibold flex items-center justify-between">
            <span>{authError}</span>
            <button type="button" onClick={() => setAuthError("")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Username atau Email
            </label>
            <input
              type="text"
              required
              value={loginForm.username}
              onChange={(e) =>
                setLoginForm({ ...loginForm, username: e.target.value })
              }
              placeholder="admin"
              className={inputSoftClass}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                placeholder="••••••••"
                className={`${inputSoftClass} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5 text-neutral-400 hover:text-[#111111]"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>{authLoading ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Role Switcher Pills (RBAC Demo) */}
        <div className="pt-4 border-t border-neutral-100 space-y-2.5">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
            Pilih Role Akun Demo (RBAC Aktif):
          </p>
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const active = loginForm.username === acc.username;
              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => {
                    setLoginForm({
                      username: acc.username,
                      password: acc.password,
                    });
                    setAuthError("");
                  }}
                  className={`w-full px-4 py-2.5 rounded-2xl text-left text-xs flex items-center justify-between transition-all ${
                    active
                      ? "bg-[#0A0A0A] text-white font-semibold shadow-sm"
                      : "bg-[#F8F9FC] hover:bg-neutral-100 text-neutral-700"
                  }`}
                >
                  <div>
                    <span className="font-bold">{acc.full_name}</span>
                    <span
                      className={`ml-2 text-[11px] ${
                        active ? "text-neutral-300" : "text-neutral-400"
                      }`}
                    >
                      • {acc.role}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[11px] ${
                      active ? "text-neutral-300" : "text-neutral-400"
                    }`}
                  >
                    {acc.username}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto text-center text-xs text-neutral-400">
        Toko Firaza Full-Stack Order & Production System • Tim DB15-G009
      </div>
    </div>
  );
}

