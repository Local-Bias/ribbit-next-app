import { NextApiResponse } from "next";

export type KintoneData = {
  name: string;
};

export type KintoneApiResponse = NextApiResponse<KintoneData>;
