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

        const response = await fetch(
            "https://en.wiktionary.org/api/rest_v1/page/definition/" +
            encodeURIComponent(word)
        );

        if (!response.ok) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const data = await response.json();

        const entries = [];

        /* =========================
           READ WIKTIONARY DATA
        ========================== */

        for (const language in data) {

            if (
                language.toLowerCase() !==
                "english"
            ) {
                continue;
            }

            const sections =
                data[language] || [];

            for (const section of sections) {

                const partOfSpeech =
                    section.partOfSpeech ||
                    "word";

                const definitions =
                    section.definitions || [];

                for (
                    const definitionItem
                    of definitions
                ) {

                    const definition =
                        typeof definitionItem === "string"
                            ? definitionItem
                            : definitionItem.definition;

                    if (!definition) {
                        continue;
                    }

                    entries.push({

                        partOfSpeech:
                            partOfSpeech,

                        definition:
                            cleanText(definition),

                        example:
                            extractExample(
                                definitionItem
                            ),

                        synonyms:
                            extractRelations(
                                definitionItem,
                                "synonyms"
                            ),

                        antonyms:
                            extractRelations(
                                definitionItem,
                                "antonyms"
                            )

                    });

                }

            }

        }


        /* =========================
           IF NOTHING FOUND
        ========================== */

        if (!entries.length) {

            return res.status(404).json({
                error:
                    "No English definition found"
            });

        }


        /* =========================
           USE FIRST GOOD ENTRY
        ========================== */

        const entry =
            entries[0];


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
                    entry.partOfSpeech,

                definitions: [{

                    definition:
                        entry.definition,

                    example:
                        entry.example

                }],

                synonyms:
                    entry.synonyms,

                antonyms:
                    entry.antonyms

            }],

            synonyms:
                entry.synonyms,

            antonyms:
                entry.antonyms

        }]);

    } catch (error) {

        console.error(
            "Wiktionary error:",
            error
        );

        return res.status(500).json({
            error:
                "Dictionary service unavailable"
        });
    }
}


/* =========================
   CLEAN TEXT
========================= */

function cleanText(text) {

    return String(text)
        .replace(/<[^>]*>/g, "")
        .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
        .replace(/\[\[([^\]]+)\]\]/g, "$1")
        .replace(/&nbsp;/g, " ")
        .trim();

}


/* =========================
   EXTRACT EXAMPLE
========================= */

function extractExample(item) {

    if (!item) {
        return "";
    }

    if (typeof item === "object") {

        if (item.example) {
            return cleanText(
                item.example
            );
        }

        if (item.examples?.length) {

            const first =
                item.examples[0];

            if (typeof first === "string") {
                return cleanText(first);
            }

            if (first?.text) {
                return cleanText(first.text);
            }

        }

    }

    return "";
}


/* =========================
   EXTRACT SYNONYMS /
   ANTONYMS
========================= */

function extractRelations(
    item,
    type
) {

    if (!item || typeof item !== "object") {
        return [];
    }

    const relations =
        item[type];

    if (!Array.isArray(relations)) {
        return [];
    }

    return relations
        .map(item => {

            if (typeof item === "string") {
                return cleanText(item);
            }

            if (item?.word) {
                return cleanText(item.word);
            }

            if (item?.text) {
                return cleanText(item.text);
            }

            return "";

        })
        .filter(Boolean)
        .slice(0, 8);
}
