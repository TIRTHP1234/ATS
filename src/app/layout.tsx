import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Costaff North ATS - Org Overview',
  description: 'Applicant Tracking System Super Admin Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
