import { child, get, ref, set, update } from 'firebase/database';
import { rtdb } from '../firebase/rdtb';
import { CSV } from './csv';

export const writeUserData = async (hostname: string, props: any) => {
  try {
    const formattedHostname = hostname
      .replace('.cybozu.com', '')
      .replace('.kintone.com', '')
      .replaceAll('.', '_dot_');

    const snapshot = await get(child(ref(rtdb), `kintone/users/${formattedHostname}`));

    const reference = ref(rtdb, `kintone/users/${formattedHostname}`);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const counter = data?.counter || 0;

      await update(reference, {
        ...data,
        counter: counter + 1,
      });
    } else {
      await set(reference, {
        hostname,
        ...props,
      });
    }
  } catch (error) {
    console.error('error', error);
  }
};

type KintoneUser = Partial<{
  counter: number;
  hostname: string;
  installDate: string;
  lastModified: string;
  name: string;
  pluginNames: string[];
}>;

export const getAllData = async () => {
  const reference = ref(rtdb, 'kintone/users');

  const snapshot = await get(reference);

  const data: Record<string, KintoneUser> = snapshot.val();

  console.log({ data });

  const kintoneUsers = Object.values(data);

  const counter = kintoneUsers.reduce((acc, user) => {
    return acc + (user.counter || 0);
  }, 0);

  console.log({
    numUsers: kintoneUsers.length,
    counter,
  });
};

export const importCSV = async (files: File[]) => {
  const csv = await CSV.fromFile(files[0]);

  const [_, ...data] = csv.toArrays();

  const formatted = data.reduce<KintoneUser[]>((acc, row) => {
    const pluginCell = row[3].replace('"', '');

    const pluginNames = pluginCell ? pluginCell.split('\n') : [];

    const lastModified = isDate(row[1]) ? new Date(row[1]).toLocaleString('ja-JP') : '';
    const installDate = isDate(row[2]) ? new Date(row[2]).toLocaleString('ja-JP') : '';

    const user: KintoneUser = {
      hostname: row[0],
      lastModified,
      installDate,
      pluginNames,
      counter: Number(row[4]),
      name: row[5].replace('\n', '').replace('"', ''),
    };

    return [...acc, user];
  }, []);

  console.log(formatted);
  return formatted;
};

export const mergeDatabase = async (files: File[]) => {
  const csvData = await importCSV(files);

  for (const user of csvData) {
    if (!user.hostname) {
      console.log('次のユーザー情報に不足があったため、処理をスキップします', user);
      continue;
    }

    const formattedHostname = user.hostname
      .replace('.cybozu.com', '')
      .replace('.kintone.com', '')
      .replace(/\./g, '_dot_');

    const reference = ref(rtdb, `kintone/users/${formattedHostname}`);

    const snapshot = await get(reference);

    if (!snapshot.exists()) {
      await set(reference, user);
    } else {
      const data = snapshot.val();

      const pluginNames = user.pluginNames || [];
      const registered: string[] = data.pluginNames || [];

      const formattedUser: KintoneUser = {
        name: user.name || data.name || '',
        pluginNames: [...new Set([...pluginNames, ...registered])],
        counter: (user.counter || 1) + (data.counter || 1),
      };

      if (user.installDate && isDate(user.installDate) && isDate(data.installDate)) {
        const current = new Date(data.installDate);
        const target = new Date(user.installDate);

        if (current.getMilliseconds() < target.getMilliseconds()) {
          formattedUser.installDate = user.installDate;
        }
      }

      await update(reference, formattedUser);
    }
  }

  console.log('👍 すべてのデータをマージしました');
};

const isDate = (v: string | number): boolean => !isNaN(new Date(v).getTime());
