import { getSessionUser } from '@/lib/session';
import { getSetting } from '@/lib/settings';
import SupportClient from './SupportClient';

export default async function SupportPage() {
  const user0 = await getSessionUser();
  if (!user0) return null;

  const [header, telegram, whatsapp, livechat, email] = await Promise.all([
    getSetting('support_header', "Need Help? We're Here for You"),
    getSetting('support_telegram'),
    getSetting('support_whatsapp'),
    getSetting('support_livechat'),
    getSetting('support_email'),
  ]);

  return <SupportClient header={header} telegram={telegram} whatsapp={whatsapp} livechat={livechat} email={email} />;
}
