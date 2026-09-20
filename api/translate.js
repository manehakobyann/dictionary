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

                    input: `
You are Lingora, an AI multilingual dictionary.

Analyze the English word according to the EXACT meaning provided.

English word:
${word}

English definition:
${definition || "No definition available."}

English example:
${example || "No example available."}

Create a dictionary entry for this exact meaning.

Return:
- natural Armenian translation of the word
- simple Armenian definition
- natural English example sentence
- natural Armenian translation of the example
- 5 relevant English synonyms for THIS EXACT meaning
- 5 relevant English antonyms for THIS EXACT meaning

Do not include unrelated meanings of the word.
Do not include words that are only loosely associated with the word.
If a true antonym does not exist, return an empty array.
`,

                    text: {
                        format: {
                            type: "json_schema",

                            name: "lingora_dictionary",

                            strict: true,

                            schema: {
                                type: "object",

                                properties: {

                                    armenian: {
                                        type: "string"
                                    },

                                    armenianDefinition: {
                                        type: "string"
                                    },

                                    englishExample: {
                                        type: "string"
                                    },

                                    armenianExample: {
                                        type: "string"
                                    },

                                    synonyms: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    },

                                    antonyms: {
                                        type: "array",
                                        items: {
                                            type: "string"
                                        }
                                    }

                                },

                                required: [
                                    "armenian",
                                    "armenianDefinition",
                                    "englishExample",
                                    "armenianExample",
                                    "synonyms",
                                    "antonyms"
                                ],

                                additionalProperties: false
                            }
                        }
                    }

                })
            }
        );


        if (!response.ok) {

            const errorText =
                await response.text();

            console.error(
                "OpenAI API error:",
                errorText
            );

            return res.status(500).json({
                error: "AI translation failed"
            });
        }


        const data =
            await response.json();


        const output =
            data.output_text;


        if (!output) {

            console.error(
                "No output from OpenAI:",
                data
            );

            return res.status(500).json({
                error: "AI returned no translation"
            });
        }


        const result =
            JSON.parse(output);


        return res.status(200).json(result);


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
