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

    try {

        /* =========================
           FREE DICTIONARY API
        ========================== */

        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );

        if (!response.ok) {

            if (response.status === 404) {
                return res.status(404).json({
                    error: "Word not found"
                });
            }

            return res.status(500).json({
                error: "Dictionary service unavailable"
            });
        }

        const data = await response.json();

        if (!data || !data.length) {
            return res.status(404).json({
                error: "Word not found"
            });
        }


        /* =========================
           MAIN ENTRY
        ========================== */

        const entry = data[0];

        const meanings =
            entry.meanings || [];

        if (!meanings.length) {
            return res.status(404).json({
                error: "No definitions available"
            });
        }


        /* =========================
           USE FIRST MEANING
        ========================== */

        const meaning =
            meanings[0];

        const definitions =
            meaning.definitions || [];

        const firstDefinition =
            definitions[0] || {};


        /* =========================
           PRONUNCIATION
        ========================== */

        const phonetic =
            entry.phonetic ||
            entry.phonetics
                ?.find(item => item.text)
                ?.text ||
            "";


        /* =========================
           AUDIO
        ========================== */

        const audio =
            entry.phonetics
                ?.find(item => item.audio)
                ?.audio ||
            "";


        /* =========================
           SYNONYMS
        ========================== */

        const synonyms =
            firstDefinition.synonyms ||
            meaning.synonyms ||
            [];

        const cleanSynonyms =
            [...new Set(
                synonyms
                    .filter(Boolean)
                    .filter(item =>
                        item.toLowerCase() !==
                        word.toLowerCase()
                    )
            )].slice(0, 8);


        /* =========================
           ANTONYMS
        ========================== */

        const antonyms =
            firstDefinition.antonyms ||
            meaning.antonyms ||
            [];

        const cleanAntonyms =
            [...new Set(
                antonyms
                    .filter(Boolean)
                    .filter(item =>
                        item.toLowerCase() !==
                        word.toLowerCase()
                    )
            )].slice(0, 8);


        /* =========================
           EXAMPLE
        ========================== */

        const example =
            firstDefinition.example ||
            "";


        /* =========================
           FINAL RESPONSE
        ========================== */

        const result = [{
            word:
                entry.word || word,

            phonetic:
                phonetic,

            phonetics:
                entry.phonetics || [],

            audio:
                audio,

            meanings: [{
                partOfSpeech:
                    meaning.partOfSpeech ||
                    "word",

                definitions: [{
                    definition:
                        firstDefinition.definition ||
                        "Definition unavailable.",

                    example:
                        example
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
        }];


        return res.status(200).json(result);


    } catch (error) {

        console.error(
            "Lingora dictionary error:",
            error
        );

        return res.status(500).json({
            error: "Dictionary service unavailable"
        });
    }
}
