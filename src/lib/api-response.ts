import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function validationErrorResponse(error: ZodError) {
  const messages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return NextResponse.json(
    { success: false, error: 'Validation failed', details: messages },
    { status: 400 }
  );
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

export function notFoundResponse(message: string = 'Not found') {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

export function serverErrorResponse(message: string = 'Internal server error') {
  console.error('Server error:', message);
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; details?: string[] };
