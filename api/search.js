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
        /*
         * Get the English Wiktionary entry.
         * WiktAPI provides structured dictionary data.
         */
        const response = await fetch(
            `https://api.wiktapi.dev/v1/en/word/${encodeURIComponent(word.toLowerCase())}?lang=en`
        );

        if (!response.ok) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const data = await response.json();

        if (!Array.isArray(data.entries) || !data.entries.length) {
            return res.status(404).json({
                error: "No English dictionary entry found"
            });
        }

        /*
         * Get English entries only.
         */
        const englishEntries = data.entries.filter(
            entry =>
                entry.lang_code === "en" ||
                entry.lang === "English"
        );

        if (!englishEntries.length) {
            return res.status(404).json({
                error: "No English dictionary entry found"
            });
        }

        /*
         * Get dictionary translations.
         */
        let translations = [];

        try {
            const translationResponse = await fetch(
                `https://api.wiktapi.dev/v1/en/word/${encodeURIComponent(word.toLowerCase())}/translations?lang=en`
            );

            if (translationResponse.ok) {
                const translationData =
                    await translationResponse.json();

                translations =
                    extractArmenianTranslations(
                        translationData
                    );
            }
        } catch (translationError) {
            console.error(
                "Translation lookup error:",
                translationError
            );
        }

        /*
         * Build Lingora entries.
         */
        const entries = englishEntries.map(entry => {
            const partOfSpeech =
                formatPartOfSpeech(entry.pos);

            const senses = Array.isArray(entry.senses)
                ? entry.senses
                    .map(sense => {
                        const glosses =
                            Array.isArray(sense.glosses)
                                ? sense.glosses
                                : [];

                        const definition =
                            cleanText(
                                glosses[0] || ""
                            );

                        const example =
                            getExample(sense);

                        /*
                         * Try to keep translations
                         * connected to this sense.
                         */
                        const armenian =
                            getArmenianForSense(
                                sense,
                                translations
                            );

                        return {
                            definition,
                            example,
                            armenian,
                            synonyms:
                                getSynonyms(sense),
                            antonyms:
                                getAntonyms(sense)
                        };
                    })
                    .filter(
                        sense =>
                            sense.definition
                    )
                : [];

            return {
                partOfSpeech,
                senses
            };
        }).filter(
            entry =>
                entry.senses.length
        );

        if (!entries.length) {
            return res.status(404).json({
                error:
                    "No dictionary definitions found"
            });
        }

        /*
         * Find pronunciation.
         */
        let phonetic = "";

        for (const entry of englishEntries) {
            if (
                Array.isArray(entry.sounds)
            ) {
                const ipaSound =
                    entry.sounds.find(
                        sound =>
                            sound &&
                            sound.ipa
                    );

                if (ipaSound) {
                    phonetic =
                        ipaSound.ipa;
                    break;
                }
            }
        }

        return res.status(200).json({
            word,
            phonetic,
            entries
        });

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


/* =========================
   ARMENIAN TRANSLATIONS
========================= */

function extractArmenianTranslations(data) {
    const result = [];

    /*
     * WiktAPI may return the translation
     * table in slightly different structures.
     * We search the returned dictionary data
     * for Armenian language entries.
     */

    walkObject(data, result);

    return [...new Set(result)];
}


function walkObject(value, result) {
    if (!value) {
        return;
    }

    if (Array.isArray(value)) {
        for (const item of value) {
            walkObject(item, result);
        }

        return;
    }

    if (typeof value !== "object") {
        return;
    }

    const langCode =
        value.lang_code ||
        value.language_code ||
        value.code;

    const language =
        value.lang ||
        value.language;

    const isArmenian =
        langCode === "hy" ||
        String(language || "")
            .toLowerCase()
            .includes("armenian");

    if (isArmenian) {
        const translation =
            value.word ||
            value.term ||
            value.translation;

        if (
            typeof translation === "string" &&
            translation.trim()
        ) {
            result.push(
                translation.trim()
            );
        }
    }

    for (const key of Object.keys(value)) {
        walkObject(
            value[key],
            result
        );
    }
}


/* =========================
   MATCH ARMENIAN TO SENSE
========================= */

function getArmenianForSense(
    sense,
    translations
) {
    /*
     * If the sense itself contains
     * translation information, use it.
     */
    if (
        Array.isArray(sense.translations)
    ) {
        const armenian =
            sense.translations
                .filter(
                    item =>
                        item &&
                        (
                            item.lang_code === "hy" ||
                            item.language === "Armenian"
                        )
                )
                .map(
                    item =>
                        item.word ||
                        item.term ||
                        item.translation
                )
                .filter(Boolean);

        if (armenian.length) {
            return [
                ...new Set(armenian)
            ];
        }
    }

    /*
     * Otherwise use dictionary Armenian
     * translations returned by WiktAPI.
     */
    return translations;
}


/* =========================
   EXAMPLE
========================= */

function getExample(sense) {
    if (
        Array.isArray(sense.examples) &&
        sense.examples.length
    ) {
        const first =
            sense.examples[0];

        if (typeof first === "string") {
            return cleanText(first);
        }

        if (
            first &&
            typeof first === "object"
        ) {
            return cleanText(
                first.text ||
                first.example ||
                ""
            );
        }
    }

    return "";
}


/* =========================
   SYNONYMS
========================= */

function getSynonyms(sense) {
    if (
        !Array.isArray(sense.synonyms)
    ) {
        return [];
    }

    return [
        ...new Set(
            sense.synonyms
                .map(item => {
                    if (
                        typeof item === "string"
                    ) {
                        return item;
                    }

                    return (
                        item.word ||
                        item.term ||
                        ""
                    );
                })
                .filter(Boolean)
        )
    ];
}


/* =========================
   ANTONYMS
========================= */

function getAntonyms(sense) {
    if (
        !Array.isArray(sense.antonyms)
    ) {
        return [];
    }

    return [
        ...new Set(
            sense.antonyms
                .map(item => {
                    if (
                        typeof item === "string"
                    ) {
                        return item;
                    }

                    return (
                        item.word ||
                        item.term ||
                        ""
                    );
                })
                .filter(Boolean)
        )
    ];
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
        String(pos || "")
            .toLowerCase()
            .replace(/\s+/g, "_");

    return (
        names[key] ||
        pos ||
        "Other"
    );
}


/* =========================
   CLEAN TEXT
========================= */

function cleanText(text) {
    return String(text)
        .replace(
            /\.mw-parser-output\s+\.defdate\{[^}]*\}/g,
            ""
        )
        .replace(
            /<[^>]*>/g,
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
            /&#x27;/g,
            "'"
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
            /\s+/g,
            " "
        )
        .trim();
}
