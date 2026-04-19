import { generateIdenticon } from '@/lib/utils';
import { memo } from 'react';

type Props = {
  agentId: string;
  name: string;
  size?: number;
  className?: string;
};

const IdenticonInner = memo(function IdenticonInner({ agentId, size }: { agentId: string; size: number }) {
  const { grid, color } = generateIdenticon(agentId);
  const cellSize = size / 5;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <rect width={size} height={size} rx={size * 0.15} fill="#f0f0f0" />
      {grid.map((row, r) =>
        row.map((on, c) =>
          on ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill={color}
            />
          ) : null
        )
      )}
    </svg>
  );
});

export function AgentAvatar({ agentId, name, size = 36, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <IdenticonInner agentId={agentId} size={size} />
    </span>
  );
}
