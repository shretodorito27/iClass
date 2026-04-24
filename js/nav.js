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
  }

  // Navbar clicks
  document.querySelectorAll(".navlink[data-page]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault()

      const pageId = link.dataset.page
      showPage(pageId)

      // Update URL hash
      window.location.hash = pageId
    })
  })

  // Home page buttons
  document.querySelectorAll("[data-go]").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.preventDefault()

      const pageId = btn.dataset.go
      showPage(pageId)

      // Update URL hash
      window.location.hash = pageId
    })
  })

  // Handle links like index.html#aboutPage
  const hash = window.location.hash

  if (hash) {
    const pageId = hash.replace("#", "")
    showPage(pageId)
  } else {
    showPage("homePage")
  }

  // Handle hash changes while already on index page
  window.addEventListener("hashchange", function () {
    const pageId = window.location.hash.replace("#", "")
    showPage(pageId)
  })
}