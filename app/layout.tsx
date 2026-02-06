import './globals.css';
import React from 'react';
import { ToasterProvider } from '../components/ui/toaster';
import { PortalLayout } from '../components/portal-layout';

export const metadata = {
  title: 'ILIT & Crummey Letter Portal',
  description: 'Advisor Dashboard for Crummey Letter + Premium Due Date Tracking'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToasterProvider>
          <PortalLayout>{children}</PortalLayout>
        </ToasterProvider>
      </body>
    </html>
  );
}
