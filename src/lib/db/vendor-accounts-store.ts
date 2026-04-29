/**
 * Vendor account store — localStorage shim for vendor self-service accounts.
 *
 * Captured at the end of /submit/vendor when the vendor opts in to "Want to
 * manage your listing?". The dashboard at /vendor/dashboard authenticates
 * against this store. Passwords are stored as a salted SHA-256 hex digest so
 * the raw value never lands in localStorage even on a shared machine.
 *
 * ─── PRODUCTION SWAP (Supabase) ──────────────────────────────────────────
 * When the project moves to Supabase, replace this whole file with a thin
 * wrapper around supabase.auth.signUp / signInWithPassword and a `vendors`
 * table joined to the existing form-submissions row by `submissionId`.
 * The public surface (saveVendorAccount, verifyVendorLogin, etc.) is
 * deliberately framework-agnostic so the call sites in VendorSubmittedView
 * and the dashboard don't need to change — only the implementation here.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { getStore, setStore } from "@/lib/db/local-store";

const ACCOUNTS_KEY = "vendor-accounts";
const SESSION_KEY = "vendor-account-session";
const SALT = "marigold:v1";

export interface VendorAccount {
  id: string;
  email: string;
  passwordHash: string;
  submissionId: string;
  businessName: string;
  category: string;
  createdAt: string;
  lastLogin: string;
}

interface VendorAccountSession {
  accountId: string;
  email: string;
  signedInAt: string;
}

function readAll(): VendorAccount[] {
  return getStore<VendorAccount[]>(ACCOUNTS_KEY, []);
}

function writeAll(items: VendorAccount[]): void {
  setStore(ACCOUNTS_KEY, items);
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `va_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Salted SHA-256 of the password. Web Crypto is available in any modern
 * browser; we never see the raw password again.
 */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${SALT}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getVendorAccountByEmail(email: string): VendorAccount | null {
  const target = email.trim().toLowerCase();
  return readAll().find((a) => a.email.toLowerCase() === target) ?? null;
}

export function getVendorAccountById(id: string): VendorAccount | null {
  return readAll().find((a) => a.id === id) ?? null;
}

export interface CreateVendorAccountInput {
  email: string;
  password: string;
  submissionId: string;
  businessName: string;
  category: string;
}

export async function createVendorAccount(
  input: CreateVendorAccountInput,
): Promise<{ ok: true; account: VendorAccount } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email." };
  }
  if (input.password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters." };
  }
  if (getVendorAccountByEmail(email)) {
    return {
      ok: false,
      error: "An account with this email already exists. Try signing in.",
    };
  }
  const now = new Date().toISOString();
  const account: VendorAccount = {
    id: newId(),
    email,
    passwordHash: await hashPassword(input.password),
    submissionId: input.submissionId,
    businessName: input.businessName,
    category: input.category,
    createdAt: now,
    lastLogin: now,
  };
  writeAll([account, ...readAll()]);
  setSession({ accountId: account.id, email: account.email, signedInAt: now });
  return { ok: true, account };
}

export async function verifyVendorLogin(
  email: string,
  password: string,
): Promise<{ ok: true; account: VendorAccount } | { ok: false; error: string }> {
  const account = getVendorAccountByEmail(email);
  if (!account) {
    return { ok: false, error: "No account found with that email." };
  }
  const expected = await hashPassword(password);
  if (expected !== account.passwordHash) {
    return { ok: false, error: "Wrong password — try again." };
  }
  const now = new Date().toISOString();
  const updated: VendorAccount = { ...account, lastLogin: now };
  writeAll(readAll().map((a) => (a.id === account.id ? updated : a)));
  setSession({ accountId: updated.id, email: updated.email, signedInAt: now });
  return { ok: true, account: updated };
}

export function getCurrentVendorSession(): VendorAccountSession | null {
  return getStore<VendorAccountSession | null>(SESSION_KEY, null);
}

export function setSession(session: VendorAccountSession): void {
  setStore(SESSION_KEY, session);
}

export function clearVendorSession(): void {
  setStore<VendorAccountSession | null>(SESSION_KEY, null);
}
