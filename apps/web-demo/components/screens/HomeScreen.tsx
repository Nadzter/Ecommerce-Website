'use client';

import { ArrowRight, Clock, Plus, Settings, Star, Users } from 'lucide-react';
import { Avatar, Card, CardRow } from '../ui/Card';
import { ScreenBody, ScreenContainer } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';
import { formatAed, formatRelativeDate } from '@/lib/data';

export function HomeScreen() {
  const { goTo, draft, contacts, transfers } = useDemo();
  const firstName = draft.fullName.split(' ')[0] || 'there';
  const favorites = contacts.filter((c) => c.isFavorite);
  const recent = transfers.slice(0, 3);

  return (
    <ScreenContainer>
      <div className="px-5 pt-12 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wider text-ink-400">Hello,</p>
          <h1 className="font-display text-[26px] leading-tight tracking-tight text-ink-900">
            {firstName}
          </h1>
        </div>
        <button
          onClick={() => goTo('settings')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-ink-100 text-ink-600 hover:bg-ink-50"
        >
          <Settings size={18} />
        </button>
      </div>

      <ScreenBody>
        {/* Balance card */}
        <Card className="overflow-hidden bg-gradient-to-br from-ink-800 to-ink-900 text-white border-0">
          <div className="p-5">
            <p className="text-[11px] uppercase tracking-wider text-ink-200/80">
              {draft.selectedBank?.shortName ?? 'Linked bank'} · •••• 0142
            </p>
            <p className="mt-1 font-display text-[34px] leading-none tracking-tight">
              AED 14,820.50
            </p>
            <p className="mt-1 text-[12px] text-ink-200/80">Available to send</p>
          </div>
          <div className="bg-white/5 backdrop-blur px-5 py-3 flex items-center justify-between border-t border-white/10">
            <span className="text-[12px] text-ink-200/80">Send via Amwali keyboard</span>
            <button
              onClick={() => goTo('chat')}
              className="flex items-center gap-1 text-[13px] font-semibold text-accent-300 hover:text-accent-200"
            >
              Try it <ArrowRight size={14} />
            </button>
          </div>
        </Card>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <QuickAction icon={Users} label="Send" onClick={() => goTo('contacts')} />
          <QuickAction icon={Clock} label="History" onClick={() => goTo('history')} />
          <QuickAction icon={Plus} label="Add" onClick={() => goTo('add-contact')} />
        </div>

        {/* Favorites */}
        <SectionHeader title="Favorites" trailing={
          <button
            className="text-[12px] font-medium text-ink-500 hover:text-ink-700"
            onClick={() => goTo('contacts')}
          >
            All contacts
          </button>
        } />
        <Card className="overflow-hidden">
          {favorites.map((c, i) => (
            <div key={c.id} className={i > 0 ? 'border-t border-ink-50' : ''}>
              <CardRow
                leading={<Avatar emoji={c.emoji} color="#E1E9F2" />}
                title={c.name}
                subtitle={c.phone}
                trailing={<Star size={16} className="text-amber-400 fill-amber-400" />}
                onClick={() => goTo('contacts')}
              />
            </div>
          ))}
        </Card>

        {/* Recent activity */}
        <SectionHeader title="Recent" trailing={
          <button
            className="text-[12px] font-medium text-ink-500 hover:text-ink-700"
            onClick={() => goTo('history')}
          >
            See all
          </button>
        } />
        <Card className="overflow-hidden">
          {recent.length === 0 ? (
            <div className="p-5 text-center text-[13px] text-ink-400">
              No transfers yet — send your first one.
            </div>
          ) : (
            recent.map((t, i) => {
              const c = contacts.find((x) => x.id === t.contactId);
              return (
                <div key={t.id} className={i > 0 ? 'border-t border-ink-50' : ''}>
                  <CardRow
                    leading={<Avatar emoji={c?.emoji ?? '👤'} color="#E1E9F2" />}
                    title={c?.name ?? 'Unknown'}
                    subtitle={`${t.reference} · ${formatRelativeDate(t.initiatedAt)}`}
                    trailing={
                      <span className="text-[14px] font-semibold text-ink-900">
                        −{formatAed(t.amountAed)}
                      </span>
                    }
                  />
                </div>
              );
            })
          )}
        </Card>
      </ScreenBody>
    </ScreenContainer>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-ink-100 bg-white py-3.5 text-ink-700 hover:bg-ink-50 active:bg-ink-100 transition-colors"
    >
      <Icon size={18} />
      <span className="text-[12px] font-medium">{label}</span>
    </button>
  );
}

function SectionHeader({ title, trailing }: { title: string; trailing?: React.ReactNode }) {
  return (
    <div className="mt-6 mb-2 flex items-end justify-between">
      <h2 className="text-[12px] font-semibold uppercase tracking-wider text-ink-500">{title}</h2>
      {trailing}
    </div>
  );
}
