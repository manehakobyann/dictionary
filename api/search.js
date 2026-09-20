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
            `https://api.wiktapi.dev/v1/en/word/${encodeURIComponent(word)}?lang=en`
        );

        if (!response.ok) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const data = await response.json();

        if (!data.entries || !data.entries.length) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        /*
         * Find the English entry.
         */

        const entry =
            data.entries.find(
                item =>
                    item.lang_code === "en"
            ) || data.entries[0];


        /*
         * Prefer the first noun/verb/etc.
         * entry that actually contains senses.
         */

        const senseEntry =
            data.entries.find(
                item =>
                    item.lang_code === "en" &&
                    item.senses?.length
            ) || entry;


        const firstSense =
            senseEntry.senses?.[0] || {};


        const definition =
            firstSense.glosses?.[0] ||
            "Definition unavailable.";


        /*
         * EXAMPLE
         */

        let example = "";

        if (
            firstSense.examples &&
            firstSense.examples.length
        ) {

            const firstExample =
                firstSense.examples[0];

            if (typeof firstExample === "string") {
                example = firstExample;
            } else {
                example =
                    firstExample.text ||
                    firstExample.example ||
                    "";
            }
        }


        /*
         * PRONUNCIATION
         */

        let phonetic = "";

        const sound =
            senseEntry.sounds?.find(
                item => item.ipa
            );

        if (sound) {
            phonetic = sound.ipa;
        }


        /*
         * PART OF SPEECH
         */

        const pos =
            formatPartOfSpeech(
                senseEntry.pos
            );


        /*
         * SYNONYMS / ANTONYMS
         *
         * WiktAPI's structured sense data
         * may contain these as links.
         */

        const synonyms =
            extractLinks(
                firstSense.synonyms
            );

        const antonyms =
            extractLinks(
                firstSense.antonyms
            );


        /*
         * RETURN CLEAN DATA
         */

        return res.status(200).json({

            word:
                senseEntry.word || word,

            phonetic:
                phonetic,

            phonetics: [],

            meanings: [{

                partOfSpeech:
                    pos,

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
            "WiktAPI error:",
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
   PART OF SPEECH
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

    return (
        names[
            String(pos || "").toLowerCase()
        ] ||
        pos ||
        "Word"
    );
}


/* =========================
   LINKS
========================= */

function extractLinks(items) {

    if (!Array.isArray(items)) {
        return [];
    }

    return items
        .map(item => {

            if (typeof item === "string") {
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
