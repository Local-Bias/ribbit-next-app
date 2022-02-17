import { get, getDatabase, ref } from 'firebase/database';
import { collection, getDocs } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getDB, initializeFirebase } from '../../../src/firebase';

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

const getResponseFromFirestore = async () => {
  const db = getDB();

  const querySnapshot = await getDocs(collection(db, 'kintone-plugin-users'));

  if (querySnapshot.empty) {
    throw 'コレクションが存在しません';
  }

  let counter = 0;

  querySnapshot.forEach((document) => {
    const data = document.data();
    counter += data?.counter || 0;
  });

  return {
    result: `取得完了`,
    counter,
    numUsers: querySnapshot.size,
  };
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
  initializeFirebase();
  const db = getDatabase();

  const reference = ref(db, 'kintone/users');

  const snapshot = await get(reference);

  const data: Record<string, KintoneUser> = snapshot.val();

  const kintoneUsers = Object.values(data);

  const counter = kintoneUsers.reduce((acc, user) => {
    return acc + (user.counter || 0);
  }, 0);

  const numUsers = kintoneUsers.filter((user) => !user.ignores);

  return {
    result: `取得完了`,
    counter,
    numUsers: numUsers.length,
  };
};
