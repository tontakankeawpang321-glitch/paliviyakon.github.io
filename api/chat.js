export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API Key Missing' });
  }

  try {
    // 🔥 จุดสำคัญ: ต้อง parse เอง
    const body = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", chunk => data += chunk);
      req.on("end", () => resolve(JSON.parse(data)));
      req.on("error", reject);
    });

    const { message, history } = body;

    const contents = history ?? [
      {
        role: "user",
        parts: [{ text: message }]
      }
    ];

    const GEMINI_URL =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json(data);
    }

    const aiReply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    res.status(200).json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
