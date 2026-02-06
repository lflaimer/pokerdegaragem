import { GroupRole } from '@prisma/client';
import { prisma } from './db';

export type AuthorizedUser = {
  id: string;
  email: string;
  name: string;
};

export async function getUserMembership(userId: string, groupId: string) {
  return prisma.groupMembership.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
    include: {
      group: true,
    },
  });
}

export async function requireGroupMembership(userId: string, groupId: string) {
  const membership = await getUserMembership(userId, groupId);
  if (!membership) {
    throw new Error('Not a member of this group');
  }
  return membership;
}

export async function requireGroupAdmin(userId: string, groupId: string) {
  const membership = await requireGroupMembership(userId, groupId);
  if (membership.role !== GroupRole.OWNER && membership.role !== GroupRole.ADMIN) {
    throw new Error('Insufficient permissions');
  }
  return membership;
}

export async function requireGroupOwner(userId: string, groupId: string) {
  const membership = await requireGroupMembership(userId, groupId);
  if (membership.role !== GroupRole.OWNER) {
    throw new Error('Only group owner can perform this action');
  }
  return membership;
}

export function canManageMembers(role: GroupRole): boolean {
  return role === GroupRole.OWNER || role === GroupRole.ADMIN;
}

export function canChangeRoles(role: GroupRole): boolean {
  return role === GroupRole.OWNER;
}

export function canDeleteGroup(role: GroupRole): boolean {
  return role === GroupRole.OWNER;
}

export async function getUserGroups(userId: string) {
  return prisma.groupMembership.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          _count: {
            select: {
              memberships: true,
              games: true,
            },
          },
        },
      },
    },
  });
}
