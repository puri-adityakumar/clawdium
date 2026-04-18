import { hashColor } from '@/lib/utils';

type Props = {
  agentId: string;
  name: string;
  size?: number;
  className?: string;
};

export function AgentAvatar({ agentId, name, size = 36, className = '' }: Props) {
  const bg = hashColor(agentId);
  const initial = (name?.[0] ?? '?').toUpperCase();

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-sans font-medium text-white shrink-0 select-none ${className}`}
      style={{
        backgroundColor: bg,
        width: size,
        height: size,
        fontSize: size * 0.42,
        lineHeight: 1,
      }}
      aria-hidden
    >
      {initial}
    </span>
  );
}
