const PH_TIME_ZONE = "Asia/Manila";

/** Current hour (0-23) in Philippine time, regardless of the visitor's own timezone. */
export function getPHHour(date: Date = new Date()): number {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone: PH_TIME_ZONE,
  }).format(date);
  // Intl can return "24" for midnight in some environments — normalize to 0.
  const hour = Number(hourStr);
  return hour === 24 ? 0 : hour;
}

/** Time-of-day greeting based on Philippine Standard Time. */
export function getGreeting(date: Date = new Date()): string {
  const hour = getPHHour(date);
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 18) return "Good afternoon";
  if (hour >= 18 && hour < 22) return "Good evening";
  return "Still up late";
}

/** e.g. "Thursday, July 2 · 10:45 AM PH" */
export function formatPHDateTime(date: Date = new Date()): string {
  const day = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: PH_TIME_ZONE,
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: PH_TIME_ZONE,
  }).format(date);
  return `${day} · ${time} `;
}

/** First name from a full name, or a friendly fallback. */
export function firstNameOf(fullName?: string | null, email?: string | null): string {
  if (fullName?.trim()) return fullName.trim().split(/\s+/)[0];
  if (email) return email.split("@")[0];
  return "there";
}
