import type { Metadata } from "next";
import "./globals.css";
import Link from 'next/link';
import { BarChart3, ShieldCheck, ShoppingCart, PackagePlus, List, Zap } from 'lucide-react';
import RoleSwitcher from '@/components/RoleSwitcher';

export const metadata: Metadata = {
  title: "Swift POS — Smart Point of Sale",
  description: "Smart Point of Sale with Barcode Scanning, Inventory Management, and Sales Tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          {/* Sidebar Navigation */}
          <aside className="app-sidebar">
            {/* Logo */}
            <div className="app-brand">
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px 12px 8px 10px',
                background: '#d9a441',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 6px 0 rgba(0, 0, 0, 0.18)',
              }}>
                <Zap size={20} color="#1f2a33" />
              </div>
              <div>
                <h1 style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  letterSpacing: '-0.025em',
                }}>Swift POS</h1>
                <p style={{
                  fontSize: '0.65rem',
                  color: 'rgba(255,255,255,0.45)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}>Smart Point of Sale</p>
              </div>
            </div>

            {/* Nav Section */}
            <p className="nav-section-label">Menu</p>

            <nav className="app-nav">
            <Link href="/" className="nav-link">
              <ShoppingCart size={18} />
              Point of Sale
            </Link>

            <Link href="/dashboard" className="nav-link">
              <BarChart3 size={18} />
              Dashboard
            </Link>

            <Link href="/products/add" className="nav-link">
              <PackagePlus size={18} />
              Add Product
            </Link>

            <Link href="/products" className="nav-link">
              <List size={18} />
              Inventory
            </Link>

            <Link href="/roles" className="nav-link">
              <ShieldCheck size={18} />
              Roles
            </Link>
            </nav>

            <RoleSwitcher />
          </aside>
          
          {/* Main Content Area */}
          <main className="app-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
