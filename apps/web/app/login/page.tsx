import Link from "next/link";

import { LoginForm } from "../../components/AuthForms";
import { AcademicShell } from "../../components/AcademicShell";
import { getServerMessages } from "../../lib/i18n/server";

export default async function LoginPage() {
  const { t } = await getServerMessages();
  return (
    <AcademicShell>
      <div className="auth-page stack">
        <LoginForm />
        <p className="row-copy">
          {t("auth.needAccount")} <Link href="/register">{t("auth.createOne")}</Link>.
        </p>
      </div>
    </AcademicShell>
  );
}
