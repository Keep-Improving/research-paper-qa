import Link from "next/link";

import { RegisterForm } from "../../components/AuthForms";
import { AcademicShell } from "../../components/AcademicShell";
import { getServerMessages } from "../../lib/i18n/server";

export default async function RegisterPage() {
  const { t } = await getServerMessages();
  return (
    <AcademicShell>
      <div className="auth-page stack">
        <RegisterForm />
        <p className="row-copy">
          {t("auth.alreadyHaveAccount")} <Link href="/login">{t("auth.signIn")}</Link>.
        </p>
      </div>
    </AcademicShell>
  );
}
