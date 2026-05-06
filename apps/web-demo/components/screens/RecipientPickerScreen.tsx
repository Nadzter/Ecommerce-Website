'use client';

import { useState } from 'react';
import { Search, Star } from 'lucide-react';
import { Avatar } from '../ui/Card';
import { Field } from '../ui/Field';
import { ScreenContainer } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';
import { maskIban } from '@/lib/data';

export function RecipientPickerScreen() {
  const { goBack, contacts, setKbd } = useDemo();
  const [query, setQuery] = useState('');
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, '')),
  );
  const favorites = filtered.filter((c) => c.isFavorite);
  const others = filtered.filter((c) => !c.isFavorite);

  function pick(id: string) {
    setKbd({ recipientId: id });
    goBack();
  }

  return (
    <ScreenContainer bg="bg-[#0E141A]">
      <div className="flex h-full flex-col text-white">
        <div className="flex items-center justify-between px-4 pt-12 pb-3">
          <button onClick={goBack} className="text-[14px] text-white/60 hover:text-white">
            Cancel
          </button>
          <span className="text-[15px] font-semibold">Send to</span>
          <span className="w-12" />
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search contacts"
              className="w-full h-11 rounded-xl bg-white/[0.08] pl-10 pr-3 text-[14px] text-white placeholder:text-white/40 outline-none focus:bg-white/[0.12]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-none">
          {favorites.length > 0 ? (
            <Section label="Favorites">
              {favorites.map((c) => (
                <Row
                  key={c.id}
                  emoji={c.emoji}
                  name={c.name}
                  detail={maskIban(c.iban)}
                  badge={<Star size={12} className="text-amber-300 fill-amber-300" />}
                  onClick={() => pick(c.id)}
                />
              ))}
            </Section>
          ) : null}

          {others.length > 0 ? (
            <Section label="All contacts">
              {others.map((c) => (
                <Row
                  key={c.id}
                  emoji={c.emoji}
                  name={c.name}
                  detail={maskIban(c.iban)}
                  onClick={() => pick(c.id)}
                />
              ))}
            </Section>
          ) : null}

          {filtered.length === 0 ? (
            <div className="mt-10 text-center text-[13px] text-white/40">No matches.</div>
          ) : null}
        </div>
      </div>
    </ScreenContainer>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div className="rounded-2xl bg-white/[0.04] overflow-hidden">{children}</div>
    </div>
  );
}

function Row({
  emoji,
  name,
  detail,
  badge,
  onClick,
}: {
  emoji: string;
  name: string;
  detail: string;
  badge?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors"
    >
      <Avatar emoji={emoji} color="rgba(255,255,255,0.15)" size={36} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[14px] font-medium text-white truncate">
          {name}
          {badge}
        </div>
        <div className="text-[12px] text-white/50 truncate font-mono">{detail}</div>
      </div>
    </button>
  );
}
