import mercadopago from "mercadopago";

// Pequeno helper de CORS (libera POST a partir do seu site)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // depois, troque * pelo seu domínio se quiser
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Serverless Function (Vercel): POST /api/checkout
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.set(corsHeaders).status(200).end();
  }
  if (req.method !== "POST") {
    return res.set(corsHeaders).status(405).json({ error: "Método não permitido" });
  }

  try {
    // Access Token vem da Vercel (Environment Variable)
    mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN });

    const { title = "Pedido Loja", unit_price = 0, order_id } = req.body;

    const preference = {
      items: [
        { title, quantity: 1, currency_id: "BRL", unit_price: Number(unit_price) }
      ],
      back_urls: {
        success: "https://sualoja.com/obrigado?status=success",
        pending: "https://sualoja.com/obrigado?status=pending",
        failure: "https://sualoja.com/obrigado?status=failure"
      },
      auto_return: "approved",

      // Tracking do Meta Pixel (seu ID fixo)
      tracks: [
        { type: "facebook_ad", values: { pixel_id: "282576792749107" } }
      ],

      external_reference: order_id ? String(order_id) : undefined
    };

    const { body } = await mercadopago.preferences.create(preference);
    return res.set(corsHeaders).status(200).json({ init_point: body.init_point, id: body.id });
  } catch (err) {
    console.error("Erro na criação da preference:", err?.message || err);
    return res.set(corsHeaders).status(500).json({ error: "Falha ao criar preferência" });
  }
}
