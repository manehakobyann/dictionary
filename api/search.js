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
           GET STRUCTURED ENTRY
        ========================= */

        const entryResponse = await fetch(
            `https://api.wiktapi.dev/v1/en/word/${encodeURIComponent(word)}?lang=en`
        );

        if (!entryResponse.ok) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const entryData =
            await entryResponse.json();


        /* =========================
           GET ALL ENGLISH ENTRIES
        ========================= */

        const entries =
            Array.isArray(entryData.entries)
                ? entryData.entries
                : [];


        /*
         * IMPORTANT:
         * Do NOT use entries[0].
         *
         * Find the requested grammatical
         * entry explicitly.
         */

        const preferredOrder = [
            "noun",
            "verb",
            "adjective",
            "adverb",
            "pronoun",
            "preposition",
            "conjunction",
            "interjection"
        ];


        let selectedEntry = null;

        for (const pos of preferredOrder) {

            selectedEntry =
                entries.find(
                    entry =>
                        String(entry.pos)
                            .toLowerCase() === pos
                );

            if (selectedEntry) {
                break;
            }
        }


        /*
         * Fallback
         */

        if (!selectedEntry) {
            selectedEntry = entries[0];
        }


        if (!selectedEntry) {
            return res.status(404).json({
                error: "No dictionary entry found"
            });
        }


        const partOfSpeech =
            formatPartOfSpeech(
                selectedEntry.pos
            );


        /* =========================
           GET DEFINITIONS
        ========================= */

        const definitionsResponse =
            await fetch(
                `https://api.wiktapi.dev/v1/en/word/${encodeURIComponent(word)}/definitions?lang=en`
            );


        let definitionsData = null;

        if (definitionsResponse.ok) {

            definitionsData =
                await definitionsResponse.json();

        }


        /*
         * Find definitions belonging
         * to the selected POS.
         */

        let senses =
            selectedEntry.senses || [];


        /*
         * Some API versions return
         * definitions separately.
         */

        if (
            definitionsData &&
            Array.isArray(
                definitionsData.entries
            )
        ) {

            const definitionEntry =
                definitionsData.entries.find(
                    entry =>
                        String(entry.pos)
                            .toLowerCase() ===
                        String(selectedEntry.pos)
                            .toLowerCase()
                );

            if (
                definitionEntry &&
                Array.isArray(
                    definitionEntry.senses
                )
            ) {

                senses =
                    definitionEntry.senses;
            }
        }


        /* =========================
           FIRST SENSE
        ========================= */

        const sense =
            senses.find(
                item =>
                    item.glosses &&
                    item.glosses.length
            ) || senses[0] || {};


        const definition =
            sense.glosses?.[0] ||
            "Definition unavailable.";


        /* =========================
           EXAMPLE
        ========================= */

        let example = "";

        if (
            Array.isArray(
                sense.examples
            ) &&
            sense.examples.length
        ) {

            const item =
                sense.examples[0];

            if (
                typeof item === "string"
            ) {

                example = item;

            } else {

                example =
                    item.text ||
                    item.example ||
                    "";

            }
        }


        /* =========================
           SYNONYMS
        ========================= */

        const synonyms =
            extractWords(
                sense.synonyms
            );


        /* =========================
           ANTONYMS
        ========================= */

        const antonyms =
            extractWords(
                sense.antonyms
            );


        /* =========================
           PRONUNCIATION
        ========================= */

        let phonetic = "";

        if (
            Array.isArray(
                selectedEntry.sounds
            )
        ) {

            const sound =
                selectedEntry.sounds.find(
                    item => item.ipa
                );

            if (sound) {
                phonetic =
                    sound.ipa;
            }
        }


        /* =========================
           RESULT
        ========================= */

        return res.status(200).json({

            word:
                selectedEntry.word ||
                word,

            phonetic:
                phonetic,

            phonetics: [],

            meanings: [{

                partOfSpeech:
                    partOfSpeech,

                definitions: [{

                    definition:
                        definition,

                    example:
                        example,

                    synonyms:
                        synonyms,

                    antonyms:
                        antonyms

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

        });

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


/* =========================
   FORMAT POS
========================= */

function formatPartOfSpeech(pos) {

    const names = {

        noun: "Noun",
        verb: "Verb",
        adjective: "Adjective",
        adverb: "Adverb",
        pronoun: "Pronoun",
        preposition: "Preposition",
        conjunction: "Conjunction",
        interjection: "Interjection",
        determiner: "Determiner",
        particle: "Particle",
        numeral: "Numeral"

    };

    const value =
        String(pos || "")
            .toLowerCase();

    return names[value] ||
        pos ||
        "Word";
}


/* =========================
   EXTRACT WORDS
========================= */

function extractWords(items) {

    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map(item => {

            if (
                typeof item === "string"
            ) {
                return item;
            }

            return (
                item.word ||
                item.term ||
                item.text ||
                ""
            );
        })
        .filter(Boolean)
        .slice(0, 8);
}
