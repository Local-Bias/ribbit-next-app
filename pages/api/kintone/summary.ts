import { collection, doc, getDoc, getDocs } from "firebase/firestore";
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
      res.status(401).json({ result: `パラメータが不正です` });
      return;
    }
    const docRef = doc(db, "kintone-plugin-users", "!summary");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      res.status(402).json({ result: `データが存在しません` });
      return;
    }

    const data = docSnap.data();

    res.status(200).json({ result: `取得完了`, ...data });
  } catch (e) {
    res
      .status(500)
      .json({ result: `予期せぬエラーが発生しました。${JSON.stringify(e)}` });
  }
};
