import React, { useState } from 'react'
import { Globe, MapPin, Home, Store, ChevronDown, ChevronRight } from 'lucide-react'

export interface TreeNode {
  id: string; name: string; type: string;
  children?: TreeNode[]; count?: number;
  store_id?: string; mall_id?: string;
  lng?: number; lat?: number;
  lbs?: Record<string, any>;
}

interface Props {
  data: TreeNode;
  onSelect: (node: TreeNode) => void;
  selectedId?: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  brand: <Globe className="w-3 h-3" />,
  region_group: <Globe className="w-3 h-3" />,
  region: <MapPin className="w-3 h-3" />,
  province: <MapPin className="w-3 h-3" />,
  city: <Home className="w-3 h-3" />,
  district: <MapPin className="w-3 h-3" />,
  store: <Store className="w-3 h-3" />,
  mall: <Home className="w-3 h-3" />,
  root: <Globe className="w-3 h-3" />,
}

const TreeBranch: React.FC<{ node: TreeNode; depth: number; onSelect: Props['onSelect']; selectedId?: string }> = ({ node, depth, onSelect, selectedId }) => {
  const [expanded, setExpanded] = useState(depth < 3)
  const hasChildren = node.children && node.children.length > 0
  const isLeaf = node.type === 'store' || node.type === 'mall'
  const isSelected = selectedId === node.id

  const handleClick = () => {
    if (hasChildren) setExpanded(!expanded)
    onSelect(node)
  }

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded transition-colors ${
          isSelected ? 'bg-[rgba(239,68,68,0.12)] text-red-400' :
          isLeaf ? 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]' :
          'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <ChevronDown className="w-3 h-3 shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 shrink-0" />
        )}
        {TYPE_ICONS[node.type] || null}
        <span className="truncate flex-1 text-left">{node.name}</span>
        {node.count !== undefined && node.count > 0 && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${
            isSelected ? 'bg-red-500/20' : 'bg-[var(--bg-tertiary)]'
          }`}>{node.count}</span>
        )}
      </button>
      {hasChildren && expanded && (
        <div>
          {node.children!.map(child => (
            <TreeBranch key={child.id} node={child} depth={depth + 1} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  )
}

export const TreeView: React.FC<Props> = ({ data, onSelect, selectedId }) => {
  return (
    <div className="h-full overflow-y-auto scrollbar-hide py-2">
      <TreeBranch node={data} depth={0} onSelect={onSelect} selectedId={selectedId} />
    </div>
  )
}
