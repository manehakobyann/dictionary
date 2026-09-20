export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const { word, definition, example } = req.body || {};

    if (!word) {
        return res.status(400).json({
            error: "Word is required"
        });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "OPENAI_API_KEY is not configured"
        });
    }

    try {

        const prompt = `
You are Lingora, a multilingual AI dictionary.

Translate the following English dictionary information into natural, simple Armenian.

English word:
${word}

English definition:
${definition || "No definition available."}

English example:
${example || "No example available."}

Return ONLY valid JSON in this exact format:

{
  "armenian": "Armenian translation of the word",
  "armenianDefinition": "Simple Armenian definition",
  "armenianExample": "Natural Armenian example sentence"
}
`;

        const response = await fetch(
            "https://api.openai.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },

                body: JSON.stringify({
                    model: "gpt-5.6-luna",
                    input: prompt
                })
            }
        );

        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "OpenAI error:",
                errorText
            );

            return res.status(500).json({
                error: "AI translation failed"
            });
        }

        const data =
            await response.json();

        const output =
            data.output_text ||
            data.output
                ?.flatMap(item => item.content || [])
                ?.find(item => item.type === "output_text")
                ?.text;

        if (!output) {
            return res.status(500).json({
                error: "AI returned no translation"
            });
        }

        let translation;

        try {

            translation =
                JSON.parse(output);

        } catch {

            return res.status(500).json({
                error: "AI returned invalid JSON"
            });
        }

        return res.status(200).json(
            translation
        );

    } catch (error) {

        console.error(
            "Lingora translation error:",
            error
        );

        return res.status(500).json({
            error: "Translation service unavailable"
        });
    }
}
