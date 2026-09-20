export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const word = req.query.word?.trim();

    if (!word) {
        return res.status(400).json({
            error: "Please provide a word"
        });
    }

    const controller = new AbortController();

    const timeout = setTimeout(() => {
        controller.abort();
    }, 8000);

    try {

        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
            {
                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        if (!response.ok) {

            if (response.status === 404) {
                return res.status(404).json({
                    error: "Word not found"
                });
            }

            return res.status(502).json({
                error: "Dictionary API error"
            });
        }

        const data = await response.json();

        if (!Array.isArray(data) || !data.length) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const entry = data[0];

        const meanings = entry.meanings || [];

        const meaning = meanings[0] || {};

        const definitions =
            meaning.definitions || [];

        const definition =
            definitions[0] || {};

        const phonetic =
            entry.phonetic ||
            entry.phonetics?.find(
                item => item.text
            )?.text ||
            "";

        const audio =
            entry.phonetics?.find(
                item => item.audio
            )?.audio ||
            "";

        const synonyms = [
            ...(definition.synonyms || []),
            ...(meaning.synonyms || [])
        ];

        const antonyms = [
            ...(definition.antonyms || []),
            ...(meaning.antonyms || [])
        ];

        const cleanSynonyms = [
            ...new Set(
                synonyms.filter(Boolean)
            )
        ].slice(0, 8);

        const cleanAntonyms = [
            ...new Set(
                antonyms.filter(Boolean)
            )
        ].slice(0, 8);

        return res.status(200).json([{

            word:
                entry.word || word,

            phonetic:
                phonetic,

            audio:
                audio,

            phonetics:
                entry.phonetics || [],

            meanings: [{

                partOfSpeech:
                    meaning.partOfSpeech ||
                    "word",

                definitions: [{

                    definition:
                        definition.definition ||
                        "Definition unavailable.",

                    example:
                        definition.example ||
                        ""

                }],

                synonyms:
                    cleanSynonyms,

                antonyms:
                    cleanAntonyms

            }],

            synonyms:
                cleanSynonyms,

            antonyms:
                cleanAntonyms

        }]);

    } catch (error) {

        clearTimeout(timeout);

        console.error(
            "Lingora dictionary error:",
            error
        );

        if (error.name === "AbortError") {
            return res.status(504).json({
                error: "Dictionary API timeout"
            });
        }

        return res.status(500).json({
            error: "Dictionary service unavailable"
        });
    }
}
