import axios from "axios";

// console.log("✅ PAYPAL_BASE_URL:", process.env.PAYPAL_BASE_URL);
console.log("✅ CLIENT_ID EXISTS:", !!process.env.PAYPAL_CLIENT_ID);


const PAYPAL_BASE_URL = 'https://api-m.sandbox.paypal.com';

export async function getPayPalAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const { data } = await axios.post(
    `${PAYPAL_BASE_URL}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  return data.access_token;
}

export async function paypalRequest(method, url, body) {
  const token = await getPayPalAccessToken();

  const res = await axios({
    method,
    url: `${PAYPAL_BASE_URL}${url}`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    data: body,
  });

  return res.data;
}