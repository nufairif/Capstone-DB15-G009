import React from "react";

export default function Toast({ notification }) {
  if (!notification) return null;

  const isError = notification.type === "error";

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`px-5 py-3 rounded-2xl shadow-tooltip text-xs font-bold flex items-center gap-2.5 ${
          isError ? "bg-red-600 text-white" : "bg-[#0A0A0A] text-white"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isError ? "bg-red-200" : "bg-[#22C55E]"
          }`}
        />
        <span>{notification.msg}</span>
      </div>
    </div>
  );
}

