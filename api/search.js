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
           DICTIONARY DATA
        ========================== */

        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );

        if (!response.ok) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const data = await response.json();

        const entry = data[0];

        const meaning =
            entry.meanings?.[0];

        const definition =
            meaning?.definitions?.[0];

        /* =========================
           EXAMPLE
        ========================== */

        let example = "";

        for (const meaningItem of entry.meanings || []) {

            for (const definitionItem of meaningItem.definitions || []) {

                if (definitionItem.example) {
                    example = definitionItem.example;
                    break;
                }
            }

            if (example) break;
        }


        /* =========================
           SYNONYMS
        ========================== */

        let synonyms = [];

        for (const meaningItem of entry.meanings || []) {

            for (const definitionItem of meaningItem.definitions || []) {

                if (definitionItem.synonyms) {

                    synonyms.push(
                        ...definitionItem.synonyms
                    );
                }
            }
        }


        /* =========================
           ANTONYMS
        ========================== */

        let antonyms = [];

        for (const meaningItem of entry.meanings || []) {

            for (const definitionItem of meaningItem.definitions || []) {

                if (definitionItem.antonyms) {

                    antonyms.push(
                        ...definitionItem.antonyms
                    );
                }
            }
        }


        /* =========================
           REMOVE DUPLICATES
        ========================== */

        synonyms = [
            ...new Set(
                synonyms
                    .filter(Boolean)
                    .filter(item =>
                        item.toLowerCase() !==
                        word.toLowerCase()
                    )
            )
        ];

        antonyms = [
            ...new Set(
                antonyms
                    .filter(Boolean)
                    .filter(item =>
                        item.toLowerCase() !==
                        word.toLowerCase()
                    )
            )
        ];


        /* =========================
           PHONETIC
        ========================== */

        const phonetic =
            entry.phonetic ||
            entry.phonetics?.find(
                item => item.text
            )?.text ||
            "";


        /* =========================
           RESULT
        ========================== */

        return res.status(200).json([{

            word:
                entry.word || word,

            phonetic:
                phonetic,

            phonetics:
                entry.phonetics || [],

            meanings: [{

                partOfSpeech:
                    meaning?.partOfSpeech ||
                    "word",

                definitions: [{

                    definition:
                        definition?.definition ||
                        "Definition unavailable.",

                    example:
                        example

                }],

                synonyms:
                    synonyms,

                antonyms:
                    antonyms

            }],

            synonyms:
                synonyms,

            antonyms:
                antonyms

        }]);

    } catch (error) {

        console.error(
            "Lingora dictionary error:",
            error
        );

        return res.status(500).json({
            error:
                "Dictionary service unavailable",

            details:
                error.message
        });
    }
}
