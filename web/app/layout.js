import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ConditionalNavbar from "@/components/ConditionalNavbar";

export const metadata = {
  title: "HospiConnect – Real-Time Healthcare Resource Network",
  description:
    "Intelligent healthcare resource sharing and coordination platform enabling dynamic visibility, allocation, and optimization of medical resources across hospitals.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <ConditionalNavbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}