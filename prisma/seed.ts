import { PrismaClient, GroupRole, GameType, InviteStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create users
  const passwordHash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      passwordHash,
      name: 'Alice Johnson',
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      passwordHash,
      name: 'Bob Smith',
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      passwordHash,
      name: 'Charlie Brown',
    },
  });

  const diana = await prisma.user.upsert({
    where: { email: 'diana@example.com' },
    update: {},
    create: {
      email: 'diana@example.com',
      passwordHash,
      name: 'Diana Prince',
    },
  });

  console.log('Created users:', { alice: alice.id, bob: bob.id, charlie: charlie.id, diana: diana.id });

  // Create groups
  const fridayNightPoker = await prisma.group.upsert({
    where: { id: 'friday-night-poker' },
    update: {},
    create: {
      id: 'friday-night-poker',
      name: 'Friday Night Poker',
    },
  });

  const weekendWarriors = await prisma.group.upsert({
    where: { id: 'weekend-warriors' },
    update: {},
    create: {
      id: 'weekend-warriors',
      name: 'Weekend Warriors',
    },
  });

  console.log('Created groups:', { fridayNightPoker: fridayNightPoker.id, weekendWarriors: weekendWarriors.id });

  // Create memberships
  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: fridayNightPoker.id, userId: alice.id } },
    update: {},
    create: {
      groupId: fridayNightPoker.id,
      userId: alice.id,
      role: GroupRole.OWNER,
    },
  });

  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: fridayNightPoker.id, userId: bob.id } },
    update: {},
    create: {
      groupId: fridayNightPoker.id,
      userId: bob.id,
      role: GroupRole.ADMIN,
    },
  });

  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: fridayNightPoker.id, userId: charlie.id } },
    update: {},
    create: {
      groupId: fridayNightPoker.id,
      userId: charlie.id,
      role: GroupRole.MEMBER,
    },
  });

  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: weekendWarriors.id, userId: bob.id } },
    update: {},
    create: {
      groupId: weekendWarriors.id,
      userId: bob.id,
      role: GroupRole.OWNER,
    },
  });

  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: weekendWarriors.id, userId: diana.id } },
    update: {},
    create: {
      groupId: weekendWarriors.id,
      userId: diana.id,
      role: GroupRole.MEMBER,
    },
  });

  await prisma.groupMembership.upsert({
    where: { groupId_userId: { groupId: weekendWarriors.id, userId: alice.id } },
    update: {},
    create: {
      groupId: weekendWarriors.id,
      userId: alice.id,
      role: GroupRole.MEMBER,
    },
  });

  console.log('Created memberships');

  // Create sample pending invite
  await prisma.groupInvite.upsert({
    where: { id: 'sample-invite' },
    update: {},
    create: {
      id: 'sample-invite',
      groupId: fridayNightPoker.id,
      inviterId: alice.id,
      inviteeEmail: 'newplayer@example.com',
      token: 'sample-invite-token-12345',
      status: InviteStatus.PENDING,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  console.log('Created sample invite');

  // Create games for Friday Night Poker
  const game1 = await prisma.game.create({
    data: {
      groupId: fridayNightPoker.id,
      date: new Date('2024-01-05'),
      gameType: GameType.CASH,
      notes: '$1/$2 blinds',
      participants: {
        create: [
          { userId: alice.id, spent: '100.00', won: '150.00' },
          { userId: bob.id, spent: '100.00', won: '80.00' },
          { userId: charlie.id, spent: '100.00', won: '70.00' },
        ],
      },
    },
  });

  const game2 = await prisma.game.create({
    data: {
      groupId: fridayNightPoker.id,
      date: new Date('2024-01-12'),
      gameType: GameType.CASH,
      notes: '$1/$2 blinds',
      participants: {
        create: [
          { userId: alice.id, spent: '150.00', won: '100.00' },
          { userId: bob.id, spent: '150.00', won: '200.00' },
          { userId: charlie.id, spent: '150.00', won: '150.00' },
          { guestName: 'Mike (guest)', spent: '50.00', won: '50.00' },
        ],
      },
    },
  });

  const game3 = await prisma.game.create({
    data: {
      groupId: fridayNightPoker.id,
      date: new Date('2024-01-19'),
      gameType: GameType.TOURNAMENT,
      notes: '$50 buy-in tournament',
      participants: {
        create: [
          { userId: alice.id, spent: '50.00', won: '0.00' },
          { userId: bob.id, spent: '50.00', won: '150.00' },
          { userId: charlie.id, spent: '50.00', won: '0.00' },
        ],
      },
    },
  });

  console.log('Created Friday Night Poker games:', { game1: game1.id, game2: game2.id, game3: game3.id });

  // Create games for Weekend Warriors
  const game4 = await prisma.game.create({
    data: {
      groupId: weekendWarriors.id,
      date: new Date('2024-01-06'),
      gameType: GameType.CASH,
      notes: '$0.50/$1 blinds',
      participants: {
        create: [
          { userId: bob.id, spent: '50.00', won: '75.00' },
          { userId: diana.id, spent: '50.00', won: '25.00' },
          { userId: alice.id, spent: '50.00', won: '50.00' },
        ],
      },
    },
  });

  const game5 = await prisma.game.create({
    data: {
      groupId: weekendWarriors.id,
      date: new Date('2024-01-13'),
      gameType: GameType.CASH,
      notes: '$0.50/$1 blinds',
      participants: {
        create: [
          { userId: bob.id, spent: '80.00', won: '60.00' },
          { userId: diana.id, spent: '80.00', won: '120.00' },
          { userId: alice.id, spent: '80.00', won: '60.00' },
        ],
      },
    },
  });

  console.log('Created Weekend Warriors games:', { game4: game4.id, game5: game5.id });

  console.log('Seeding completed!');
  console.log('\nSample login credentials:');
  console.log('  Email: alice@example.com');
  console.log('  Password: password123');
  console.log('\n  Email: bob@example.com');
  console.log('  Password: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
