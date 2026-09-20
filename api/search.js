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
           MAIN DICTIONARY RESULT
        ========================== */

        const definitionResponse = await fetch(
            `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dps&max=1`
        );

        const definitionData =
            await definitionResponse.json();

        if (!definitionData.length) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const item = definitionData[0];

        const definitions = item.defs || [];

        let partOfSpeech = "word";
        let definition = "Definition unavailable.";

        if (definitions.length) {

            const first = definitions[0];

            const pieces = first.split("\t");

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
            `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&md=dps&max=20`
        );

        const synonymData =
            await synonymResponse.json();


        /*
         * Keep synonyms that have the same
         * part of speech as the searched word.
         */

        const synonyms = synonymData
            .filter(item => {

                const tags =
                    item.tags || [];

                return tags.some(tag =>
                    tag === partOfSpeech
                );

            })
            .map(item => item.word)
            .filter(Boolean)
            .filter((value, index, array) =>
                array.indexOf(value) === index
            )
            .filter(value =>
                value.toLowerCase() !==
                word.toLowerCase()
            )
            .slice(0, 8);


        /* =========================
           ANTONYMS
        ========================== */

        const antonymResponse = await fetch(
            `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&md=dps&max=20`
        );

        const antonymData =
            await antonymResponse.json();


        const antonyms = antonymData
            .filter(item => {

                const tags =
                    item.tags || [];

                return tags.length === 0 ||
                    tags.some(tag =>
                        tag === partOfSpeech
                    );

            })
            .map(item => item.word)
            .filter(Boolean)
            .filter((value, index, array) =>
                array.indexOf(value) === index
            )
            .filter(value =>
                value.toLowerCase() !==
                word.toLowerCase()
            )
            .slice(0, 8);


        /* =========================
           FINAL RESULT
        ========================== */

        const result = [{
            word: word,

            phonetic:
                item.tags?.find(tag =>
                    tag.startsWith("pron:")
                )?.replace("pron:", "") || "",

            phonetics: [],

            meanings: [{
                partOfSpeech: partOfSpeech,

                definitions: [{
                    definition: definition,
                    example: ""
                }],

                synonyms: synonyms,

                antonyms: antonyms
            }],

            synonyms: synonyms,

            antonyms: antonyms
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
