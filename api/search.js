export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const word = req.query.word?.trim().toLowerCase();

    if (!word) {
        return res.status(400).json({
            error: "Please provide a word"
        });
    }

    try {

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 5000);

        const response = await fetch(
            `https://api.suvankar.cc/dictionaryapi/v1/definitions/en/${encodeURIComponent(word)}`,
            {
                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        if (!response.ok) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const data = await response.json();

        /*
         * Convert the alternative API format
         * into the format Lingora already understands.
         */

        const meanings = (data.meanings || []).map(meaning => {

            return {
                partOfSpeech:
                    meaning.partOfSpeech || "unknown",

                definitions:
                    (meaning.definitions || []).map(definition => ({
                        definition:
                            typeof definition === "string"
                                ? definition
                                : definition.definition || "",

                        example:
                            typeof definition === "object"
                                ? definition.example || ""
                                : "",

                        synonyms:
                            typeof definition === "object"
                                ? definition.synonyms || []
                                : [],

                        antonyms:
                            typeof definition === "object"
                                ? definition.antonyms || []
                                : []
                    }))
            };

        });


        // Collect synonyms
        const synonyms = [];

        meanings.forEach(meaning => {
            meaning.definitions.forEach(definition => {
                if (definition.synonyms) {
                    synonyms.push(...definition.synonyms);
                }
            });
        });


        // Collect antonyms
        const antonyms = [];

        meanings.forEach(meaning => {
            meaning.definitions.forEach(definition => {
                if (definition.antonyms) {
                    antonyms.push(...definition.antonyms);
                }
            });
        });


        const result = [
            {
                word: data.word || word,

                phonetic:
                    data.ipa ||
                    data.phonetic ||
                    "",

                phonetics: [],

                meanings: meanings,

                synonyms: [...new Set(synonyms)],

                antonyms: [...new Set(antonyms)]
            }
        ];


        return res.status(200).json(result);


    } catch (error) {

        console.error(
            "Dictionary API error:",
            error
        );

        if (error.name === "AbortError") {

            return res.status(504).json({
                error: "Dictionary service timed out"
            });

        }

        return res.status(500).json({
            error: "Dictionary service unavailable"
        });

    }

}
