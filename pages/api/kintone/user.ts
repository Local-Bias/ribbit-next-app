import { get, getDatabase, ref, set, update } from 'firebase/database';
import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  result: string;
};

type ExpectedRequestBody = Partial<{
  hostname: string;
  pluginNames: string[];
  name: '';
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
  const db = getDatabase();

  const hostname = body.hostname || '___unknown';

  const formattedHostname = hostname
    .replace('.cybozu.com', '')
    .replace('.kintone.com', '')
    .replace(/\./g, '_dot_');

  const reference = ref(db, `kintone/users/${formattedHostname}`);

  const snapshot = await get(reference);

  if (!snapshot.exists()) {
    await set(reference, getNewProps(hostname, body, { rtdb: true }));
  } else {
    const data = snapshot.val();
    const counter = data?.counter || 0;

    const pluginNames = body.pluginNames || [];
    const registered: string[] = data.pluginNames || [];

    const noChanges = pluginNames.every((plugin) => registered.includes(plugin));

    const base = {
      counter: counter + 1,
      lastModified: new Date().toLocaleString('ja-JP'),
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

const getNewProps = (hostname: string, body: ExpectedRequestBody, options?: { rtdb?: boolean }) => {
  const date = body.installDate ? new Date(body.installDate) : new Date();

  return {
    hostname,
    name: body.name || '',
    counter: body.counter || 1,
    pluginNames: body.pluginNames || [],
    installDate: options?.rtdb ? date.toLocaleString() : date,
    lastModified: options?.rtdb ? date.toLocaleString() : date,
  };
};
