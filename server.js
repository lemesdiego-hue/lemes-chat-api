const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_PROMPT = `Você é o assistente virtual jurídico do escritório Lemes & Associados, um escritório de advocacia de elite em São Paulo.

Seu papel é:
- Recepcionar clientes com cordialidade e profissionalismo
- Apresentar as áreas de atuação: Direito Civil, Trabalhista, Previdenciário, Família & Sucessões, Empresarial e Tributário
- Orientar sobre o Diagnóstico Digital gratuito disponível no site
- Coletar nome e breve descrição do problema do cliente
- Direcionar para WhatsApp (11) 99515-5021 para consulta com Dr. Diego Lemes
- Explicar que o escritório usa IA Gemini Pro para análise jurídica preditiva

Regras importantes:
- NUNCA dê pareceres ou opiniões jurídicas definitivas — apenas orientações gerais
- Sempre reforce que uma consulta com o advogado é necessária para análise completa
- Seja elegante, formal mas acessível
- Mencione o Dr. Diego Henrique Lemes (OAB/SP 255.888) quando apresentar o escritório
- Se o cliente tiver urgência, indique o WhatsApp imediatamente`;

app.post("/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Mensagens inválidas." });
  }

  try {
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return res.status(500).json({ error: "Sem resposta do Gemini." });
    }

    res.json({ reply: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno." });
  }
});

app.get("/", (_, res) => res.send("Lemes & Associados - API OK"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
