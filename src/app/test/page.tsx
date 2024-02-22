"use client"

import { useEffect, useState } from 'react';

interface CryptoData {
  coins: any[];
}

export default function CryptoList() {
  const [data, setData] = useState<CryptoData>({ coins: [] });
  const [loading, setLoading] = useState<boolean>(true);

  const API_KEY = process.env.NEXT_PUBLIC_COINMARKETCAP_API_KEY;
  const API_URL = `/api/v1/cryptocurrency/category?start=1&limit=20&id=654a0c87ba37f269c8016129&CMC_PRO_API_KEY=${API_KEY}`

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_URL);
        const result = await response.json();
        setData(result.data);
        // console.log(result.data);
      } catch (error) {
        // console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {data.coins.map((crypto) => (
            <li key={crypto.id}>
              {crypto.name} - {crypto.quote.USD.price}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
