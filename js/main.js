import { setupNavTabs } from "./nav.js";
import { loadAndRenderSchedule } from "./schedule.js";
import { setupReservations } from "./reservation.js";

// Detect which page we are on
const onIndex = window.location.pathname.endsWith("index.html") || window.location.pathname === "/";
const onReserve = window.location.pathname.endsWith("reserve.html");

// Run only what each page needs
if (onIndex) {
  setupNavTabs();
  loadAndRenderSchedule();
}

if (onReserve) {
  setupReservations();

  // Auto-select room from ?room=ENG-101
  const params = new URLSearchParams(window.location.search);
  const selectedRoom = params.get("room");
  if (selectedRoom) {
    const roomSelect = document.getElementById("reserveRoom");
    if (roomSelect) roomSelect.value = selectedRoom;
  }
}
