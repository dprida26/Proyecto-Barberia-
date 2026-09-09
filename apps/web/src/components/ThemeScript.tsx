const THEME_INIT_SCRIPT = `
(function () {
  try {
    var raw = localStorage.getItem("barberops-theme");
    var theme = raw ? JSON.parse(raw).state.theme : "light";
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
