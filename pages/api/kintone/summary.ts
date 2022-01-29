import { collection, getDocs } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { getDB } from "../../../src/firebase";

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

    let counter = 0;

    querySnapshot.forEach((document) => {
      const data = document.data();
      counter += data?.counter || 0;
    });

    res
      .status(200)
      .json({ result: `取得完了`, counter, numUsers: querySnapshot.size });
  } catch (e) {
    res
      .status(500)
      .json({ result: `予期せぬエラーが発生しました。${JSON.stringify(e)}` });
  }
};

// const getSummaryFromDoc = async (db: Firestore) => {
//   const docRef = doc(db, "kintone-plugin-users", "!summary");
//   const docSnap = await getDoc(docRef);

//   if (!docSnap.exists()) {
//     res.status(402).json({ result: `データが存在しません` });
//     return;
//   }

//   const data = docSnap.data();
// };
