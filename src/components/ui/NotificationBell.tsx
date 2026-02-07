'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from './Button';

interface Invite {
  id: string;
  group: {
    id: string;
    name: string;
  };
  inviter: {
    id: string;
    name: string;
  };
  seenAt: string | null;
  expiresAt: string;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const { t } = useLanguage();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchInvites = async () => {
    try {
      const res = await fetch('/api/user/invites');
      const data = await res.json();
      if (data.success) {
        setInvites(data.data.invites);
        setUnseenCount(data.data.unseenCount);
      }
    } catch (error) {
      console.error('Failed to fetch invites:', error);
    }
  };

  useEffect(() => {
    fetchInvites();
    // Poll for new invites every 30 seconds
    const interval = setInterval(fetchInvites, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unseenCount > 0) {
      // Mark invites as seen when opening
      try {
        await fetch('/api/user/invites/mark-seen', { method: 'POST' });
        setUnseenCount(0);
      } catch (error) {
        console.error('Failed to mark invites as seen:', error);
      }
    }
  };

  const handleRespond = async (inviteId: string, accept: boolean) => {
    setRespondingTo(inviteId);
    try {
      const res = await fetch(`/api/user/invites/${inviteId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accept }),
      });

      const data = await res.json();
      if (data.success) {
        if (accept && data.data.group) {
          router.push(`/groups/${data.data.group.id}`);
        }
        fetchInvites();
      }
    } catch (error) {
      console.error('Failed to respond to invite:', error);
    } finally {
      setRespondingTo(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-poker-cream hover:text-poker-gold hover:bg-poker-brown-dark/50 transition-colors"
        aria-label={t.notifications.invites}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unseenCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-poker-red rounded-full">
            {unseenCount > 9 ? '9+' : unseenCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-poker-brown/10 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-poker-brown/10 bg-poker-cream/30">
            <h3 className="font-semibold text-poker-brown">{t.notifications.invites}</h3>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {invites.length === 0 ? (
              <div className="px-4 py-6 text-center text-poker-brown/60">
                {t.notifications.noNewInvites}
              </div>
            ) : (
              <div className="divide-y divide-poker-brown/10">
                {invites.slice(0, 5).map((invite) => (
                  <div key={invite.id} className="px-4 py-3">
                    <div className="mb-2">
                      <p className="font-medium text-poker-brown text-sm">{invite.group.name}</p>
                      <p className="text-xs text-poker-brown/60">
                        {t.invites.invitedBy} {invite.inviter.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleRespond(invite.id, true)}
                        loading={respondingTo === invite.id}
                        disabled={respondingTo !== null}
                        className="flex-1"
                      >
                        {t.invites.accept}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleRespond(invite.id, false)}
                        loading={respondingTo === invite.id}
                        disabled={respondingTo !== null}
                        className="flex-1"
                      >
                        {t.invites.decline}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 py-3 border-t border-poker-brown/10 bg-poker-cream/30">
            <Link
              href="/invites"
              onClick={() => setIsOpen(false)}
              className="text-sm text-poker-gold hover:text-poker-gold-dark hover:underline block text-center"
            >
              {t.notifications.viewAllInvites}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
