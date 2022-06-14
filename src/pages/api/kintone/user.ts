import { get, ref, set, update } from 'firebase/database';
import { DateTime } from 'luxon';
import type { NextApiRequest, NextApiResponse } from 'next';
import { rtdb } from 'src/lib/firebase/rdtb';

type Data = {
  result: string;
};

type ExpectedRequestBody = Partial<{
  hostname: string;
  pluginNames: string[];
  name: string;
  counter: number;
  installDate: string;
}>;

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  try {
    if (req.method === 'POST') {
      const body: ExpectedRequestBody = JSON.parse(req.body);

      let causedError = false;
      try {
        await updateRtdb(body);
      } catch (error) {
        console.error('realtime database更新時にエラーが発生しました', error);
        causedError = true;
      }
      if (!causedError) {
        res.status(200).json({ result: `データベースへ追加しました` });
      } else {
        await postToGAS(body);
        res.status(500).json({
          result: `予期せぬエラーが発生しました。`,
        });
      }
    }
  } catch (e) {
    res.status(500).json({ result: `予期せぬエラーが発生しました。${JSON.stringify(e)}` });
    throw 'API実行時にエラーが発生しました';
  }
};

const updateRtdb = async (body: ExpectedRequestBody) => {
  const hostname = body.hostname || '___undefined';

  const formattedHostname = hostname
    .replace('.cybozu.com', '')
    .replace('.kintone.com', '')
    .replace(/\./g, '_dot_');

  const reference = ref(rtdb, `kintone/users/${formattedHostname}`);

  const now = DateTime.local();

  const snapshot = await get(reference);

  if (!snapshot.exists()) {
    await set(reference, getNewProps(hostname, body));
  } else {
    const data = snapshot.val();
    const counter = data?.counter || 0;

    const pluginNames = body.pluginNames || [];
    const registered: string[] = data.pluginNames || [];

    const noChanges = pluginNames.every((plugin) => registered.includes(plugin));

    const base = {
      counter: counter + 1,
    };

    if (noChanges) {
      await update(reference, base);
    } else {
      await update(reference, {
        pluginNames: [...new Set([...pluginNames, ...registered])],
        ...base,
      });
    }
  }

  try {
    await updateCounter(formattedHostname);
  } catch (error) {
    console.error('カウンターの更新に失敗しました');
  }

  try {
    await updateInstallDate(formattedHostname, now);
  } catch (error) {
    console.error('インストール日付の更新に失敗しました');
  }

  try {
    await set(ref(rtdb, `kintone/lastModified/${formattedHostname}`), now.toISODate());
  } catch (error) {
    console.error('更新日付の更新に失敗しました');
  }
};

const updateCounter = async (hostname: string) => {
  const counterRef = ref(rtdb, `kintone/counter/${hostname}`);
  const counterSnapshot = await get(counterRef);

  if (counterSnapshot.exists()) {
    await set(counterRef, Number(counterSnapshot.val()) + 1);
  } else {
    await set(counterRef, 1);
  }
};

const updateInstallDate = async (hostname: string, now: DateTime) => {
  const installDateRef = ref(rtdb, `kintone/installDate/${hostname}`);
  const installDateSnapshot = await get(installDateRef);

  if (!installDateSnapshot.exists()) {
    await set(installDateRef, now.toISODate());
  }
};

const postToGAS = (body: ExpectedRequestBody) => {
  if (!process.env.GAS_END_POINT) {
    console.log('GAS WebアプリケーションのURLが登録されていません');
    return;
  }
  return fetch(process.env.GAS_END_POINT, {
    method: 'POST',
    body: JSON.stringify({
      ...body,
      from: 'ribbit-next-app',
    }),
  });
};

const getNewProps = (hostname: string, body: ExpectedRequestBody) => {
  return {
    hostname,
    name: body.name || '',
    pluginNames: body.pluginNames || [],
  };
};
