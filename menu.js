document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (!menuToggle || !navLinks) {
        return;
    }

    menuToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        navLinks.classList.toggle("mobile-open");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("mobile-open");
        });
    });

    document.addEventListener("click", (event) => {
        if (
            navLinks.classList.contains("mobile-open") &&
            !navLinks.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {
            navLinks.classList.remove("mobile-open");
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 800) {
            navLinks.classList.remove("mobile-open");
        }
    });
});
