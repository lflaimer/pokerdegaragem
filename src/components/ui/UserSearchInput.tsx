'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Input } from './Input';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserSearchInputProps {
  groupId: string;
  onSelect: (user: User) => void;
  disabled?: boolean;
}

export function UserSearchInput({ groupId, onSelect, disabled }: UserSearchInputProps) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&groupId=${groupId}`);
        const data = await res.json();
        if (data.success) {
          setResults(data.data.users);
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, groupId]);

  const handleSelect = (user: User) => {
    onSelect(user);
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.userSearch.searchPlaceholder}
        disabled={disabled}
        className="w-full"
      />

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-poker-gold border-t-transparent"></div>
        </div>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-poker-brown/20 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {results.map((user) => (
            <button
              key={user.id}
              type="button"
              onClick={() => handleSelect(user)}
              className="w-full px-4 py-3 text-left hover:bg-poker-cream/50 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <span className="font-medium text-poker-brown block">{user.name}</span>
              <span className="text-sm text-poker-brown/60">{user.email}</span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-poker-brown/20 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-poker-brown/60 text-sm">{t.userSearch.noResults}</div>
        </div>
      )}
    </div>
  );
}
