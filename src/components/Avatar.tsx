import { useState } from 'react';
import { getInitials, resolveAvatarUrl } from '../assets/media';

export function Avatar({
  src,
  name,
  size = 'md',
  className = '',
}: {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = resolveAvatarUrl(src);

  const dims =
    size === 'sm'
      ? 'w-8 h-8 text-xs'
      : size === 'lg'
      ? 'w-12 h-12 text-sm'
      : size === 'xl'
      ? 'w-20 h-20 text-xl'
      : 'w-9 h-9 text-xs';

  if (resolved && !failed) {
    return (
      <img
        src={resolved}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${dims} rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${dims} rounded-full bg-[#0B1F3A] text-white font-semibold flex items-center justify-center shrink-0 border border-slate-200 ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
