import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-background p-6 sm:p-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          paperBrain
        </h1>
        <p className="text-sm text-muted">Sign in to continue</p>
      </div>
      <LoginForm />
    </main>
  );
}
