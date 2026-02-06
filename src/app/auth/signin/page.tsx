'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errors.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-felt-pattern">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="bg-poker-brown rounded-t-xl">
          <CardTitle className="text-center text-2xl text-poker-gold">{t.auth.signInTitle}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-poker-red/10 border border-poker-red/30 text-poker-red px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              id="email"
              label={t.auth.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder={t.auth.emailPlaceholder}
            />

            <Input
              id="password"
              label={t.auth.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder={t.auth.passwordPlaceholder}
            />

            <Button type="submit" variant="gold" className="w-full" loading={loading}>
              {t.nav.signIn}
            </Button>

            <p className="text-center text-sm text-poker-brown/70">
              {t.auth.noAccount}{' '}
              <Link href="/auth/signup" className="text-poker-gold hover:text-poker-gold-dark hover:underline font-medium">
                {t.nav.signUp}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
