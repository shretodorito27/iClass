export function setupComplaints() {
  const form = document.getElementById("complaintForm")
  if (!form) return

  const msg = document.getElementById("complaintMsg")

  if (window.location.protocol === "file:") {
    msg.textContent = "Please open the app through http://localhost:8080 and start the Node server before submitting a complaint."
    msg.style.color = "red"
    return
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("complaintName").value.trim()
    const email = document.getElementById("complaintEmail").value.trim()
    const category = document.getElementById("complaintCategory").value
    const room = document.getElementById("complaintRoom").value.trim()
    const date = document.getElementById("complaintDate").value
    const message = document.getElementById("complaintMessage").value.trim()

    if (!name || !email || !category || !message) {
      msg.textContent = "Please fill in all required fields."
      msg.style.color = "red"
      return
    }

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          category,
          room,
          date,
          message
        })
      })

      const result = await response.json()

      if (!response.ok) {
        msg.textContent = result.message || "Failed to submit complaint."
        msg.style.color = "red"
        return
      }

      msg.textContent = result.message
      msg.style.color = "green"

      form.reset()

      setTimeout(() => {
        msg.textContent = ""
      }, 5000)
    } catch (error) {
      console.error("Error submitting complaint:", error)
      msg.textContent = "Unable to connect to the server."
      msg.style.color = "red"
    }
  })
}
