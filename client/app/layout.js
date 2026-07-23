import "./globals.css";
import { AuthProvider } from "./providers";
import { NotificationProvider } from "../components/NotificationProvider";

export const metadata = {
  title: "PropertyRental — Find Your Perfect Home",
  description:
    "Discover and rent properties directly from landlords. No estate agents, no fees.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthProvider>
          <NotificationProvider>{children}</NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}