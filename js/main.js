import { setupNavTabs } from "./nav.js";
import { loadAndRenderSchedule } from "./schedule.js";

setupNavTabs();
loadAndRenderSchedule();

// ===== Single-page navigation (show/hide sections) =====
const pages = Array.from(document.querySelectorAll(".page"));
const navLinks = Array.from(document.querySelectorAll(".navlink"));
const goLinks = Array.from(document.querySelectorAll("[data-go]"));

function showPage(pageId) {
  // hide all pages
  pages.forEach((p) => p.classList.remove("active"));

  // show requested page
  const page = document.getElementById(pageId);
  if (page) page.classList.add("active");

  // update active nav link (only those that have data-page)
  navLinks.forEach((a) => {
    const isMatch = a.dataset.page === pageId;
    a.classList.toggle("active", isMatch);
  });

  // optional: keep URL hash in sync
  window.location.hash = pageId;
}

// Nav clicks
navLinks.forEach((a) => {
  const target = a.dataset.page;
  if (!target) return; // e.g., "Sign In" has no data-page (goes to another HTML file)

  a.addEventListener("click", (e) => {
    e.preventDefault();
    showPage(target);
  });
});

// Buttons/links like "Reserve a Room"
goLinks.forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const target = a.dataset.go;
    showPage(target);
  });
});

// On refresh, open the hash page if present (e.g., #reservePage)
const initial = window.location.hash.replace("#", "");
if (initial) showPage(initial);

// ===== Reserve form validation (max 6 hours) =====
const reserveForm = document.getElementById("reserveForm");
const reserveMsg = document.getElementById("reserveMsg");

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

if (reserveForm) {
  reserveForm.addEventListener("submit", (e) => {
    e.preventDefault();
    reserveMsg.textContent = "";

    const start = document.getElementById("reserveStart").value;
    const end = document.getElementById("reserveEnd").value;

    const startMin = timeToMinutes(start);
    const endMin = timeToMinutes(end);

    if (endMin <= startMin) {
      reserveMsg.textContent = "End time must be after start time.";
      return;
    }

    const duration = endMin - startMin;
    if (duration > 6 * 60) {
      reserveMsg.textContent = "You can’t reserve a room for longer than 6 hours.";
      return;
    }

    reserveMsg.textContent = "Reservation submitted successfully!";
    reserveForm.reset();
  });
}