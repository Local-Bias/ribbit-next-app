import { collection, getDocs } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { getDB } from "../../../src/firebase";

type Data = {
  result: string;
  count?: number;
  user?: number;
};

type ExpectedRequestBody = Partial<{
  domain: string;
  pluginNames: string[];
}>;

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  try {
    const db = getDB();

    if (req.method !== "GET") {
      res.status(400).json({ result: `パラメータが不正です` });
      return;
    }
    const querySnapshot = await getDocs(collection(db, "kintone-plugin-users"));

    if (querySnapshot.empty) {
      res.status(400).json({ result: `コレクションが存在しません` });
      return;
    }

    let count = 0;

    querySnapshot.forEach((document) => {
      const data = document.data();
      count += data?.counter || 0;
    });

    res
      .status(200)
      .json({ result: `取得完了`, count, user: querySnapshot.size });
  } catch (e) {
    res
      .status(500)
      .json({ result: `予期せぬエラーが発生しました。${JSON.stringify(e)}` });
  }
};
