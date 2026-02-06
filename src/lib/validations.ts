import { z } from 'zod';

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Group schemas
export const createGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(100),
});

export const updateGroupSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(100),
});

// Invite schemas
export const createInviteSchema = z.object({
  inviteeEmail: z.string().email('Invalid email address'),
});

export const respondToInviteSchema = z.object({
  accept: z.boolean(),
});

// Member role schema
export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

// Game participant schema
export const gameParticipantSchema = z
  .object({
    userId: z.string().optional().nullable(),
    guestName: z.string().max(100).optional().nullable(),
    spent: z.string().refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: 'Spent must be a non-negative number' }
    ),
    won: z.string().refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0;
      },
      { message: 'Won must be a non-negative number' }
    ),
  })
  .refine(
    (data) => {
      const hasUser = data.userId && data.userId.trim() !== '';
      const hasGuest = data.guestName && data.guestName.trim() !== '';
      return (hasUser && !hasGuest) || (!hasUser && hasGuest);
    },
    {
      message: 'Participant must be either a user OR a guest, not both',
    }
  );

// Game schemas
export const createGameSchema = z.object({
  date: z.string().refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date' }
  ),
  gameType: z.enum(['CASH', 'TOURNAMENT']),
  notes: z.string().max(1000).optional(),
  participants: z
    .array(gameParticipantSchema)
    .min(2, 'A game must have at least 2 participants'),
});

export const updateGameSchema = createGameSchema;

// Dashboard filters schema
export const dashboardFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  groupId: z.string().optional(),
});

// Admin schemas
export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Types
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type CreateInviteInput = z.infer<typeof createInviteSchema>;
export type RespondToInviteInput = z.infer<typeof respondToInviteSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type GameParticipantInput = z.infer<typeof gameParticipantSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
export type DashboardFiltersInput = z.infer<typeof dashboardFiltersSchema>;
