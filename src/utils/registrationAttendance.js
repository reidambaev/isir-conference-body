import {
  CONGRESS_DAYPASS_DAYS,
  formatCongressMealDayList,
} from "../config/constants";

export function parseRegistrationDayList(raw) {
  if (raw == null || raw === "") return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const CONGRESS_DAY_KEYS = CONGRESS_DAYPASS_DAYS.map((d) => d.key);

export function getRegistrationCongressAttendance(reg) {
  const ticketType = reg?.ticket_type;
  if (ticketType === "korea-day-pass") {
    const days = parseRegistrationDayList(reg.day_pass_days);
    return {
      mode: "day-pass",
      label: days.length
        ? formatCongressMealDayList(days)
        : "No days selected",
      days,
    };
  }
  return {
    mode: "full",
    label: "Full congress (Thu–Sun)",
    days: [...CONGRESS_DAY_KEYS],
  };
}

export function formatCongressAttendanceForCsv(reg) {
  const att = getRegistrationCongressAttendance(reg);
  const daySet = new Set(att.days);
  const yesNo = (day) => (daySet.has(day) ? "Yes" : "No");
  return {
    attendance_mode: att.mode === "full" ? "Full congress" : "Day pass",
    congress_days: att.label,
    thursday: yesNo("Thursday"),
    friday: yesNo("Friday"),
    saturday: yesNo("Saturday"),
    sunday: yesNo("Sunday"),
  };
}
