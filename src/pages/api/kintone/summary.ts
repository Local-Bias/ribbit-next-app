import { get, ref, set } from 'firebase/database';
import { DateTime } from 'luxon';
import type { NextApiRequest, NextApiResponse } from 'next';
import { rtdb } from 'src/lib/firebase/rdtb';

type Data = {
  result: string;
  counter?: number;
  numUsers?: number;
};

type ExpectedRequestBody = Partial<{
  domain: string;
  pluginNames: string[];
}>;

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  try {
    if (req.method !== 'GET') {
      res.status(400).json({ result: `パラメータが不正です` });
      return;
    }

    const responseData = await getResponseFromRtdb();

    res.status(200).json(responseData);
  } catch (e) {
    res.status(500).json({ result: `予期せぬエラーが発生しました。${JSON.stringify(e)}` });
  }
};

type KintoneUser = Partial<{
  counter: number;
  hostname: string;
  installDate: string;
  lastModified: string;
  name: string;
  pluginNames: string[];
  ignores: boolean;
}>;

const getResponseFromRtdb = async () => {
  const reference = ref(rtdb, 'kintone/users');

  const snapshot = await get(reference);

  const data: Record<string, KintoneUser> = snapshot.val();

  const kintoneUsers = Object.values(data);

  const numUsers = kintoneUsers.filter((user) => !user.ignores);

  const counter = kintoneUsers.reduce((acc, user) => {
    return acc + (user.counter || 0);
  }, 0);

  try {
    const now = DateTime.local();
    const summaryRef = ref(rtdb, `kintone/summary/${now.toISODate()}`);
    const summarySnapshot = await get(summaryRef);

    if (!summarySnapshot.exists()) {
      const unixTime = now.toUnixInteger();
      await set(summaryRef, { unixTime, numUsers: numUsers.length, counter });
    }
  } catch (error) {
    console.error('集計情報をDBに登録する際にエラーが発生しました');
  }

  return {
    result: `取得完了`,
    counter,
    numUsers: numUsers.length,
  };
};
