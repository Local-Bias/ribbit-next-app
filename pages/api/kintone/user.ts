import { child, get, getDatabase, ref, set, update } from "firebase/database";
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

      let causedError = false;
      try {
        await updateFirestore(body);
      } catch (error) {
        console.error("firestore更新時にエラーが発生しました", error);
        causedError = true;
      }
      try {
        await updateRtdb(body);
      } catch (error) {
        console.error("realtime database更新時にエラーが発生しました", error);
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
    res
      .status(500)
      .json({ result: `予期せぬエラーが発生しました。${JSON.stringify(e)}` });
    throw "API実行時にエラーが発生しました";
  }
};

const updateFirestore = async (body: ExpectedRequestBody) => {
  const db = getDB();

  const hostname = body.hostname || "___unknown";

  const ref = doc(db, "kintone-plugin-users", hostname);
  // const summaryRef = doc(db, "kintone-plugin-users", "!summary");

  await runTransaction(db, async (transaction) => {
    const doc = await transaction.get(ref);

    if (!doc.exists()) {
      await transaction.set(ref, getNewProps(hostname, body));
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
};

const updateRtdb = async (body: ExpectedRequestBody) => {
  const db = getDatabase();

  const hostname = body.hostname || "___unknown";

  let formattedHostname = hostname.replace(".cybozu.com", "");

  formattedHostname = formattedHostname.replace(".kintone.com", "");
  formattedHostname = formattedHostname.replaceAll(".", "_dot_");

  const snapshot = await get(
    child(ref(db), `kintone/users/${formattedHostname}`)
  );

  const reference = ref(db, `kintone/users/${formattedHostname}`);

  if (!snapshot.exists()) {
    await set(reference, getNewProps(hostname, body, { rtdb: true }));
  } else {
    const data = snapshot.val();
    const counter = data?.counter || 0;

    const pluginNames = body.pluginNames || [];
    const registered: string[] = data.pluginNames || [];

    const noChanges = pluginNames.every((plugin) =>
      registered.includes(plugin)
    );

    const base = {
      counter: counter + 1,
      lastModified: new Date().toLocaleString(),
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
  return fetch(GAS_END_POINT, {
    method: "POST",
    body: JSON.stringify({
      ...body,
      from: "ribbit-next-app",
    }),
  });
};

const getNewProps = (
  hostname: string,
  body: ExpectedRequestBody,
  options?: { rtdb?: boolean }
) => {
  const date = body.installDate ? new Date(body.installDate) : new Date();

  return {
    hostname,
    name: body.name || "",
    counter: body.counter || 1,
    pluginNames: body.pluginNames || [],
    installDate: options?.rtdb ? date.toLocaleString() : date,
    lastModified: options?.rtdb ? date.toLocaleString() : date,
  };
};
