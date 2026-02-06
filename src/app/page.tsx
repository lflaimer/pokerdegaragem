'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col">
      {/* Hero Section - Felt table background */}
      <div className="flex-1 flex items-center justify-center bg-felt-pattern relative overflow-hidden">
        {/* Decorative border */}
        <div className="absolute inset-4 border-8 border-poker-brown rounded-3xl opacity-30"></div>

        <div className="max-w-4xl mx-auto px-4 py-16 text-center relative z-10">
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="Poker de Garagem"
              width={340}
              height={340}
              className="mx-auto drop-shadow-logo"
              priority
            />
          </div>
          <p className="text-xl text-poker-cream mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-text font-medium">
            {t.home.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="gold" className="min-w-[180px] hover:scale-105 hover:shadow-gold-glow transition-all duration-200">
                {t.home.getStarted}
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button size="lg" variant="ghost" className="min-w-[180px] text-poker-cream border-2 border-poker-cream/50 hover:bg-poker-cream/10 hover:border-poker-cream hover:scale-105 transition-all duration-200">
                {t.nav.signIn}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-poker-cream py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-poker-brown mb-12">{t.home.features}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-poker-brown/10 hover:border-poker-gold/50 hover:shadow-xl transition-all duration-200 text-center group">
              <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full shadow-md group-hover:shadow-lg transition-shadow duration-200">
                <Image
                  src="/icon-groups.png"
                  alt={t.home.feature1Title}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-poker-brown mb-3">{t.home.feature1Title}</h3>
              <p className="text-poker-brown/70">
                {t.home.feature1Desc}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-poker-brown/10 hover:border-poker-gold/50 hover:shadow-xl transition-all duration-200 text-center group">
              <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full shadow-md group-hover:shadow-lg transition-shadow duration-200">
                <Image
                  src="/icon-history.png"
                  alt={t.home.feature2Title}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-poker-brown mb-3">{t.home.feature2Title}</h3>
              <p className="text-poker-brown/70">
                {t.home.feature2Desc}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-poker-brown/10 hover:border-poker-gold/50 hover:shadow-xl transition-all duration-200 text-center group">
              <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full shadow-md group-hover:shadow-lg transition-shadow duration-200">
                <Image
                  src="/icon-stats.png"
                  alt={t.home.feature3Title}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-poker-brown mb-3">{t.home.feature3Title}</h3>
              <p className="text-poker-brown/70">
                {t.home.feature3Desc}
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-poker-brown/10 hover:border-poker-gold/50 hover:shadow-xl transition-all duration-200 text-center group">
              <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full shadow-md group-hover:shadow-lg transition-shadow duration-200">
                <Image
                  src="/icon-timer.png"
                  alt={t.home.feature4Title}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-poker-brown mb-3">{t.home.feature4Title}</h3>
              <p className="text-poker-brown/70">
                {t.home.feature4Desc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-poker-brown-dark py-6 text-center">
        <p className="text-poker-cream/60 text-sm">
          Poker de Garagem &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
