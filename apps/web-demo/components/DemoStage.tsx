'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { PhoneFrame } from './PhoneFrame';
import { useDemo, type Screen } from '@/lib/demo-state';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { EmailScreen } from './screens/EmailScreen';
import { OtpScreen } from './screens/OtpScreen';
import { KycIntroScreen, KycProcessingScreen, KycDoneScreen } from './screens/KycScreens';
import { BankListScreen, BankAuthScreen, BankSuccessScreen } from './screens/BankScreens';
import { HomeScreen } from './screens/HomeScreen';
import {
  ContactsScreen,
  AddContactScreen,
  HistoryScreen,
  SettingsScreen,
} from './screens/ContactsScreen';
import { ChatScreen } from './screens/ChatScreen';
import { KeypadScreen } from './screens/KeypadScreen';
import { RecipientPickerScreen } from './screens/RecipientPickerScreen';
import {
  ConfirmScreen,
  FaceIdScreen,
  SendingScreen,
  SentScreen,
} from './screens/ConfirmFlow';

export function DemoStage() {
  return (
    <PhoneFrame>
      <ScreenSwitcher />
    </PhoneFrame>
  );
}

const SCREEN_MAP: Record<Screen, React.ComponentType> = {
  welcome: WelcomeScreen,
  email: EmailScreen,
  otp: OtpScreen,
  'kyc-intro': KycIntroScreen,
  'kyc-processing': KycProcessingScreen,
  'kyc-done': KycDoneScreen,
  'bank-list': BankListScreen,
  'bank-auth': BankAuthScreen,
  'bank-success': BankSuccessScreen,
  home: HomeScreen,
  contacts: ContactsScreen,
  'add-contact': AddContactScreen,
  history: HistoryScreen,
  settings: SettingsScreen,
  chat: ChatScreen,
  keypad: KeypadScreen,
  'recipient-picker': RecipientPickerScreen,
  confirm: ConfirmScreen,
  'face-id': FaceIdScreen,
  sending: SendingScreen,
  sent: SentScreen,
};

function ScreenSwitcher() {
  const { screen } = useDemo();
  const Screen = SCREEN_MAP[screen];
  return (
    <div className="relative h-full w-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
