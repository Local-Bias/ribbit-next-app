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

export const removeLegacyUserData = async () => {
  const usersRef = ref(rtdb, 'kintone/users');

  const usersSnapshot = await get(usersRef);

  if (!usersSnapshot.exists()) {
    console.error('ユーザー情報の取得に失敗しました');
    return;
  }

  const users = usersSnapshot.val();

  for (const hostname of Object.keys(users)) {
    set(ref(rtdb, `kintone/users/${hostname}/installDate`), null);
    set(ref(rtdb, `kintone/users/${hostname}/lastModified`), null);
    set(ref(rtdb, `kintone/users/${hostname}/hostname`), null);
    set(ref(rtdb, `kintone/users/${hostname}/counter`), null);
    console.log(`🔥 ${hostname}のユーザー情報の一部を削除しました`);
  }
};
