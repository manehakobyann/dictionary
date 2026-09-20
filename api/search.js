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
           WIKTIONARY
        ========================== */

        const response = await fetch(
            "https://en.wiktionary.org/api/rest_v1/page/definition/" +
            encodeURIComponent(word),
            {
                headers: {
                    "User-Agent":
                        "LingoraDictionary/1.0"
                }
            }
        );

        if (!response.ok) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const data =
            await response.json();


        /* =========================
           ENGLISH ENTRIES
        ========================== */

        const englishEntries =
            data.en || [];

        if (!englishEntries.length) {
            return res.status(404).json({
                error:
                    "No English definition found"
            });
        }


        /* =========================
           FIND USEFUL ENTRY
        ========================== */

        let selectedEntry =
            englishEntries[0];

        let selectedDefinition =
            selectedEntry.definitions?.[0];

        for (
            const entry of englishEntries
        ) {

            if (
                entry.definitions &&
                entry.definitions.length
            ) {

                selectedEntry =
                    entry;

                selectedDefinition =
                    entry.definitions[0];

                break;
            }
        }


        /* =========================
           DEFINITION
        ========================== */

        const definition =
            cleanText(
                selectedDefinition?.definition ||
                "Definition unavailable."
            );


        /* =========================
           EXAMPLE
        ========================== */

        let example = "";

        if (
            selectedDefinition?.examples &&
            selectedDefinition.examples.length
        ) {

            example =
                cleanText(
                    selectedDefinition.examples[0]
                );

        }


        /* =========================
           COLLECT ALL EXAMPLES
        ========================== */

        if (!example) {

            for (
                const entry of englishEntries
            ) {

                for (
                    const def
                    of entry.definitions || []
                ) {

                    if (
                        def.examples &&
                        def.examples.length
                    ) {

                        example =
                            cleanText(
                                def.examples[0]
                            );

                        break;
                    }

                }

                if (example) {
                    break;
                }
            }
        }


        /* =========================
           SYNONYMS
        ========================== */

        const synonyms =
            collectRelations(
                englishEntries,
                "synonyms"
            );


        /* =========================
           ANTONYMS
        ========================== */

        const antonyms =
            collectRelations(
                englishEntries,
                "antonyms"
            );


        /* =========================
           RESULT
        ========================== */

        return res.status(200).json([{

            word:
                word,

            phonetic:
                "",

            phonetics:
                [],

            meanings: [{

                partOfSpeech:
                    selectedEntry.partOfSpeech ||
                    "word",

                definitions: [{

                    definition:
                        definition,

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
            "Lingora search error:",
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


/* =========================
   CLEAN WIKTIONARY HTML
========================= */

function cleanText(text) {

    return String(text)

        .replace(
            /<[^>]*>/g,
            ""
        )

        .replace(
            /\[\[([^|\]]+)\|([^\]]+)\]\]/g,
            "$2"
        )

        .replace(
            /\[\[([^\]]+)\]\]/g,
            "$1"
        )

        .replace(
            /&nbsp;/g,
            " "
        )

        .replace(
            /&amp;/g,
            "&"
        )

        .replace(
            /&quot;/g,
            '"'
        )

        .replace(
            /&#39;/g,
            "'"
        )

        .trim();
}


/* =========================
   RELATIONS
========================= */

function collectRelations(
    entries,
    type
) {

    const results = [];

    for (
        const entry of entries
    ) {

        for (
            const definition
            of entry.definitions || []
        ) {

            const relations =
                definition[type];

            if (
                Array.isArray(relations)
            ) {

                for (
                    const relation
                    of relations
                ) {

                    let value = "";

                    if (
                        typeof relation ===
                        "string"
                    ) {

                        value =
                            cleanText(
                                relation
                            );

                    } else if (
                        relation?.word
                    ) {

                        value =
                            cleanText(
                                relation.word
                            );

                    } else if (
                        relation?.text
                    ) {

                        value =
                            cleanText(
                                relation.text
                            );
                    }

                    if (value) {
                        results.push(value);
                    }
                }
            }
        }
    }


    return [
        ...new Set(results)
    ].slice(0, 8);
}
