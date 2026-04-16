export async function setupReservations() {
  const form = document.getElementById("reserveForm");
  if (!form) return; // not on reserve page

  // Check authentication status
  try {
    const authResponse = await fetch("/api/auth/status");
    const authData = await authResponse.json();

    if (!authData.authenticated) {
      // User not signed in, redirect to sign in
      showAuthMessage("You must be signed in to make a reservation.");
      setTimeout(() => {
        window.location.href = "signIn.html";
      }, 2000);
      return;
    }

    // User is signed in, pre-fill email
    const emailInput = document.getElementById("reserveEmail");
    if (emailInput) {
      emailInput.value = authData.email;
      emailInput.readOnly = true; // Make email read-only since it's from session
    }
  } catch (error) {
    console.error("Error checking authentication:", error);
    showAuthMessage("Unable to verify authentication status.");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("reserveName").value.trim();
    const email = document.getElementById("reserveEmail").value.trim();
    const room = document.getElementById("reserveRoom").value;
    const date = document.getElementById("reserveDate").value;
    const start = document.getElementById("reserveStart").value;
    const end = document.getElementById("reserveEnd").value;

    const msg = document.getElementById("reserveMsg");

    // Basic client-side validation
    if (!name || !email || !room || !date || !start || !end) {
      msg.textContent = "Please fill in all fields.";
      msg.style.color = "red";
      return;
    }

    // Validate time
    if (start >= end) {
      msg.textContent = "End time must be after start time.";
      msg.style.color = "red";
      return;
    }

    msg.textContent = "Submitting reservation...";
    msg.style.color = "blue";

    try {
      const response = await fetch("/api/reserve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          room,
          date,
          startTime: start,
          endTime: end
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        msg.textContent = result.message;
        msg.style.color = "green";
        form.reset();
        // Re-fill email after reset
        document.getElementById("reserveEmail").value = email;
      } else {
        msg.textContent = result.message || "Reservation failed.";
        msg.style.color = "red";
      }
    } catch (error) {
      console.error("Reservation error:", error);
      msg.textContent = "Unable to connect to the server. Please try again.";
      msg.style.color = "red";
    }
  });
}

function showAuthMessage(message) {
  const msg = document.getElementById("reserveMsg");
  if (msg) {
    msg.textContent = message;
    msg.style.color = "red";
  } else {
    // Create message element if it doesn't exist
    const form = document.getElementById("reserveForm");
    if (form) {
      const newMsg = document.createElement("p");
      newMsg.id = "reserveMsg";
      newMsg.className = "msg";
      newMsg.textContent = message;
      newMsg.style.color = "red";
      form.appendChild(newMsg);
    }
  }
}
