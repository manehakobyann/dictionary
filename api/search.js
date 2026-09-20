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
           1. GET WIKTIONARY DATA
        ========================== */

        const response = await fetch(
            "https://en.wiktionary.org/api/rest_v1/page/definition/" +
            encodeURIComponent(word),
            {
                headers: {
                    "User-Agent": "LingoraDictionary/1.0"
                }
            }
        );

        if (!response.ok) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const data = await response.json();

        const englishEntries =
            data.en || [];

        if (!englishEntries.length) {
            return res.status(404).json({
                error: "No English definition found"
            });
        }


        /* =========================
           2. CHOOSE MEANING
           
           Prefer noun when available.
           Otherwise use the first
           available meaning.
        ========================== */

        let selectedEntry = null;
        let selectedDefinition = null;

        const preferredPartsOfSpeech = [
            "noun",
            "verb",
            "adjective",
            "adverb",
            "pronoun",
            "preposition",
            "conjunction",
            "interjection"
        ];

        for (
            const preferredPOS
            of preferredPartsOfSpeech
        ) {

            for (
                const entry
                of englishEntries
            ) {

                if (
                    entry.partOfSpeech?.toLowerCase() ===
                    preferredPOS &&
                    entry.definitions?.length
                ) {

                    selectedEntry =
                        entry;

                    selectedDefinition =
                        entry.definitions[0];

                    break;
                }
            }

            if (selectedEntry) {
                break;
            }
        }


        /* =========================
           FALLBACK
        ========================== */

        if (!selectedEntry) {

            selectedEntry =
                englishEntries.find(
                    entry =>
                        entry.definitions?.length
                );

            selectedDefinition =
                selectedEntry?.definitions?.[0];

        }


        if (!selectedDefinition) {
            return res.status(404).json({
                error:
                    "Definition unavailable"
            });
        }


        /* =========================
           3. DEFINITION
        ========================== */

        const definition =
            cleanText(
                selectedDefinition.definition ||
                "Definition unavailable."
            );


        /* =========================
           4. EXAMPLE
        ========================== */

        let example = "";

        if (
            selectedDefinition.examples?.length
        ) {

            example =
                cleanText(
                    selectedDefinition.examples[0]
                );

        }


        /* =========================
           5. SYNONYMS
        ========================== */

        const synonyms =
            collectRelations(
                englishEntries,
                "synonyms"
            );


        /* =========================
           6. ANTONYMS
        ========================== */

        const antonyms =
            collectRelations(
                englishEntries,
                "antonyms"
            );


        /* =========================
           7. PRONUNCIATION
           
           Wiktionary wikitext
        ========================== */

        let phonetic = "";

        try {

            const pronunciationResponse =
                await fetch(
                    "https://en.wiktionary.org/w/api.php" +
                    "?action=parse" +
                    "&page=" +
                    encodeURIComponent(word) +
                    "&prop=wikitext" +
                    "&format=json" +
                    "&origin=*",
                    {
                        headers: {
                            "User-Agent":
                                "LingoraDictionary/1.0"
                        }
                    }
                );

            if (
                pronunciationResponse.ok
            ) {

                const pronunciationData =
                    await pronunciationResponse.json();

                const wikitext =
                    pronunciationData
                        ?.parse
                        ?.wikitext
                        ?.["*"] || "";


                /* IPA template */

                const ipaMatch =
                    wikitext.match(
                        /\{\{IPA\|(?:en\|)?([^|}\n]+)/i
                    );

                if (ipaMatch) {

                    phonetic =
                        ipaMatch[1]
                            .trim();

                }


                /* IPA symbols directly */

                if (!phonetic) {

                    const directIPA =
                        wikitext.match(
                            /\/[^\/\n]{2,40}\//
                        );

                    if (directIPA) {

                        phonetic =
                            directIPA[0];

                    }
                }

            }

        } catch (
            pronunciationError
        ) {

            console.error(
                "Pronunciation error:",
                pronunciationError
            );

        }


        /* =========================
           8. RESULT
        ========================== */

        return res.status(200).json([{

            word:
                word,

            phonetic:
                phonetic,

            phonetics: [],

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
   CLEAN TEXT
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
   COLLECT SYNONYMS /
   ANTONYMS
========================= */

function collectRelations(
    entries,
    type
) {

    const results = [];

    for (
        const entry
        of entries
    ) {

        for (
            const definition
            of entry.definitions || []
        ) {

            const relations =
                definition[type];

            if (
                !Array.isArray(relations)
            ) {
                continue;
            }

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

    return [
        ...new Set(results)
    ].slice(0, 8);
}
