import { child, get, ref, set, update } from 'firebase/database';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { rtdb } from '../firebase/rdtb';

type Data = {
  result: string;
  counter?: number;
  numUsers?: number;
};

type ExpectedRequestBody = Partial<{
  domain: string;
  pluginNames: string[];
}>;

export type ExpectedFirestoreData = {
  name: string;
  installDate: Timestamp;
  lastModified: Timestamp;
  hostname: string;
  pluginNames: string[];
  counter: number;
};

export const transportRtdb = async (data: ExpectedFirestoreData[]) => {
  for (const record of data) {
    const hostname = record.hostname || '___unknown';

    const installDate = record.installDate ? record.installDate.toDate() : new Date();

    const lastModified = record.lastModified ? record.lastModified.toDate() : new Date();

    const formattedRecord = {
      hostname,
      installDate: installDate.toLocaleString('ja-JP'),
      lastModified: lastModified.toLocaleString('ja-JP'),
      name: record.name || '',
      pluginNames: record.pluginNames || [],
      counter: record.counter || 1,
    };

    const formattedHostname = hostname
      .replace('.cybozu.com', '')
      .replace('.kintone.com', '')
      .replace(/\./g, '_dot_');

    const snapshot = await get(child(ref(rtdb), `kintone/users/${formattedHostname}`));

    const reference = ref(rtdb, `kintone/users/${formattedHostname}`);

    if (!snapshot.exists()) {
      await set(reference, formattedRecord);
    } else {
      await update(reference, formattedRecord);
    }
  }
};
