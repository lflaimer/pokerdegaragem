'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      return;
    }

    if (password.length < 8) {
      setError(t.auth.passwordTooShort);
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, name);
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
          <CardTitle className="text-center text-2xl text-poker-gold">{t.auth.signUpTitle}</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-poker-red/10 border border-poker-red/30 text-poker-red px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Input
              id="name"
              label={t.auth.name}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder={t.auth.namePlaceholder}
            />

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
              autoComplete="new-password"
              placeholder={t.auth.passwordMinLength}
            />

            <Input
              id="confirmPassword"
              label={t.auth.confirmPassword}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder={t.auth.confirmPassword}
            />

            <Button type="submit" variant="gold" className="w-full" loading={loading}>
              {t.auth.signUpTitle}
            </Button>

            <p className="text-center text-sm text-poker-brown/70">
              {t.auth.hasAccount}{' '}
              <Link href="/auth/signin" className="text-poker-gold hover:text-poker-gold-dark hover:underline font-medium">
                {t.nav.signIn}
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
