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
           MAIN DICTIONARY
        ========================== */

        const response = await fetch(
            `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dps&max=1`
        );

        const data = await response.json();

        if (!data.length) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const item = data[0];

        const definitions =
            item.defs || [];

        let partOfSpeech = "word";
        let definition = "Definition unavailable.";

        if (definitions.length) {

            const pieces =
                definitions[0].split("\t");

            partOfSpeech =
                pieces[0] || "word";

            definition =
                pieces.slice(1).join("\t") ||
                "Definition unavailable.";
        }


        /* =========================
           SYNONYMS
        ========================== */

        const synonymResponse = await fetch(
            `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=8`
        );

        const synonymData =
            await synonymResponse.json();

        const synonyms =
            synonymData
                .map(item => item.word)
                .filter(Boolean)
                .filter(item =>
                    item.toLowerCase() !==
                    word.toLowerCase()
                );


        /* =========================
           ANTONYMS
        ========================== */

        const antonymResponse = await fetch(
            `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=8`
        );

        const antonymData =
            await antonymResponse.json();

        const antonyms =
            antonymData
                .map(item => item.word)
                .filter(Boolean)
                .filter(item =>
                    item.toLowerCase() !==
                    word.toLowerCase()
                );


        /* =========================
           RESULT
        ========================== */

        return res.status(200).json([{

            word:
                item.word || word,

            phonetic:
                item.tags?.find(tag =>
                    tag.startsWith("pron:")
                )?.replace("pron:", "") || "",

            phonetics: [],

            meanings: [{

                partOfSpeech:
                    partOfSpeech,

                definitions: [{

                    definition:
                        definition,

                    example:
                        ""

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
                "Dictionary service unavailable"
        });
    }
}
