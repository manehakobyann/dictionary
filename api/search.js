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
            `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`,
            {
                headers: {
                    "User-Agent":
                        "Lingora/1.0 dictionary project"
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


        /*
         * Wikimedia returns language data.
         * We only want English.
         */

        const english =
            data.en;

        if (!english) {

            return res.status(404).json({
                error:
                    "No English dictionary entry found"
            });
        }


        /*
         * Convert Wiktionary's POS keys
         * into readable names.
         */

        const entries = [];


        for (
            const [pos, definitions]
            of Object.entries(english)
        ) {

            if (
                !Array.isArray(definitions)
            ) {
                continue;
            }


            const senses =
                definitions.map(
                    item => {

                        const definition =
                            item.definition ||
                            item.gloss ||
                            "";


                        const example =
                            item.example ||
                            "";


                        return {

                            definition:
                                cleanText(
                                    definition
                                ),

                            example:
                                cleanText(
                                    example
                                ),

                            armenian: [],

                            synonyms: [],

                            antonyms: []

                        };
                    }
                )
                .filter(
                    item =>
                        item.definition
                );


            if (senses.length) {

                entries.push({

                    partOfSpeech:
                        formatPartOfSpeech(
                            pos
                        ),

                    senses:
                        senses

                });
            }
        }


        /*
         * Nothing found.
         */

        if (!entries.length) {

            return res.status(404).json({
                error:
                    "No dictionary definitions found"
            });
        }


        /*
         * Return Lingora's own
         * clean dictionary format.
         */

        return res.status(200).json({

            word: word,

            entries: entries

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
        numeral: "Numeral",
        proper_noun: "Proper noun"

    };

    const key =
        String(pos)
            .toLowerCase()
            .replace(/\s+/g, "_");

    return (
        names[key] ||
        pos
    );
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
            /'''/g,
            ""
        )

        .replace(
            /''/g,
            ""
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

        .replace(
            /\s+/g,
            " "
        )

        .trim();
}
