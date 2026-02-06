'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

export function Navbar() {
  const { user, signOut, loading } = useAuth();
  const { t } = useLanguage();

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
                <Link
                  href="/dashboard"
                  className="text-poker-cream/80 hover:text-poker-gold hover:bg-poker-brown-dark/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {t.nav.dashboard}
                </Link>
                <Link
                  href="/groups"
                  className="text-poker-cream/80 hover:text-poker-gold hover:bg-poker-brown-dark/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {t.nav.myGroups}
                </Link>
                <Link
                  href="/blind-timer"
                  className="text-poker-cream/80 hover:text-poker-gold hover:bg-poker-brown-dark/50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {t.nav.blindTimer}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSelector />

            {loading ? (
              <div className="h-8 w-8 animate-pulse bg-poker-brown-light rounded-full" />
            ) : user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-poker-cream hidden sm:block">{user.name}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={signOut}
                  className="border-poker-gold text-poker-gold hover:bg-poker-gold hover:text-poker-brown-dark"
                >
                  {t.nav.signOut}
                </Button>
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
    </nav>
  );
}
