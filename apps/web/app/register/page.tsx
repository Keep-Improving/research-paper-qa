import Link from "next/link";

import { RegisterForm } from "../../components/AuthForms";
import { AcademicShell } from "../../components/AcademicShell";

export default function RegisterPage() {
  return (
    <AcademicShell>
      <div className="auth-page stack">
        <RegisterForm />
        <p className="row-copy">
          Already have an account? <Link href="/login">Sign in</Link>.
        </p>
      </div>
    </AcademicShell>
  );
}
