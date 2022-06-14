type ImportOptions = Readonly<
  Partial<{
    removesLastRow: "disable" | "anyway" | "empty";
  }>
>;
type FileOptions = Readonly<Partial<{ lineCode: "lf" | "cr" | "crlf" }>>;

type DownloadOptions = Readonly<
  Partial<{
    wrapsDoubleQuotes: boolean;
  }>
>;

type JSONOptions<T> = Readonly<Partial<{ validator: (row: T) => boolean }>>;

export class CSV {
  private _arrays: string[][];

  public static async fromFile(
    file: File,
    options: ImportOptions & FileOptions = {}
  ) {
    return new CSV(await getAsArray(file), options);
  }

  public static fromArrays(
    arrays: (string | number)[][],
    options: ImportOptions = {}
  ) {
    return new CSV(arrays, options);
  }

  private constructor(arrays: (string | number)[][], options: ImportOptions) {
    const newArrays = arrays.map((row) => row.map((cell) => String(cell)));

    switch (options.removesLastRow) {
      case "empty":
        const enables = newArrays[newArrays.length - 1].every((cell) => !cell);
        if (enables) {
          newArrays.splice(newArrays.length - 1, 1);
        }
        break;

      case "anyway":
        newArrays.splice(newArrays.length - 1, 1);
        break;
      default:
    }

    this._arrays = newArrays;
  }

  /**
   * ヘッダー行をもとに、CSVをJSON形式で返却します
   *
   * @returns ジェネリクス型のオブジェクト
   */
  public toJSON<T>(props?: JSONOptions<T>): T[] {
    const [header, ...rows] = this._arrays;

    const records = rows.map((row) =>
      row.reduce<T>(
        (acc, value, i) => ({ ...acc, [header[i]]: value }),
        {} as T
      )
    );

    if (props?.validator) {
      const { validator } = props;
      if (records.some((record) => !validator(record))) {
        throw new Error("CSVファイルの形式が不正です");
      }
    }

    return records;
  }

  public toArrays() {
    return this._arrays;
  }

  public download(name: string, options?: DownloadOptions) {
    const { wrapsDoubleQuotes = false } = options || {};

    const data = wrapsDoubleQuotes
      ? `"${this._arrays.map((row) => row.join('","')).join('"\r\n"')}"`
      : this._arrays.map((row) => row.join(",")).join("\r\n");

    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, data], { type: "text/csv" });
    const url = (window.URL || window.webkitURL).createObjectURL(blob);

    const link = document.createElement("a");
    link.download = name + ".csv";
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  }
}

const getAsString = async (file: File) => {
  const event = await onFileLoad(file);
  return event.target?.result as string | undefined;
};

const getAsArray = async (file: File) => {
  const str = await getAsString(file);

  if (typeof str !== "string") {
    throw new Error("ファイルを配列に変換できませんでした");
  }

  const split = str.match(/\r\n/) ? str.split(/\r\n/) : str.split(/\r?\n/);

  return split.map((row) => {
    const wrapsQuat =
      row.indexOf('"') === 0 && row.lastIndexOf('"') === row.length - 1;

    if (wrapsQuat) {
      return row.substring(1, row.length - 1).split('","');
    }
    return row.split(",");
  });
};

/**
 * 指定されたエンコーディング名に応じたエンコーディングを行って、
 * ファイルから取得したテキストデータを返却します
 * エンコーディング名を指定しなかった場合は、Shift-JISでエンコードされます
 *
 * utf-8でエンコードする場合は、より新しいAPIであるBlob.text()を使用できます
 * https://developer.mozilla.org/ja/docs/Web/API/Blob/text
 * @param file 読み込むファイル
 * @param encoding 使用するエンコーディング名
 */
export const onFileLoad = (file: File | Blob, encoding = "Shift_JIS") => {
  return new Promise<ProgressEvent<FileReader>>((resolve, reject) => {
    try {
      const reader = new FileReader();

      reader.readAsText(file, "utf-8");

      reader.onload = (event) => resolve(event);
      reader.onerror = (event) => reject(event);
    } catch (error) {
      reject(error);
    }
  });
};
