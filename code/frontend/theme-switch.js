const toggle = document.getElementById("theme-toggle");
toggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("dark-theme") ? "dark" : "light"
  );
});

// Check local storage for theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-theme");
}
