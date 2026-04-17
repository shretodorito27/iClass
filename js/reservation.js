export function setupReservations() {
  const form = document.getElementById("reserveForm");
  if (!form) return; // not on reserve page

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("reserveName").value.trim();
    const email = document.getElementById("reserveEmail").value.trim();
    const room = document.getElementById("reserveRoom").value;
    const date = document.getElementById("reserveDate").value;
    const start = document.getElementById("reserveStart").value;
    const end = document.getElementById("reserveEnd").value;

    const msg = document.getElementById("reserveMsg"); 

    msg.textContent = `Reservation submitted for ${room} on ${date} from ${start} to ${end}.`;
    msg.style.color = "green"; 

    form.reset();
  });
}
