import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "my-pocket",
  description: "Трекер расходов",
};

// Применяем тему до гидрации, чтобы не было вспышки светлой темы (FOUC).
// Читаем persisted-значение zustand (ключ "theme") или системную тему.
const themeScript = `(function () {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored ? JSON.parse(stored).state.theme : null;
    if (!theme) {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
