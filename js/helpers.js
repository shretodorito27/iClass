// Helpers used by schedule rendering

    export const weekdayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    export  const weekdayOrder = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
      

    export function timeToMins(hhmm) {
        const [h, m] = (hhmm || "0:00").split(":").map(Number);
        return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
    }
    export function padTime(t) {
         const [h, m] = t.split(":");
         return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
     }