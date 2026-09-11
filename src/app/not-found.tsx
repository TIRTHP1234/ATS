import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b1727', color: '#ffffff', padding: '20px' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '10px' }}>404</h1>
      <p style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '20px' }}>Page Not Found</p>
      <Link href="/" style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: '600' }}>
        Return to Org Overview Dashboard
      </Link>
    </div>
  );
}
