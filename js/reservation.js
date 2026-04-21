export function setupReservations() {
  const form = document.getElementById("reserveForm")
  if (!form) return

  form.addEventListener("submit", (e) => {
    e.preventDefault()

    const name = document.getElementById("reserveName").value.trim()
    const email = document.getElementById("reserveEmail").value.trim()
    const room = document.getElementById("reserveRoom").value
    const date = document.getElementById("reserveDate").value
    const start = document.getElementById("reserveStart").value
    const end = document.getElementById("reserveEnd").value

    const msg = document.getElementById("reserveMsg")

    if (!name || !email || !room || !date || !start || !end) {
      msg.textContent = "Please fill in all fields."
      msg.style.color = "red"
      return
    }

    const reservation = {
      name,
      email,
      room,
      date,
      start,
      end
    }

    localStorage.setItem("profileName", name)
    localStorage.setItem("userEmail", email.toLowerCase())
    localStorage.setItem("currentReservation", JSON.stringify(reservation))

    msg.textContent = `Reservation submitted for ${room} on ${date} from ${start} to ${end}.`
    msg.style.color = "green"

    form.reset()

    const savedEmail = localStorage.getItem("userEmail")
    const savedName = localStorage.getItem("profileName")

    const emailInput = document.getElementById("reserveEmail")
    const nameInput = document.getElementById("reserveName")

    if (savedEmail && emailInput) {
      emailInput.value = savedEmail
    }

    if (savedName && nameInput) {
      nameInput.value = savedName
    }
  })
}