import { format, isThisYear, isToday, isYesterday } from "date-fns";

export function formatNoteDate(iso: string): string {
  const date = new Date(iso);

  if (isToday(date)) {
    return format(date, "h:mm a");
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  if (isThisYear(date)) {
    return format(date, "MMM d");
  }

  return format(date, "MMM d, yyyy");
}
