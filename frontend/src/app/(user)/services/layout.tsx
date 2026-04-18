/**
 * 避免 /services 被靜態快取，確保管理員更新 app_settings 後使用者能看到最新連結
 */
export const dynamic = 'force-dynamic';

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
