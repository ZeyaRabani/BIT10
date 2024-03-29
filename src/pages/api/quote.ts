import qs from "qs";
import type { NextApiRequest, NextApiResponse } from "next";

type Data = {
  name: string;
};

const API_KEY = process.env.NEXT_PUBLIC_0X_API_KEY;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const query = qs.stringify(req.query);
  const response = await fetch(
    `https://polygon.api.0x.org/swap/v1/quote?${query}`,
    {
      // @ts-ignore
      headers: {
        "0x-api-key": API_KEY,
      },
    }
  );

  const data = await response.json();

  res.status(200).json(data);
}