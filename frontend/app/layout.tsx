import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

export const metadata: Metadata = {
  title: "SCM",
  description: "Student Course Management System",
};

const removeDefinerBeforeHydration = `
(() => {
    const removeInjectedElement = () => {
        document.getElementById("definer-bubble-host")?.remove();
    };

    removeInjectedElement();

    const observer = new MutationObserver(removeInjectedElement);
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener("load", () => {
        removeInjectedElement();
        window.setTimeout(() => observer.disconnect(), 1000);
    }, { once: true });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{ __html: removeDefinerBeforeHydration }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
