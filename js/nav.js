// Navigation bar tab switching
export function setupNavTabs() {
  function showPage(pageId) {
    if (!pageId) {
      return
    }

    const targetPage = document.getElementById(pageId)

    if (!targetPage) {
      return
    }

    // Remove active from all navbar links
    document.querySelectorAll(".navlink").forEach(function (link) {
      link.classList.remove("active")
    })

    // Hide all pages
    document.querySelectorAll(".page").forEach(function (page) {
      page.classList.remove("active")
    })

    // Highlight matching navbar link
    const nav = document.querySelector(`.navlink[data-page="${pageId}"]`)

    if (nav) {
      nav.classList.add("active")
    }

    // Show selected page
    targetPage.classList.add("active")

    // Force scroll to top after page is shown
    requestAnimationFrame(function () {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto"
      })
    })
  }

  function getInitialPage() {
    const hash = window.location.hash.replace("#", "")
    return hash || "homePage"
  }

  // Prevent browser from restoring old scroll position
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual"
  }

  // Navbar clicks inside index.html
  document.querySelectorAll(".navlink[data-page]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault()

      const pageId = link.dataset.page

      if (!pageId) {
        return
      }

      history.pushState(null, "", `#${pageId}`)
      showPage(pageId)
    })
  })

  // Buttons like homepage buttons
  document.querySelectorAll("[data-go]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.preventDefault()

      const pageId = btn.dataset.go

      if (!pageId) {
        return
      }

      history.pushState(null, "", `#${pageId}`)
      showPage(pageId)
    })
  })

  // Show correct page on first load
  showPage(getInitialPage())

  // Reveal page after correct section is chosen
  document.body.classList.remove("hidden")

  // If coming from myProfile or another page, force top once
  if (sessionStorage.getItem("forceScrollTop") === "true") {
    sessionStorage.removeItem("forceScrollTop")

    requestAnimationFrame(function () {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "auto"
      })
    })
  }

  // Extra safety after full page load
  window.addEventListener("load", function () {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto"
    })
  })

  // Handle hash changes while already on index page
  window.addEventListener("hashchange", function () {
    const pageId = getInitialPage()
    showPage(pageId)
  })
}