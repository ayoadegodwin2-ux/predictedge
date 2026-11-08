"use client";

import { useEffect } from "react";

export function VisitorTracker() {
  useEffect(() => {
    // Only track in browser environment once per session
    if (typeof window === "undefined") return;

    const sessionKey = `predictedge_visited_${new Date().toISOString().split("T")[0]}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const timer = setTimeout(() => {
      fetch("/api/analytics/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      })
        .then(() => {
          sessionStorage.setItem(sessionKey, "1");
        })
        .catch(() => {
          // Silent fallback
        });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

