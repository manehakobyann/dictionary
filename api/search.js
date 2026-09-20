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
           GET MAIN WORD
        ========================== */

        const mainResponse = await fetch(
            `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dps&max=1`
        );

        const mainData =
            await mainResponse.json();

        if (!mainData.length) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const mainWord =
            mainData[0];

        const definitions =
            mainWord.defs || [];

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
           GET SYNONYMS
        ========================== */

        const synonymResponse = await fetch(
            `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&md=dps&max=20`
        );

        const synonymData =
            await synonymResponse.json();


        /*
         * Only keep synonyms that:
         * 1. Are not the original word
         * 2. Match the same part of speech
         */

        const synonyms = synonymData
            .filter(item => {

                if (
                    item.word.toLowerCase() ===
                    word.toLowerCase()
                ) {
                    return false;
                }

                const tags =
                    item.tags || [];

                /*
                 * If Datamuse gives POS information,
                 * require the same POS.
                 */

                if (tags.length) {

                    return tags.some(tag =>
                        tag === partOfSpeech
                    );
                }

                return true;

            })
            .map(item => item.word)
            .filter(Boolean)
            .filter((value, index, array) =>
                array.indexOf(value) === index
            )
            .slice(0, 8);


        /* =========================
           GET ANTONYMS
        ========================== */

        const antonymResponse = await fetch(
            `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=10`
        );

        const antonymData =
            await antonymResponse.json();

        const antonyms = antonymData
            .map(item => item.word)
            .filter(Boolean)
            .filter(item =>
                item.toLowerCase() !==
                word.toLowerCase()
            )
            .filter((value, index, array) =>
                array.indexOf(value) === index
            )
            .slice(0, 8);


        /* =========================
           FINAL RESULT
        ========================== */

        return res.status(200).json([{

            word: word,

            phonetic:
                mainWord.tags?.find(tag =>
                    tag.startsWith("pron:")
                )?.replace("pron:", "") || "",

            phonetics: [],

            meanings: [{

                partOfSpeech:
                    partOfSpeech,

                definitions: [{

                    definition:
                        definition,

                    example: ""

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
