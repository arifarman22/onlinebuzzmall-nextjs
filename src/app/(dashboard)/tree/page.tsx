import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import TreeView from '@/components/dashboard/TreeView';

export default async function TreePage() {
  const session = await auth();
  const userId = Number(session?.user?.id);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  // Get 3 levels of binary tree
  async function getNode(id: number) {
    return db.user.findUnique({
      where: { id },
      select: { id: true, username: true, firstname: true, lastname: true, plan_id: true, position: true },
    });
  }

  async function getChildren(posId: number) {
    return db.user.findMany({
      where: { pos_id: posId },
      select: { id: true, username: true, firstname: true, lastname: true, plan_id: true, position: true },
    });
  }

  const root = await getNode(userId);
  const level1 = await getChildren(userId);
  const left = level1.find((u) => u.position === 1);
  const right = level1.find((u) => u.position === 2);

  const level2Left = left ? await getChildren(left.id) : [];
  const level2Right = right ? await getChildren(right.id) : [];

  const treeData = {
    root,
    left: left || null,
    right: right || null,
    leftLeft: level2Left.find((u) => u.position === 1) || null,
    leftRight: level2Left.find((u) => u.position === 2) || null,
    rightLeft: level2Right.find((u) => u.position === 1) || null,
    rightRight: level2Right.find((u) => u.position === 2) || null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Binary Tree</h2>
        <p className="mt-1 text-gray-600">Your MLM network structure</p>
      </div>

      <Card>
        <CardContent className="py-8">
          <TreeView tree={treeData} />
        </CardContent>
      </Card>
    </div>
  );
}
