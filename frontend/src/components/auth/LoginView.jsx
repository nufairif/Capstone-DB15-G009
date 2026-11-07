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
    <div className="min-h-screen bg-[#F1F4F9] text-slate-900 flex flex-col justify-between p-6 md:p-10 relative overflow-hidden">
      {/* Ambient Spatial Lighting Orbs */}
      <div className="fixed top-[-8%] left-[-5%] w-[42vw] h-[42vw] max-w-[560px] max-h-[560px] rounded-full bg-gradient-to-br from-indigo-300/25 via-sky-200/20 to-transparent blur-[110px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-10%] right-[-6%] w-[46vw] h-[46vw] max-w-[620px] max-h-[620px] rounded-full bg-gradient-to-tl from-emerald-300/20 via-teal-200/20 to-transparent blur-[120px] pointer-events-none -z-10" />
      <div className="fixed top-[35%] right-[15%] w-[30vw] h-[30vw] max-w-[420px] max-h-[420px] rounded-full bg-gradient-to-tr from-amber-200/15 via-purple-200/15 to-transparent blur-[130px] pointer-events-none -z-10" />

      {/* Top Brand Logo */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-slate-950 text-white flex items-center justify-center font-extrabold text-base shadow-lg shadow-black/15">
            tf
          </div>
          <div>
            <p className="font-bold text-base tracking-tight text-slate-900">Toko Firaza</p>
            <p className="text-xs text-slate-400">
              AI Custom Order Manager • DB15-G009
            </p>
          </div>
        </div>

      </div>

      {/* Center Login Card */}
      <div className="max-w-[460px] w-full mx-auto my-auto apple-glass-card rounded-[36px] p-8 md:p-10 space-y-6 relative overflow-hidden shadow-2xl z-10 border border-white/80">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Masuk ke Akun 👋
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Masuk ke workspace manajemen pesanan bordir & ekstraksi AI Toko Firaza.
          </p>
        </div>

        {redirectTarget && (
          <div className="px-3.5 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-900 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span>
              Silakan login untuk membuka halaman{" "}
              <strong className="font-mono text-slate-900">{redirectTarget}</strong>
            </span>
          </div>
        )}

        {authError && (
          <div className="px-4 py-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs font-semibold flex items-center justify-between">
            <span>{authError}</span>
            <button type="button" onClick={() => setAuthError("")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-900 transition-colors"
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
            className="w-full py-4 px-6 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-xl shadow-black/15 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span>{authLoading ? "Memverifikasi..." : "Masuk ke Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Role Switcher Pills (RBAC Demo) */}
        <div className="pt-4 border-t border-slate-200/60 space-y-2.5">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
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
                  className={`w-full px-4 py-3 rounded-2xl text-left text-xs flex items-center justify-between transition-all border ${
                    active
                      ? "bg-slate-950 text-white font-semibold border-slate-950 shadow-md scale-[1.01]"
                      : "apple-glass-pill hover:bg-white text-slate-700 border-white/80"
                  }`}
                >
                  <div>
                    <span className="font-bold">{acc.full_name}</span>
                    <span
                      className={`ml-2 text-[11px] ${
                        active ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      • {acc.role}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[11px] ${
                      active ? "text-slate-300" : "text-slate-400"
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

      <div className="max-w-6xl w-full mx-auto text-center text-xs text-slate-400 relative z-10">
        Toko Firaza Full-Stack Order & Production System • Tim DB15-G009
      </div>
    </div>
  );
}

