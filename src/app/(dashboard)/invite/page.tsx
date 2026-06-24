import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { DarkCard as Card, DarkCardContent as CardContent, DarkCardHeader as CardHeader } from '@/components/ui/DarkCard';
import { formatAmount, formatDate } from '@/lib/utils';
import CopyButton from '@/components/dashboard/CopyButton';

export default async function InvitePage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${user.id}`;

  // Get referral levels
  const level1 = await db.user.findMany({
    where: { ref_by: userId },
    select: { id: true, username: true, firstname: true, lastname: true, created_at: true, balance: true },
    orderBy: { id: 'desc' },
  });

  const level1Ids = level1.map((u) => u.id);
  const level2 = level1Ids.length > 0
    ? await db.user.findMany({
        where: { ref_by: { in: level1Ids } },
        select: { id: true, username: true, firstname: true, lastname: true, created_at: true },
        orderBy: { id: 'desc' },
      })
    : [];

  const level2Ids = level2.map((u) => u.id);
  const level3 = level2Ids.length > 0
    ? await db.user.findMany({
        where: { ref_by: { in: level2Ids } },
        select: { id: true, username: true, firstname: true, lastname: true, created_at: true },
        orderBy: { id: 'desc' },
      })
    : [];

  const levels = [
    { label: 'Level 1', users: level1 },
    { label: 'Level 2', users: level2 },
    { label: 'Level 3', users: level3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Invite Friends</h2>
        <p className="mt-1 text-slate-400">Earn commissions from your referral network</p>
      </div>

      {/* Referral Link */}
      <Card>
        <CardContent className="py-6">
          <p className="text-sm font-medium text-slate-300 mb-2">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 font-mono"
            />
            <CopyButton text={referralLink} />
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Share this link with friends. You earn commission when they deposit and complete orders.
          </p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{level1.length}</p>
            <p className="text-xs text-slate-400">Level 1</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{level2.length}</p>
            <p className="text-xs text-slate-400">Level 2</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold text-emerald-400">{level3.length}</p>
            <p className="text-xs text-slate-400">Level 3</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Lists */}
      {levels.map((level) => (
        <Card key={level.label}>
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">{level.label} ({level.users.length})</h3>
          </CardHeader>
          <CardContent>
            {level.users.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No referrals at this level</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {level.users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-white">{u.firstname} {u.lastname}</p>
                      <p className="text-xs text-slate-400">@{u.username}</p>
                    </div>
                    <p className="text-xs text-slate-500">{formatDate(u.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
