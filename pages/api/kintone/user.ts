import { doc, increment, runTransaction } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { getDB } from "../../../src/firebase";

type Data = {
  result: string;
};

type ExpectedRequestBody = Partial<{
  hostname: string;
  pluginNames: string[];
}>;

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  try {
    const db = getDB();

    if (req.method === "POST") {
      const body: ExpectedRequestBody = JSON.parse(req.body);

      const hostname = body.hostname || "___unknown";

      const ref = doc(db, "kintone-plugin-users", hostname);

      await runTransaction(db, async (transaction) => {
        const doc = await transaction.get(ref);
        if (!doc.exists()) {
          await transaction.set(ref, {
            hostname,
            name: "",
            counter: 1,
            pluginNames: [],
            installDate: new Date(),
          });
          return;
        }

        const data = doc.data();

        const pluginNames = body.pluginNames || [];
        const registered = data.pluginNames || [];

        await transaction.update(ref, {
          pluginNames: [...new Set([...pluginNames, ...registered])],
          counter: increment(1),
        });
      });
      res.status(200).json({ result: `データベースへ追加しました` });
    }
  } catch (e) {
    res
      .status(500)
      .json({ result: `予期せぬエラーが発生しました。${JSON.stringify(e)}` });
  }
};
