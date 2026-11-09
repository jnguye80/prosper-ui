import { useState, type FormEvent, type ReactNode } from 'react';
import { Logo } from '../ui/icons';
import { Button, Field, cx, inputClass } from '../ui/primitives';

export type Role = 'Program / MEL staff' | 'Data protection reviewer' | 'Uploads recordings';
export const ROLES: Role[] = ['Program / MEL staff', 'Data protection reviewer', 'Uploads recordings'];

export interface User {
  name: string;
  email: string;
  organization: string;
  role: Role;
}

type Mode = 'signin' | 'signup' | 'forgot' | 'forgot-sent';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

/** "jenny.nguyen@org.org" → "Jenny Nguyen" — the prototype has no user directory. */
function nameFromEmail(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(' ');
}

/**
 * Sign in, create account and password reset. Prototype only: nothing is sent anywhere;
 * any well-formed email with a password of 8+ characters signs in.
 * Replace onSignIn with the real auth provider (e.g. Amazon Cognito) later.
 */
export function AuthScreen({ onSignIn }: { onSignIn: (u: User) => void }) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');

  return (
    <div className="flex min-h-full flex-col bg-ground font-sans text-ink">
      <main className="flex flex-1 items-start justify-center px-4 pb-12 pt-12 sm:pt-20">
        <div className="flex w-full max-w-[420px] flex-col gap-6">
          <div className="flex items-center justify-center gap-2.5">
            <Logo size={34} />
            <span className="text-xl font-bold tracking-[0.02em]">ACoRN</span>
          </div>

          <div className="flex flex-col gap-5 rounded-[14px] border border-line bg-surface p-6 sm:p-8">
            {mode === 'signin' && <SignIn email={email} setEmail={setEmail} onSignIn={onSignIn} setMode={setMode} />}
            {mode === 'signup' && <SignUp email={email} setEmail={setEmail} onSignIn={onSignIn} setMode={setMode} />}
            {mode === 'forgot' && <Forgot email={email} setEmail={setEmail} setMode={setMode} />}
            {mode === 'forgot-sent' && (
              <>
                <Heading title="Check your email" sub={`If an account exists for ${email}, we’ve sent a link to reset your password.`} />
                <Button variant="primary" className="w-full" onClick={() => setMode('signin')}>Back to sign in</Button>
              </>
            )}
          </div>

          <p className="text-center text-xs leading-normal text-muted">
            Prototype · synthetic sample data. Any email and a password of {MIN_PASSWORD}+ characters will sign you in.
          </p>
        </div>
      </main>
    </div>
  );
}

// ---------- the three forms ----------

interface FormProps {
  email: string;
  setEmail: (v: string) => void;
  setMode: (m: Mode) => void;
}

function SignIn({ email, setEmail, onSignIn, setMode }: FormProps & { onSignIn: (u: User) => void }) {
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!EMAIL.test(email)) err.email = 'Enter your work email, like name@organization.org.';
    if (password.length < MIN_PASSWORD) err.password = `Password must be at least ${MIN_PASSWORD} characters.`;
    setErrors(err);
    if (Object.keys(err).length) return;
    onSignIn({ name: nameFromEmail(email), email, organization: 'Prosper Global', role: 'Program / MEL staff' });
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <Heading title="Sign in" sub="Use your work email to open your assessments." />
      <TextField id="signin-email" label="Work email" type="email" autoComplete="email" value={email} onChange={setEmail} error={errors.email} />
      <TextField
        id="signin-password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        aside={<LinkButton onClick={() => setMode('forgot')}>Forgot password?</LinkButton>}
      />
      <Button type="submit" variant="primary" className="mt-1 w-full">Sign in</Button>
      <p className="text-center text-sm text-muted">
        New to ACoRN? <LinkButton onClick={() => setMode('signup')}>Create an account</LinkButton>
      </p>
    </form>
  );
}

function SignUp({ email, setEmail, onSignIn, setMode }: FormProps & { onSignIn: (u: User) => void }) {
  const [name, setName] = useState('');
  const [organization, setOrganization] = useState('Prosper Global');
  const [role, setRole] = useState<Role>('Program / MEL staff');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = 'Enter your full name.';
    if (!EMAIL.test(email)) err.email = 'Enter your work email, like name@organization.org.';
    if (!organization.trim()) err.organization = 'Enter your organization.';
    if (password.length < MIN_PASSWORD) err.password = `Use at least ${MIN_PASSWORD} characters.`;
    if (confirm !== password) err.confirm = 'Passwords don’t match.';
    setErrors(err);
    if (Object.keys(err).length) return;
    onSignIn({ name: name.trim(), email, organization: organization.trim(), role });
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <Heading title="Create an account" sub="Your organization’s assessments appear once you’re signed in." />
      <TextField id="signup-name" label="Full name" autoComplete="name" value={name} onChange={setName} error={errors.name} />
      <TextField id="signup-email" label="Work email" type="email" autoComplete="email" value={email} onChange={setEmail} error={errors.email} />
      <TextField id="signup-org" label="Organization" autoComplete="organization" value={organization} onChange={setOrganization} error={errors.organization} />
      <Field label="Your role">
        <select id="signup-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={inputClass}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
      </Field>
      <TextField
        id="signup-password"
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        error={errors.password}
        hint={`At least ${MIN_PASSWORD} characters.`}
      />
      <TextField id="signup-confirm" label="Confirm password" type="password" autoComplete="new-password" value={confirm} onChange={setConfirm} error={errors.confirm} />
      <Button type="submit" variant="primary" className="mt-1 w-full">Create account</Button>
      <p className="text-center text-sm text-muted">
        Already have an account? <LinkButton onClick={() => setMode('signin')}>Sign in</LinkButton>
      </p>
    </form>
  );
}

function Forgot({ email, setEmail, setMode }: FormProps) {
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL.test(email)) return setError('Enter your work email, like name@organization.org.');
    setError('');
    setMode('forgot-sent');
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <Heading title="Reset your password" sub="We’ll email you a link to set a new one." />
      <TextField id="forgot-email" label="Work email" type="email" autoComplete="email" value={email} onChange={setEmail} error={error} />
      <Button type="submit" variant="primary" className="mt-1 w-full">Send reset link</Button>
      <p className="text-center text-sm text-muted">
        <LinkButton onClick={() => setMode('signin')}>Back to sign in</LinkButton>
      </p>
    </form>
  );
}

// ---------- small pieces ----------

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[22px] font-semibold">{title}</h1>
      <p className="text-sm leading-normal text-muted">{sub}</p>
    </div>
  );
}

function LinkButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="cursor-pointer font-medium text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand">
      {children}
    </button>
  );
}

function TextField({
  id, label, value, onChange, error, hint, aside, type = 'text', autoComplete,
}: {
  id: string; label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; aside?: ReactNode; type?: string; autoComplete?: string;
}) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-muted">{label}</label>
        {aside && <span className="text-xs">{aside}</span>}
      </div>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={cx(inputClass, error && 'border-high')}
      />
      {error ? (
        <span id={`${id}-error`} className="text-[13px] text-high">{error}</span>
      ) : hint ? (
        <span id={`${id}-hint`} className="text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  );
}
