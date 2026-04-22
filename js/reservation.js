export function setupReservations() {
  const form = document.getElementById("reserveForm")
  if (!form) return

  const dateInput = document.getElementById("reserveDate")
  const msg = document.getElementById("reserveMsg")

  if (dateInput) {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    dateInput.min = `${year}-${month}-${day}`
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("reserveName").value.trim()
    const email = document.getElementById("reserveEmail").value.trim()
    const room = document.getElementById("reserveRoom").value
    const date = document.getElementById("reserveDate").value
    const start = document.getElementById("reserveStart").value
    const end = document.getElementById("reserveEnd").value
    const studentId = localStorage.getItem("profileStudentId") || ""

    if (!name || !email || !room || !date || !start || !end) {
      msg.textContent = "Please fill in all fields."
      msg.style.color = "red"
      return
    }

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          studentId,
          room,
          date,
          start,
          end
        })
      })

      const result = await response.json()

      if (!response.ok) {
        msg.textContent = result.message
        msg.style.color = "red"
        return
      }

      localStorage.setItem("profileName", name)
      localStorage.setItem("userEmail", email.toLowerCase())

      msg.textContent = result.message
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

      if (dateInput) {
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, "0")
        const day = String(today.getDate()).padStart(2, "0")
        dateInput.min = `${year}-${month}-${day}`
      }
    } catch (error) {
      msg.textContent = "Unable to connect to the server."
      msg.style.color = "red"
    }
  })
}