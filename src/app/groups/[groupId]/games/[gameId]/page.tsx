'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Participant {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  guestName: string | null;
  spent: string;
  won: string;
  net: string;
}

interface Game {
  id: string;
  groupId: string;
  groupName: string;
  date: string;
  gameType: 'CASH' | 'TOURNAMENT';
  notes: string | null;
  totalSpent: string;
  totalWon: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

interface Member {
  userId: string;
  name: string;
  email: string;
}

interface EditParticipant {
  id: string;
  type: 'member' | 'guest';
  userId?: string;
  guestName?: string;
  name: string;
  spent: string;
  won: string;
}

export default function GameDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; gameId: string }>;
}) {
  const { groupId, gameId } = use(params);
  const router = useRouter();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [members, setMembers] = useState<Member[]>([]);

  // Edit state
  const [editDate, setEditDate] = useState('');
  const [editGameType, setEditGameType] = useState<'CASH' | 'TOURNAMENT'>('CASH');
  const [editNotes, setEditNotes] = useState('');
  const [editParticipants, setEditParticipants] = useState<EditParticipant[]>([]);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [guestName, setGuestName] = useState('');
  const [addType, setAddType] = useState<'member' | 'guest'>('member');

  const fetchGame = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/games/${gameId}`);
      const data = await res.json();
      if (data.success) {
        setGame(data.data.game);
      } else if (res.status === 403 || res.status === 404) {
        router.push(`/groups/${groupId}`);
      }
    } catch (err) {
      console.error('Failed to fetch game:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/groups/${groupId}/members`);
      const data = await res.json();
      if (data.success) {
        setMembers(
          data.data.members.map((m: { userId: string; name: string; email: string }) => ({
            userId: m.userId,
            name: m.name,
            email: m.email,
          }))
        );
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  useEffect(() => {
    fetchGame();
    fetchMembers();
  }, [groupId, gameId]);

  const startEditing = () => {
    if (!game) return;
    setEditDate(new Date(game.date).toISOString().split('T')[0]);
    setEditGameType(game.gameType);
    setEditNotes(game.notes || '');
    setEditParticipants(
      game.participants.map((p) => ({
        id: p.id,
        type: p.userId ? 'member' : 'guest',
        userId: p.userId || undefined,
        guestName: p.guestName || undefined,
        name: p.userName || p.guestName || 'Unknown',
        spent: p.spent,
        won: p.won,
      }))
    );
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError('');
  };

  const availableMembers = members.filter(
    (m) => !editParticipants.some((p) => p.type === 'member' && p.userId === m.userId)
  );

  const addParticipant = () => {
    if (addType === 'member' && selectedMemberId) {
      const member = members.find((m) => m.userId === selectedMemberId);
      if (member) {
        setEditParticipants([
          ...editParticipants,
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
      setEditParticipants([
        ...editParticipants,
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
    setEditParticipants(editParticipants.filter((p) => p.id !== id));
  };

  const updateParticipant = (id: string, field: 'spent' | 'won', value: string) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    const parts = sanitized.split('.');
    const formatted = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : sanitized;

    setEditParticipants(
      editParticipants.map((p) => (p.id === id ? { ...p, [field]: formatted } : p))
    );
  };

  const handleSave = async () => {
    setError('');

    if (editParticipants.length < 2) {
      setError('A game must have at least 2 participants');
      return;
    }

    for (const p of editParticipants) {
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
      const res = await fetch(`/api/groups/${groupId}/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: editDate,
          gameType: editGameType,
          notes: editNotes || undefined,
          participants: editParticipants.map((p) => ({
            userId: p.type === 'member' ? p.userId : null,
            guestName: p.type === 'guest' ? p.guestName : null,
            spent: parseFloat(p.spent || '0').toFixed(2),
            won: parseFloat(p.won || '0').toFixed(2),
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update game');
      }

      setIsEditing(false);
      fetchGame();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this game? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      const res = await fetch(`/api/groups/${groupId}/games/${gameId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push(`/groups/${groupId}`);
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete game');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete game');
    } finally {
      setDeleting(false);
    }
  };

  const getNetClass = (value: string) => {
    const num = parseFloat(value);
    if (num > 0) return 'text-poker-green';
    if (num < 0) return 'text-poker-red';
    return 'text-poker-brown/60';
  };

  const formatMoney = (value: string) => {
    const num = parseFloat(value);
    if (num > 0) return `+${value}`;
    return value;
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-poker-gold"></div>
          </div>
        ) : game ? (
          <>
            <div className="mb-8">
              <Link
                href={`/groups/${groupId}`}
                className="text-poker-gold hover:text-poker-gold-dark hover:underline text-sm mb-2 inline-block"
              >
                &larr; Back to {game.groupName}
              </Link>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-poker-brown">
                    {isEditing ? 'Edit Game' : formatDate(game.date)}
                  </h1>
                  {!isEditing && (
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={game.gameType === 'CASH' ? 'success' : 'admin'}>
                        {game.gameType}
                      </Badge>
                      {game.notes && <span className="text-poker-brown/60">{game.notes}</span>}
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={startEditing}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={handleDelete} loading={deleting}>
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-poker-red/10 border border-poker-red/30 text-poker-red px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {isEditing ? (
              <>
                {/* Edit Form */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Game Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Input
                        label="Date"
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        required
                      />
                      <Select
                        label="Game Type"
                        options={[
                          { value: 'CASH', label: 'Cash Game' },
                          { value: 'TOURNAMENT', label: 'Tournament' },
                        ]}
                        value={editGameType}
                        onChange={(e) => setEditGameType(e.target.value as 'CASH' | 'TOURNAMENT')}
                      />
                      <Input
                        label="Notes"
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="e.g., $1/$2 blinds"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="mb-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Participants</CardTitle>
                    <Button type="button" size="sm" variant="gold" onClick={() => setShowAddParticipant(true)}>
                      Add Participant
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-poker-brown/70 border-b border-poker-brown/20 pb-2">
                        <div className="col-span-4">Player</div>
                        <div className="col-span-3">Spent ($)</div>
                        <div className="col-span-3">Won ($)</div>
                        <div className="col-span-2"></div>
                      </div>

                      {editParticipants.map((p) => (
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
                            />
                          </div>
                          <div className="md:col-span-3">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={p.won}
                              onChange={(e) => updateParticipant(p.id, 'won', e.target.value)}
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
                    </div>
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

                <div className="flex justify-end gap-4">
                  <Button variant="secondary" onClick={cancelEditing}>
                    Cancel
                  </Button>
                  <Button variant="gold" onClick={handleSave} loading={saving}>
                    Save Changes
                  </Button>
                </div>
              </>
            ) : (
              /* View Mode */
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Results</CardTitle>
                    <div className="text-sm text-poker-brown/60">
                      Total: ${game.totalSpent} spent / ${game.totalWon} won
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-poker-brown/20">
                          <th className="text-left py-3 font-medium text-poker-brown/70">Player</th>
                          <th className="text-right py-3 font-medium text-poker-brown/70">Spent</th>
                          <th className="text-right py-3 font-medium text-poker-brown/70">Won</th>
                          <th className="text-right py-3 font-medium text-poker-brown/70">Net</th>
                        </tr>
                      </thead>
                      <tbody>
                        {game.participants.map((p) => (
                          <tr key={p.id} className="border-b border-poker-brown/10 last:border-0 hover:bg-poker-gold/5">
                            <td className="py-3">
                              <span className="font-medium text-poker-brown">
                                {p.userName || p.guestName || 'Unknown'}
                              </span>
                              {p.guestName && (
                                <span className="ml-1 text-xs text-poker-brown/50">(guest)</span>
                              )}
                            </td>
                            <td className="text-right py-3 text-poker-brown">${p.spent}</td>
                            <td className="text-right py-3 text-poker-brown">${p.won}</td>
                            <td className={cn('text-right py-3 font-medium', getNetClass(p.net))}>
                              ${formatMoney(p.net)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-poker-brown/70">Game not found</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
