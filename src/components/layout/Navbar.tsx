'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { NotificationBell } from '@/components/ui/NotificationBell';

export function Navbar() {
  const { user, signOut, loading } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: t.nav.dashboard },
    { href: '/groups', label: t.nav.myGroups },
    { href: '/blind-timer', label: t.nav.blindTimer },
  ];

  return (
    <nav className="bg-gradient-to-r from-poker-brown-dark via-poker-brown to-poker-brown-dark shadow-wood">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Image
                  src="/logo.png"
                  alt="Poker de Garagem"
                  width={48}
                  height={48}
                  className="rounded-lg opacity-90 group-hover:opacity-100 transition-opacity duration-200"
                />
              </div>
              <span className="text-lg font-semibold text-poker-gold/90 hidden sm:block group-hover:text-poker-gold transition-colors duration-200">
                Poker de Garagem
              </span>
            </Link>

            {user && (
              <div className="hidden md:flex ml-10 space-x-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-poker-cream/80 hover:text-poker-gold hover:bg-poker-brown-dark/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSelector />

            {loading ? (
              <div className="h-8 w-8 animate-pulse bg-poker-brown-light rounded-full" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <span className="text-sm text-poker-cream hidden sm:block">{user.name}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={signOut}
                  className="hidden md:inline-flex border-poker-gold text-poker-gold hover:bg-poker-gold hover:text-poker-brown-dark"
                >
                  {t.nav.signOut}
                </Button>
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-poker-cream hover:text-poker-gold hover:bg-poker-brown-dark/50 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/signin">
                  <Button variant="ghost" size="sm" className="text-poker-cream hover:text-poker-gold hover:bg-poker-brown-dark/50">
                    {t.nav.signIn}
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" className="bg-poker-gold text-poker-brown-dark hover:bg-poker-gold-light font-semibold">
                    {t.nav.signUp}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-poker-brown-dark/50">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-poker-cream/80 hover:text-poker-gold hover:bg-poker-brown-dark/50 px-4 py-3 rounded-lg text-base font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                signOut();
              }}
              className="w-full text-left text-poker-gold hover:bg-poker-brown-dark/50 px-4 py-3 rounded-lg text-base font-medium transition-colors border-t border-poker-brown-dark/50 mt-2 pt-4"
            >
              {t.nav.signOut}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
