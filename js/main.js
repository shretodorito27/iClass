import { setupNavTabs } from "./nav.js"
import { loadAndRenderSchedule } from "./schedule.js"
import { setupReservations } from "./reservation.js"
import { setupComplaints } from "./complaints.js"

// Detect which page we are on
const onIndex =
  window.location.pathname.endsWith("index.html") ||
  window.location.pathname === "/"

const onReserve = window.location.pathname.endsWith("reserve.html")
const onSignInSuccess = window.location.pathname.endsWith("signInSuccess.html")
const onMyProfile = window.location.pathname.endsWith("myProfile.html")

function isLoggedIn() {
  return localStorage.getItem("isLoggedIn") === "true"
}

function requireLoginForProtectedPage(targetAfterLogin = null) {
  if (!isLoggedIn()) {
    if (targetAfterLogin) {
      localStorage.setItem("redirectAfterLogin", targetAfterLogin)
    }
    window.location.href = "./signIn.html"
    return false
  }

  return true
}

function updateAuthLink() {
  const authLink = document.getElementById("authLink")
  if (!authLink) return

  if (isLoggedIn()) {
    authLink.textContent = "Sign Out"
    authLink.href = "#"

    authLink.addEventListener("click", function (event) {
      event.preventDefault()

      const confirmed = window.confirm("Are you sure you want to sign out?")
      if (!confirmed) {
        return
      }

      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("redirectAfterLogin")

      window.location.href = "./index.html"
    })
  } else {
    authLink.textContent = "Sign In"
    authLink.href = "./signIn.html"
  }
}

function updateProfileLink() {
  const profileLink = document.getElementById("profileLink")
  if (!profileLink) return

  profileLink.style.display = isLoggedIn() ? "inline-block" : "none"
}

function setupReserveLinks() {
  document.querySelectorAll(".reserve-link").forEach(link => {
    link.addEventListener("click", function (event) {
      event.preventDefault()

      const targetUrl = link.getAttribute("href") || "./reserve.html"

      if (isLoggedIn()) {
        window.location.href = targetUrl
      } else {
        localStorage.setItem("redirectAfterLogin", targetUrl)
        window.location.href = "./signIn.html"
      }
    })
  })
}

// Run only what each page needs
if (onIndex) {
  updateAuthLink()
  updateProfileLink()
  setupNavTabs()
  loadAndRenderSchedule()
  setupReserveLinks()
  setupComplaints()
}

if (onReserve) {
  const allowed = requireLoginForProtectedPage("./reserve.html" + window.location.search)

  if (allowed) {
    updateAuthLink()
    updateProfileLink()
    setupReservations()

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

    const params = new URLSearchParams(window.location.search)
    const selectedRoom = params.get("room")
    if (selectedRoom) {
      const roomSelect = document.getElementById("reserveRoom")
      if (roomSelect) {
        roomSelect.value = selectedRoom
      }
    }
  }
}

if (onMyProfile) {
  const allowed = requireLoginForProtectedPage("./myProfile.html")

  if (allowed) {
    updateAuthLink()
    updateProfileLink()
  }
}

if (onSignInSuccess) {
  if (!isLoggedIn()) {
    window.location.href = "./signIn.html"
  }
}