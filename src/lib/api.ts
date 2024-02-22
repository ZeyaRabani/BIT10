import axios from 'axios';

const apiKey = 'YOUR_COINMARKETCAP_API_KEY';
const apiUrl = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest';

const headers = {
  'Content-Type': 'application/json',
  'X-CMC_PRO_API_KEY': apiKey,
};

export const getTopBRC20Tokens = async () => {
  try {
    const response = await axios.get(apiUrl, {
      params: {
        start: 1,
        limit: 10, // Adjust limit as needed
        convert: 'USD',
      },
      headers,
    });

    // Assuming BRC-20 tokens are identified based on some criteria (you may need to adjust this filter)
    const brc20Tokens = response.data.data.filter((token: any) => {
      // Replace 'YOUR_CRITERIA' with the criteria for identifying BRC-20 tokens
      return token.name.includes('BRC-20') || token.symbol.includes('BRC-20');
    });

    return brc20Tokens;
  } catch (error) {
    // console.error('Error fetching top BRC-20 tokens:', error);
    throw error;
  }
};
