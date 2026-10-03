import { ScannerPage } from "@/components/scanner/ScannerPage";
import { requireAnyRoleContext } from "@/server/auth/guards";

export default async function Page() {
  await requireAnyRoleContext("admin", "hr");

  return (
    <main className="scanner-route">
      <ScannerPage />
    </main>
  );
}
