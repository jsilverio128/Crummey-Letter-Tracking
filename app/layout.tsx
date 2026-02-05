import './globals.css';
import React from 'react';
import { ToasterProvider } from '../components/ui/toaster';

export const metadata = {
  title: 'ILIT Tracker',
  description: 'Crummey Letter + Premium Due Date Tracker'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToasterProvider>
          <div className="max-w-6xl mx-auto py-6">{children}</div>
        </ToasterProvider>
      </body>
    </html>
  );
}
