// Crypto Payment Gateway integrations
// Supported: CoinGate, NOWPayments, Coinbase Commerce, Manual (wallet address)

interface CryptoPaymentResult {
  success: boolean;
  payment_url?: string;
  payment_id?: string;
  wallet_address?: string;
  amount_crypto?: string;
  currency?: string;
  message?: string;
}

// ===== COINGATE =====
export async function createCoinGatePayment(orderId: string, amount: number, currency: string = 'USD'): Promise<CryptoPaymentResult> {
  const apiKey = process.env.COINGATE_API_KEY;
  if (!apiKey) return { success: false, message: 'CoinGate not configured' };

  const baseUrl = process.env.COINGATE_SANDBOX === 'true'
    ? 'https://api-sandbox.coingate.com/v2'
    : 'https://api.coingate.com/v2';

  try {
    const res = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        price_amount: amount,
        price_currency: currency,
        receive_currency: 'DO_NOT_CONVERT',
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/coingate`,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/deposit?status=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/deposit?status=cancelled`,
      }),
    });

    const data = await res.json();

    if (data.id) {
      return {
        success: true,
        payment_url: data.payment_url,
        payment_id: String(data.id),
      };
    }
    return { success: false, message: data.message || 'CoinGate error' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ===== NOWPAYMENTS =====
export async function createNOWPayment(orderId: string, amount: number, payCurrency: string = 'btc'): Promise<CryptoPaymentResult> {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!apiKey) return { success: false, message: 'NOWPayments not configured' };

  try {
    const res = await fetch('https://api.nowpayments.io/v1/payment', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: 'usd',
        pay_currency: payCurrency,
        order_id: orderId,
        ipn_callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/nowpayments`,
      }),
    });

    const data = await res.json();

    if (data.payment_id) {
      return {
        success: true,
        payment_id: String(data.payment_id),
        wallet_address: data.pay_address,
        amount_crypto: String(data.pay_amount),
        currency: data.pay_currency,
      };
    }
    return { success: false, message: data.message || 'NOWPayments error' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ===== COINBASE COMMERCE =====
export async function createCoinbasePayment(orderId: string, amount: number, description: string = 'Deposit'): Promise<CryptoPaymentResult> {
  const apiKey = process.env.COINBASE_COMMERCE_API_KEY;
  if (!apiKey) return { success: false, message: 'Coinbase Commerce not configured' };

  try {
    const res = await fetch('https://api.commerce.coinbase.com/charges', {
      method: 'POST',
      headers: {
        'X-CC-Api-Key': apiKey,
        'X-CC-Version': '2018-03-22',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Deposit',
        description,
        pricing_type: 'fixed_price',
        local_price: { amount: String(amount), currency: 'USD' },
        metadata: { order_id: orderId },
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/deposit?status=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/deposit?status=cancelled`,
      }),
    });

    const data = await res.json();

    if (data.data?.hosted_url) {
      return {
        success: true,
        payment_url: data.data.hosted_url,
        payment_id: data.data.id,
      };
    }
    return { success: false, message: 'Coinbase Commerce error' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ===== MANUAL CRYPTO (show wallet address) =====
export function getManualCryptoAddress(currency: string): CryptoPaymentResult {
  const addresses: Record<string, string> = {
    btc: process.env.CRYPTO_BTC_ADDRESS || '',
    eth: process.env.CRYPTO_ETH_ADDRESS || '',
    usdt_trc20: process.env.CRYPTO_USDT_TRC20_ADDRESS || '',
    usdt_erc20: process.env.CRYPTO_USDT_ERC20_ADDRESS || '',
    bnb: process.env.CRYPTO_BNB_ADDRESS || '',
    ltc: process.env.CRYPTO_LTC_ADDRESS || '',
  };

  const address = addresses[currency.toLowerCase()];
  if (!address) return { success: false, message: 'Unsupported currency' };

  return {
    success: true,
    wallet_address: address,
    currency: currency.toUpperCase(),
  };
}
