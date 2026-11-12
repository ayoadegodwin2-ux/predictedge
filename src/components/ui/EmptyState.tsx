import { cn } from "@/lib/utils";
import { CalendarOff, Sunrise, Coffee, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  variant: "daily" | "weekend" | "generic" | "history";
  className?: string;
}

const variants: Record<
  EmptyStateProps["variant"],
  { icon: LucideIcon; heading: string; body: string }
> = {
  daily: {
    icon: Coffee,
    heading: "No pick yet today",
    body: "Our algorithm runs every morning at 8:00 AM. Check back soon — your daily prediction is on its way.",
  },
  weekend: {
    icon: Sunrise,
    heading: "Weekend slate coming soon",
    body: "The 50-game weekend lineup drops every Saturday morning. Sit tight — we\u2019re analyzing the matchups.",
  },
  generic: {
    icon: CalendarOff,
    heading: "Nothing to show right now",
    body: "There are no predictions available for this view. New data is loaded automatically — no action needed.",
  },
  history: {
    icon: CalendarOff,
    heading: "No historical records yet",
    body: "There are no previous predictions logged in the database. As daily and weekend slates run and settle, verified outcomes will appear here.",
  },
};

export function EmptyState({ variant, className }: EmptyStateProps) {
  const { icon: Icon, heading, body } = variants[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-20 px-6",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 mb-6">
        <Icon className="h-7 w-7 text-slate-500" strokeWidth={1.5} />
      </div>
      <h3 className="font-heading text-xl font-semibold text-slate-200 mb-2">
        {heading}
      </h3>
      <p className="max-w-sm text-sm leading-relaxed text-slate-500">{body}</p>
    </div>
  );
}
