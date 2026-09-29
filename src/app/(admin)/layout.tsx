// Корневой layout служебной части. Счётчики выключены: раньше это делалось
// чтением cookie admin_session в корне, что и тянуло за собой cookies().
import RootShell from "../RootShell";
export { metadata, viewport } from "../rootMetadata";

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootShell lang="ru" withAnalytics={false}>
      {children}
    </RootShell>
  );
}
