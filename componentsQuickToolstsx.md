'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Props = { onPick?: (cmd: string) => void };

const TOOLS = [
  { key: 'profile',   label: '나의 정보',        emoji: '🧑‍✈️', cmd: '나의 정보 보기', href: '/profile' },
  { key: 'check',     label: '여행준비물 체크',   emoji: '🧳',    cmd: '여행준비물 체크', href: '/checklist' },
  { key: 'currency',  label: '환율 계산기',      emoji: '💱',    cmd: '환율 계산기',    href: '/wallet' },
  { key: 'translate', label: '번역기',           emoji: '🔤',    cmd: '번역기',         href: '/translator' },
];

export default function QuickTools({ onPick }: Props) {
  const btn =
    'min-h-[56px] sm:min-h-[60px] px-3 py-2 rounded-xl border bg-white ' +
    'hover:bg-gray-50 active:scale-[0.99] flex items-center justify-center ' +
    'gap-2 text-[16px] font-bold text-gray-900';

  return (
    <div className="px-4 py-3 border-b bg-white/85 backdrop-blur sticky top-[var(--top-offset,0px)] z-20">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TOOLS.map(t => (
          <Link
            key={t.key}
            href={t.href}
            prefetch
            onClick={() => onPick?.(t.cmd)}
            className={btn}
            aria-label={t.label}
          >
            <span className="text-[20px]" aria-hidden>{t.emoji}</span>
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
} 
