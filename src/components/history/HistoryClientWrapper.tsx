"use client";

import { useState, useEffect } from "react";
import { HistoryView } from "@/components/history/HistoryView";
import {
  calculateAccuracy,
  type HistoricalPredictionItem,
  type AccuracySummary,
} from "@/lib/engine/history-shared";

interface HistoryClientWrapperProps {
  initialHistory: HistoricalPredictionItem[];
  daysList: Array<{
    dateStr: string;
    displayLabel: string;
    dayOfWeek: string;
    isToday: boolean;
  }>;
  initialAccuracy: AccuracySummary;
}

export function HistoryClientWrapper({
  initialHistory,
  daysList,
  initialAccuracy,
}: HistoryClientWrapperProps) {
  const [historyData, setHistoryData] = useState<HistoricalPredictionItem[]>(initialHistory);

  useEffect(() => {
    // Re-verify against live endpoint on client mount without any caching
    fetch("/api/predictions/history", { cache: "no-store" })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.history?.length > 0) {
          setHistoryData(json.data.history);
        }
      })
      .catch((err) => {
        console.warn("Client history fetch fallback to server data:", err);
      });
  }, []);

  const accuracy = historyData === initialHistory ? initialAccuracy : calculateAccuracy(historyData);

  return (
    <HistoryView
      initialHistory={historyData}
      daysList={daysList}
      accuracy={accuracy}
    />
  );
}

