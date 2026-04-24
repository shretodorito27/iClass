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

    // Always go to top of page
    window.scrollTo(0, 0)
  }

  function getInitialPage() {
    const hash = window.location.hash.replace("#", "")
    return hash || "homePage"
  }

  // Prevent browser from restoring old scroll position
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual"
  }

  // Navbar clicks
  document.querySelectorAll(".navlink[data-page]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault()

      const pageId = link.dataset.page

      if (!pageId) {
        return
      }

      showPage(pageId)
      history.pushState(null, "", `#${pageId}`)
    })
  })

  // Home page buttons
  document.querySelectorAll("[data-go]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.preventDefault()

      const pageId = btn.dataset.go

      if (!pageId) {
        return
      }

      showPage(pageId)
      history.pushState(null, "", `#${pageId}`)
    })
  })

  // Show correct page on first load
  showPage(getInitialPage())

  // Reveal page after correct section is chosen
  document.body.classList.remove("hidden")

  // Make sure first load is also at the top
  window.scrollTo(0, 0)

  // Handle hash changes while already on index page
  window.addEventListener("hashchange", function () {
    const pageId = getInitialPage()
    showPage(pageId)
  })
}