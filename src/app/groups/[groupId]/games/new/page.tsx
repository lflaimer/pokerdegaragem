'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
}

interface Participant {
  id: string;
  type: 'member' | 'guest';
  userId?: string;
  guestName?: string;
  name: string;
  spent: string;
  won: string;
}

export default function NewGamePage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const router = useRouter();
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [gameType, setGameType] = useState<'CASH' | 'TOURNAMENT'>('CASH');
  const [notes, setNotes] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [addType, setAddType] = useState<'member' | 'guest'>('member');

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await fetch(`/api/groups/${groupId}`);
        const data = await res.json();
        if (data.success) {
          setGroupName(data.data.group.name);
          setMembers(
            data.data.group.members.map((m: { id: string; userId: string; name: string; email: string }) => ({
              id: m.id,
              userId: m.userId,
              name: m.name,
              email: m.email,
            }))
          );
        } else if (res.status === 403 || res.status === 404) {
          router.push('/groups');
        }
      } catch (err) {
        console.error('Failed to fetch group:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId, router]);

  const availableMembers = members.filter(
    (m) => !participants.some((p) => p.type === 'member' && p.userId === m.userId)
  );

  const addParticipant = () => {
    if (addType === 'member' && selectedMemberId) {
      const member = members.find((m) => m.userId === selectedMemberId);
      if (member) {
        setParticipants([
          ...participants,
          {
            id: crypto.randomUUID(),
            type: 'member',
            userId: member.userId,
            name: member.name,
            spent: '0.00',
            won: '0.00',
          },
        ]);
        setSelectedMemberId('');
      }
    } else if (addType === 'guest' && guestName.trim()) {
      setParticipants([
        ...participants,
        {
          id: crypto.randomUUID(),
          type: 'guest',
          guestName: guestName.trim(),
          name: guestName.trim(),
          spent: '0.00',
          won: '0.00',
        },
      ]);
      setGuestName('');
    }
    setShowAddParticipant(false);
  };

  const removeParticipant = (id: string) => {
    setParticipants(participants.filter((p) => p.id !== id));
  };

  const updateParticipant = (id: string, field: 'spent' | 'won', value: string) => {
    // Allow only valid decimal input
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;

    setParticipants(
      participants.map((p) => (p.id === id ? { ...p, [field]: formatted } : p))
    );
  };

  const calculateTotals = () => {
    const totalSpent = participants.reduce((sum, p) => sum + parseFloat(p.spent || '0'), 0);
    const totalWon = participants.reduce((sum, p) => sum + parseFloat(p.won || '0'), 0);
    return { totalSpent, totalWon };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (participants.length < 2) {
      setError('A game must have at least 2 participants');
      return;
    }

    // Validate amounts
    for (const p of participants) {
      const spent = parseFloat(p.spent || '0');
      const won = parseFloat(p.won || '0');
      if (isNaN(spent) || spent < 0) {
        setError(`Invalid spent amount for ${p.name}`);
        return;
      }
      if (isNaN(won) || won < 0) {
        setError(`Invalid won amount for ${p.name}`);
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/groups/${groupId}/games`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          gameType,
          notes: notes || undefined,
          participants: participants.map((p) => ({
            userId: p.type === 'member' ? p.userId : null,
            guestName: p.type === 'guest' ? p.guestName : null,
            spent: parseFloat(p.spent || '0').toFixed(2),
            won: parseFloat(p.won || '0').toFixed(2),
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create game');
      }

      router.push(`/groups/${groupId}/games/${data.data.game.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setSaving(false);
    }
  };

  const { totalSpent, totalWon } = calculateTotals();

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <Link
                href={`/groups/${groupId}`}
                className="text-poker-gold hover:text-poker-gold-dark hover:underline text-sm mb-2 inline-block"
              >
                &larr; Back to {groupName}
              </Link>
              <h1 className="text-3xl font-bold text-poker-brown">New Game</h1>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-6 bg-poker-red/10 border border-poker-red/30 text-poker-red px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Game Details */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Game Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      label="Date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                    <Select
                      label="Game Type"
                      options={[
                        { value: 'CASH', label: 'Cash Game' },
                        { value: 'TOURNAMENT', label: 'Tournament' },
                      ]}
                      value={gameType}
                      onChange={(e) => setGameType(e.target.value as 'CASH' | 'TOURNAMENT')}
                    />
                    <Input
                      label="Notes (optional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., $1/$2 blinds"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Participants */}
              <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Participants ({participants.length})</CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="gold"
                    onClick={() => setShowAddParticipant(true)}
                  >
                    Add Participant
                  </Button>
                </CardHeader>
                <CardContent>
                  {participants.length === 0 ? (
                    <p className="text-poker-brown/60 text-center py-8">
                      Add at least 2 participants to the game
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-poker-brown/70 border-b border-poker-brown/20 pb-2">
                        <div className="col-span-4">Player</div>
                        <div className="col-span-3">Spent ($)</div>
                        <div className="col-span-3">Won ($)</div>
                        <div className="col-span-2"></div>
                      </div>

                      {/* Participants */}
                      {participants.map((p) => (
                        <div
                          key={p.id}
                          className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center py-2 border-b border-poker-brown/10 last:border-0"
                        >
                          <div className="md:col-span-4">
                            <span className="font-medium text-poker-brown">{p.name}</span>
                            {p.type === 'guest' && (
                              <span className="ml-1 text-xs text-poker-brown/50">(guest)</span>
                            )}
                          </div>
                          <div className="md:col-span-3">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={p.spent}
                              onChange={(e) => updateParticipant(p.id, 'spent', e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={p.won}
                              onChange={(e) => updateParticipant(p.id, 'won', e.target.value)}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="md:col-span-2 flex justify-end">
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => removeParticipant(p.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Totals */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-4 border-t border-poker-brown/20 bg-poker-cream/50 -mx-6 px-6 py-4 -mb-4 rounded-b-lg">
                        <div className="md:col-span-4 font-medium text-poker-brown">Totals</div>
                        <div className="md:col-span-3 font-medium text-poker-brown">
                          ${totalSpent.toFixed(2)}
                        </div>
                        <div className="md:col-span-3 font-medium text-poker-brown">
                          ${totalWon.toFixed(2)}
                        </div>
                        <div className="md:col-span-2"></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Participant Modal */}
              {showAddParticipant && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
                  <Card className="w-full max-w-md">
                    <CardHeader>
                      <CardTitle>Add Participant</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={addType === 'member' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setAddType('member')}
                          >
                            Group Member
                          </Button>
                          <Button
                            type="button"
                            variant={addType === 'guest' ? 'primary' : 'secondary'}
                            size="sm"
                            onClick={() => setAddType('guest')}
                          >
                            Guest
                          </Button>
                        </div>

                        {addType === 'member' ? (
                          availableMembers.length > 0 ? (
                            <Select
                              label="Select Member"
                              options={[
                                { value: '', label: 'Select a member...' },
                                ...availableMembers.map((m) => ({
                                  value: m.userId,
                                  label: m.name,
                                })),
                              ]}
                              value={selectedMemberId}
                              onChange={(e) => setSelectedMemberId(e.target.value)}
                            />
                          ) : (
                            <p className="text-poker-brown/60">All members are already added</p>
                          )
                        ) : (
                          <Input
                            label="Guest Name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Enter guest name"
                          />
                        )}

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setShowAddParticipant(false);
                              setSelectedMemberId('');
                              setGuestName('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            onClick={addParticipant}
                            disabled={
                              (addType === 'member' && !selectedMemberId) ||
                              (addType === 'guest' && !guestName.trim())
                            }
                          >
                            Add
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Link href={`/groups/${groupId}`}>
                  <Button type="button" variant="secondary">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" variant="gold" loading={saving} disabled={participants.length < 2}>
                  Save Game
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
