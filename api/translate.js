export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const {
        word,
        definition,
        example
    } = req.body || {};

    if (!word) {
        return res.status(400).json({
            error: "Word is required"
        });
    }

    const apiKey =
        process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({
            error: "OPENAI_API_KEY is not configured"
        });
    }

    try {

        const prompt = `
You are Lingora, a multilingual AI dictionary.

For the exact English word and meaning below, provide:

1. Armenian translation of the word
2. Simple Armenian definition
3. English example sentence
4. Armenian translation of the example
5. Five English synonyms for this exact meaning
6. Five English antonyms for this exact meaning

English word:
${word}

English definition:
${definition || "No definition available."}

English example:
${example || "No example available."}

Return ONLY valid JSON:

{
  "armenian": "...",
  "armenianDefinition": "...",
  "englishExample": "...",
  "armenianExample": "...",
  "synonyms": [],
  "antonyms": []
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

        const responseText =
            await response.text();

        if (!response.ok) {

            console.error(
                "OPENAI ERROR:",
                responseText
            );

            return res.status(500).json({
                error: "OpenAI request failed",
                details: responseText
            });
        }

        const data =
            JSON.parse(responseText);

        const output =
            data.output_text ||
            data.output
                ?.flatMap(item =>
                    item.content || []
                )
                ?.find(item =>
                    item.type === "output_text"
                )
                ?.text;

        if (!output) {

            return res.status(500).json({
                error: "OpenAI returned no text",
                details: JSON.stringify(data)
            });
        }

        let result;

        try {

            result =
                JSON.parse(output);

        } catch (error) {

            return res.status(500).json({
                error: "AI returned invalid JSON",
                details: output
            });
        }

        return res.status(200).json(result);

    } catch (error) {

        console.error(
            "LINGORA ERROR:",
            error
        );

        return res.status(500).json({
            error: "Translation service error",
            details: error.message
        });
    }
}
