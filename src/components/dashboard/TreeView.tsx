'use client';

import { cn } from '@/lib/utils';

interface TreeNode {
  id: number;
  username: string;
  firstname: string | null;
  lastname: string | null;
  plan_id: number;
  position: number | null;
}

interface TreeData {
  root: TreeNode | null;
  left: TreeNode | null;
  right: TreeNode | null;
  leftLeft: TreeNode | null;
  leftRight: TreeNode | null;
  rightLeft: TreeNode | null;
  rightRight: TreeNode | null;
}

function NodeCard({ node }: { node: TreeNode | null }) {
  if (!node) {
    return (
      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
        <span className="text-xs text-gray-400">Empty</span>
      </div>
    );
  }

  const isPaid = node.plan_id > 0;

  return (
    <div className={cn(
      'w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center p-2 text-center',
      isPaid ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 bg-gray-50'
    )}>
      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mb-1', isPaid ? 'bg-emerald-500' : 'bg-gray-400')}>
        {node.firstname?.[0] || node.username[0].toUpperCase()}
      </div>
      <p className="text-[10px] font-medium text-gray-900 truncate w-full">@{node.username}</p>
      <p className="text-[9px] text-gray-500">{isPaid ? 'Paid' : 'Free'}</p>
    </div>
  );
}

export default function TreeView({ tree }: { tree: TreeData }) {
  return (
    <div className="flex flex-col items-center space-y-6 overflow-x-auto min-w-[600px]">
      {/* Level 0 - Root */}
      <div className="flex justify-center">
        <NodeCard node={tree.root} />
      </div>

      {/* Connector */}
      <div className="w-px h-6 bg-gray-300" />

      {/* Level 1 */}
      <div className="flex items-start justify-center gap-24 relative">
        {/* Horizontal line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gray-300" />
        <div className="flex flex-col items-center">
          <div className="w-px h-4 bg-gray-300" />
          <NodeCard node={tree.left} />
        </div>
        <div className="flex flex-col items-center">
          <div className="w-px h-4 bg-gray-300" />
          <NodeCard node={tree.right} />
        </div>
      </div>

      {/* Connectors */}
      <div className="flex justify-center gap-24">
        <div className="w-px h-6 bg-gray-300" />
        <div className="w-px h-6 bg-gray-300" />
      </div>

      {/* Level 2 */}
      <div className="flex items-start justify-center gap-8">
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gray-300" />
            <NodeCard node={tree.leftLeft} />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gray-300" />
            <NodeCard node={tree.leftRight} />
          </div>
        </div>
        <div className="w-16" />
        <div className="flex gap-8">
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gray-300" />
            <NodeCard node={tree.rightLeft} />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-px h-4 bg-gray-300" />
            <NodeCard node={tree.rightRight} />
          </div>
        </div>
      </div>
    </div>
  );
}
