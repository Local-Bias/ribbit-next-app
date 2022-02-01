import { doc, increment, runTransaction } from "firebase/firestore";
import type { NextApiRequest, NextApiResponse } from "next";
import { getDB } from "../../../src/firebase";

type Data = {
  result: string;
};

type ExpectedRequestBody = Partial<{
  hostname: string;
  pluginNames: string[];
  name: "";
  counter: number;
  installDate: string;
}>;

const GAS_END_POINT =
  "https://script.google.com/macros/s/AKfycbwtMnUUf9oma_5PPYM1JYQrUWjyt8XcKODvtiHghNucI370piyynTSqmN91kx-bN08/exec";

export default async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  try {
    if (req.method === "POST") {
      const body: ExpectedRequestBody = JSON.parse(req.body);
      try {
        await doPost(body, res);
      } catch (error) {
        await postToGAS(body);
      }
    }
  } catch (e) {
    res
      .status(500)
      .json({ result: `予期せぬエラーが発生しました。${JSON.stringify(e)}` });
    throw "API実行時にエラーが発生しました";
  }
};

const doPost = async (
  body: ExpectedRequestBody,
  res: NextApiResponse<Data>
) => {
  const db = getDB();

  const hostname = body.hostname || "___unknown";

  const ref = doc(db, "kintone-plugin-users", hostname);
  // const summaryRef = doc(db, "kintone-plugin-users", "!summary");

  await runTransaction(db, async (transaction) => {
    const doc = await transaction.get(ref);

    if (!doc.exists()) {
      const date = body.installDate ? new Date(body.installDate) : new Date();

      await transaction.set(ref, {
        hostname,
        name: body.name || "",
        counter: body.counter || 1,
        pluginNames: body.pluginNames || [],
        installDate: date,
        lastModified: date,
      });
      return;
    }

    const data = doc.data();

    const pluginNames = body.pluginNames || [];
    const registered: string[] = data.pluginNames || [];

    const noChanges = pluginNames.every((plugin) =>
      registered.includes(plugin)
    );

    const base = {
      counter: increment(1),
      lastModified: new Date(),
    };

    if (noChanges) {
      await transaction.update(ref, base);
    } else {
      await transaction.update(ref, {
        pluginNames: [...new Set([...pluginNames, ...registered])],
        ...base,
      });
    }
  });
  res.status(200).json({ result: `データベースへ追加しました` });
};

const postToGAS = (body: ExpectedRequestBody) => {
  return fetch(GAS_END_POINT, {
    method: "POST",
    body: JSON.stringify({
      ...body,
      from: "ribbit-next-app",
    }),
  });
};
