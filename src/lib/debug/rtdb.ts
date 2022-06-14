import { get, ref, set } from 'firebase/database';
import { DateTime } from 'luxon';
import { rtdb } from '../firebase/rdtb';

type KintoneUser = Partial<{
  counter: number;
  hostname: string;
  installDate: string;
  lastModified: string;
  name: string;
  pluginNames: string[];
}>;

export const mergeCounter = async () => {
  const usersRef = ref(rtdb, 'kintone/users');

  const usersSnapshot = await get(usersRef);

  const users: Record<string, KintoneUser> = usersSnapshot.val();

  for (const [domain, user] of Object.entries(users)) {
    const installRef = ref(rtdb, `kintone/installDate/${domain}`);

    const installSnapshot = await get(installRef);

    if (installSnapshot.exists()) {
      continue;
    }

    let date = new Date();
    if (user.installDate && !isNaN(Date.parse(user.installDate))) {
      date = new Date(user.installDate);
    }

    const dateString = DateTime.fromJSDate(date).toISODate();

    console.log(`🦝 ドメイン名「${domain}」のインストール日付が未設定のため、追加します`);
    await set(installRef, dateString);
  }
  console.log(`🎉 全て完了しました`);
};
