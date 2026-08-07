import Link from "next/link";

import { LoginForm } from "../../components/AuthForms";
import { AcademicShell } from "../../components/AcademicShell";

export default function LoginPage() {
  return (
    <AcademicShell>
      <div className="auth-page stack">
        <LoginForm />
        <p className="row-copy">
          Need an account? <Link href="/register">Create one</Link>.
        </p>
      </div>
    </AcademicShell>
  );
}
