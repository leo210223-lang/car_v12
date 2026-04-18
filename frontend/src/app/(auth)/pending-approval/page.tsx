import { ShieldAlert, Clock3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignOutButton } from './SignOutButton';

interface PendingApprovalPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PendingApprovalPage({ searchParams }: PendingApprovalPageProps) {
  const params = await searchParams;
  const rawStatus = params?.status;
  const statusValue = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const status = statusValue === 'rejected' || statusValue === 'suspended' ? statusValue : 'pending';

  const content =
    status === 'pending'
      ? {
          title: '帳號審核中',
          description:
            '您的帳號正在人工審核中。為了確保平台為真實車商同業，我們需要一點時間核對資料，請耐心等候。',
          icon: <Clock3 className="h-8 w-8 text-amber-600" />,
        }
      : {
          title: '帳號目前無法使用',
          description: '您的帳號目前無法使用此平台，如有疑問請聯繫客服。',
          icon: <ShieldAlert className="h-8 w-8 text-red-600" />,
        };

  return (
    <Card className="card-gold-border">
      <CardHeader>
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
          {content.icon}
        </div>
        <CardTitle>{content.title}</CardTitle>
        <CardDescription className="leading-relaxed">{content.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <SignOutButton />
      </CardContent>
    </Card>
  );
}
