'use client';

import { useState } from 'react';
import { ChevronRight, Search, Star } from 'lucide-react';
import { Avatar, Card, CardRow } from '../ui/Card';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { ScreenBody, ScreenContainer, ScreenFooter, ScreenHeader } from '../PhoneFrame';
import { useDemo } from '@/lib/demo-state';
import { maskIban } from '@/lib/data';

export function ContactsScreen() {
  const { goBack, goTo, contacts } = useDemo();
  const [query, setQuery] = useState('');

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.replace(/\s+/g, '').includes(query.replace(/\s+/g, '')),
  );

  return (
    <ScreenContainer>
      <ScreenHeader onBack={goBack} title="Contacts" />
      <ScreenBody>
        <Field
          placeholder="Search by name or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          trailing={<Search size={16} />}
        />

        <Card className="mt-4 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-5 text-center text-[13px] text-ink-400">No contacts match.</div>
          ) : (
            filtered.map((c, i) => (
              <div key={c.id} className={i > 0 ? 'border-t border-ink-50' : ''}>
                <CardRow
                  leading={<Avatar emoji={c.emoji} color="#E1E9F2" />}
                  title={
                    <span className="flex items-center gap-1.5">
                      {c.name}
                      {c.isFavorite ? (
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                      ) : null}
                    </span>
                  }
                  subtitle={maskIban(c.iban)}
                  trailing={<ChevronRight size={16} />}
                  onClick={() => goTo('chat')}
                />
              </div>
            ))
          )}
        </Card>
      </ScreenBody>
      <ScreenFooter>
        <Button full size="lg" variant="subtle" onClick={() => goTo('add-contact')}>
          + Add new contact
        </Button>
      </ScreenFooter>
    </ScreenContainer>
  );
}

export function AddContactScreen() {
  const { goBack, addContact } = useDemo();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+971 ');
  const [iban, setIban] = useState('AE ');

  const valid = name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 9 && iban.replace(/\s+/g, '').length >= 15;

  function save() {
    addContact({
      name: name.trim(),
      phone,
      iban,
      emoji: '👤',
    });
    goBack();
  }

  return (
    <ScreenContainer>
      <ScreenHeader onBack={goBack} title="New contact" />
      <ScreenBody>
        <p className="text-[14px] text-ink-500">
          Add someone you want to send to. You'll need their UAE bank IBAN.
        </p>
        <div className="mt-5 space-y-4">
          <Field
            label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hassan Al Naqbi"
          />
          <Field
            label="Phone (E.164)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+971 50 000 0000"
            inputMode="tel"
          />
          <Field
            label="IBAN"
            value={iban}
            onChange={(e) => setIban(e.target.value.toUpperCase())}
            placeholder="AE07 0331 2345 6789 0123 456"
            inputMode="text"
            hint="UAE IBANs start with AE and are 23 characters."
          />
        </div>
      </ScreenBody>
      <ScreenFooter>
        <Button full size="lg" disabled={!valid} onClick={save}>
          Save contact
        </Button>
      </ScreenFooter>
    </ScreenContainer>
  );
}

export function HistoryScreen() {
  const { goBack, transfers, contacts } = useDemo();

  return (
    <ScreenContainer>
      <ScreenHeader onBack={goBack} title="Activity" />
      <ScreenBody>
        {transfers.length === 0 ? (
          <div className="mt-10 text-center text-[14px] text-ink-400">No activity yet.</div>
        ) : (
          <Card className="overflow-hidden">
            {transfers.map((t, i) => {
              const c = contacts.find((x) => x.id === t.contactId);
              const tone = t.state === 'completed' ? 'text-ink-900' : t.state === 'failed' ? 'text-red-600' : 'text-amber-600';
              const stateLabel = t.state === 'completed' ? 'Sent' : t.state === 'failed' ? 'Failed' : 'In progress';
              return (
                <div key={t.id} className={i > 0 ? 'border-t border-ink-50' : ''}>
                  <CardRow
                    leading={<Avatar emoji={c?.emoji ?? '👤'} color="#E1E9F2" />}
                    title={c?.name ?? 'Unknown'}
                    subtitle={`${t.reference || stateLabel} · ${formatDateTime(t.initiatedAt)}`}
                    trailing={
                      <div className="text-right">
                        <div className={`text-[14px] font-semibold ${tone}`}>
                          −{new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' }).format(t.amountAed)}
                        </div>
                        <div className="text-[11px] uppercase tracking-wider text-ink-400">
                          {stateLabel}
                        </div>
                      </div>
                    }
                  />
                </div>
              );
            })}
          </Card>
        )}
      </ScreenBody>
    </ScreenContainer>
  );
}

export function SettingsScreen() {
  const { goBack, reset, draft } = useDemo();
  return (
    <ScreenContainer>
      <ScreenHeader onBack={goBack} title="Settings" />
      <ScreenBody>
        <Card className="overflow-hidden">
          <CardRow
            leading={<Avatar initials={draft.fullName.split(' ').map((s) => s[0]).join('').slice(0, 2) || 'A'} color="#0A2540" />}
            title={draft.fullName || 'Demo user'}
            subtitle={draft.email || 'demo@amwali.app'}
          />
        </Card>

        <div className="mt-5 space-y-2">
          <SettingsItem label="Bank account" value={draft.selectedBank?.shortName ?? '—'} />
          <SettingsItem label="Country" value="🇦🇪 United Arab Emirates" />
          <SettingsItem label="Default currency" value="AED" />
          <SettingsItem label="Face ID for transfers" value="On" />
          <SettingsItem label="Keyboard Full Access" value="Allowed" />
        </div>

        <Card className="mt-6 overflow-hidden">
          <CardRow title="Privacy policy" />
          <div className="border-t border-ink-50">
            <CardRow title="Terms of service" />
          </div>
          <div className="border-t border-ink-50">
            <CardRow title="Get help" />
          </div>
        </Card>

        <button
          onClick={reset}
          className="mt-6 w-full rounded-2xl bg-ink-50 px-4 py-3 text-[13px] font-semibold text-ink-700 hover:bg-ink-100"
        >
          Restart demo
        </button>
        <p className="mt-2 text-center text-[11px] text-ink-400">
          Demo preview · v0.1.0
        </p>
      </ScreenBody>
    </ScreenContainer>
  );
}

function SettingsItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white border border-ink-100 px-4 py-3">
      <span className="text-[14px] text-ink-700">{label}</span>
      <span className="text-[14px] font-medium text-ink-900">{value}</span>
    </div>
  );
}

function formatDateTime(d: Date): string {
  return d.toLocaleString('en-AE', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}
