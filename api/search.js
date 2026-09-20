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
           DATAMUSE — DEFINITION
        ========================= */

        const dictionaryResponse = await fetch(
            `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dps&max=1`
        );

        if (!dictionaryResponse.ok) {
            throw new Error("Dictionary request failed");
        }

        const dictionaryData =
            await dictionaryResponse.json();

        if (!dictionaryData.length) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const item = dictionaryData[0];

        let partOfSpeech = "word";
        let definition = "Definition unavailable.";

        if (item.defs?.length) {

            const pieces =
                item.defs[0].split("\t");

            partOfSpeech =
                pieces[0] || "word";

            definition =
                pieces
                    .slice(1)
                    .join("\t")
                    .trim() ||
                "Definition unavailable.";
        }


        /* =========================
           FORMAT PART OF SPEECH
        ========================= */

        const partOfSpeechNames = {

            n: "Noun",
            v: "Verb",
            adj: "Adjective",
            adv: "Adverb",
            prep: "Preposition",
            pron: "Pronoun",
            conj: "Conjunction",
            interj: "Interjection"

        };

        const formattedPartOfSpeech =
            partOfSpeechNames[
                partOfSpeech.toLowerCase()
            ] || partOfSpeech;


        /* =========================
           DEFAULTS
        ========================= */

        let phonetic = "";
        let example = "";
        let synonyms = [];
        let antonyms = [];
        let armenianTranslations = [];


        /* =========================
           WIKTIONARY
        ========================= */

        try {

            const response = await fetch(
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

            if (response.ok) {

                const data =
                    await response.json();

                const wikitext =
                    data
                        ?.parse
                        ?.wikitext
                        ?.["*"] || "";


                /* =========================
                   PRONUNCIATION
                ========================= */

                const ipaMatches = [
                    ...wikitext.matchAll(
                        /\{\{IPA\|(?:en\|)?([^|}\n]+)/gi
                    )
                ];

                if (ipaMatches.length) {

                    phonetic =
                        ipaMatches[0][1].trim();
                }


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


                /* =========================
                   FIND EXACT POS SECTION
                ========================= */

                const posSection =
                    getPOSSection(
                        wikitext,
                        formattedPartOfSpeech
                    );


                if (posSection) {

                    /* EXAMPLE */

                    example =
                        extractExample(
                            posSection
                        );


                    /* SYNONYMS */

                    synonyms =
                        extractSubsectionList(
                            posSection,
                            "Synonyms"
                        );


                    /* ANTONYMS */

                    antonyms =
                        extractSubsectionList(
                            posSection,
                            "Antonyms"
                        );


                    /* ARMENIAN */

                    armenianTranslations =
                        extractArmenianTranslations(
                            posSection
                        );
                }

            }

        } catch (error) {

            console.log(
                "Wiktionary error:",
                error.message
            );
        }


        /* =========================
           RESULT
        ========================= */

        return res.status(200).json([{

            word:
                item.word || word,

            phonetic:
                phonetic,

            phonetics: [],

            meanings: [{

                partOfSpeech:
                    formattedPartOfSpeech,

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
                antonyms,

            armenianTranslations:
                armenianTranslations

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


/* ==================================================
   FIND EXACT PART OF SPEECH
================================================== */

function getPOSSection(
    wikitext,
    partOfSpeech
) {

    const pattern =
        new RegExp(
            "^===\\s*" +
            escapeRegExp(partOfSpeech) +
            "\\s*===\\s*([\\s\\S]*?)(?=^===\\s*[^=]|^==\\s*[^=]|$)",
            "im"
        );

    const match =
        wikitext.match(pattern);

    return match
        ? match[1]
        : "";
}


/* ==================================================
   EXTRACT EXAMPLE
================================================== */

function extractExample(section) {

    const lines =
        section.split("\n");

    for (const line of lines) {

        const trimmed =
            line.trim();

        if (
            trimmed.startsWith("#*") ||
            trimmed.startsWith("#:")
        ) {

            let example =
                trimmed
                    .replace(/^#\*+\s*/, "")
                    .replace(/^#:+\s*/, "")
                    .trim();

            example =
                cleanText(example);

            if (
                example &&
                example.length > 15 &&
                !example.startsWith("{{")
            ) {

                return example;
            }
        }
    }

    return "";
}


/* ==================================================
   SYNONYMS / ANTONYMS
================================================== */

function extractSubsectionList(
    section,
    heading
) {

    const pattern =
        new RegExp(
            "^====\\s*" +
            escapeRegExp(heading) +
            "\\s*====\\s*([\\s\\S]*?)(?=^====\\s*[^=]|^===\\s*[^=]|$)",
            "im"
        );

    const match =
        section.match(pattern);

    if (!match) {
        return [];
    }

    const subsection =
        match[1];

    const results = [];

    const links =
        [
            ...subsection.matchAll(
                /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g
            )
        ];

    for (const link of links) {

        const value =
            cleanText(link[1]);

        if (
            value &&
            !results.includes(value)
        ) {

            results.push(value);
        }
    }

    return results.slice(0, 8);
}


/* ==================================================
   ARMENIAN TRANSLATIONS
================================================== */

function extractArmenianTranslations(
    section
) {

    const pattern =
        /^====\s*Translations\s*====\s*([\s\S]*?)(?=^====\s*[^=]|^===\s*[^=]|$)/im;

    const match =
        section.match(pattern);

    if (!match) {
        return [];
    }

    const translationSection =
        match[1];

    const results = [];


    /* =========================
       {{t|hy|word}}
       {{t+|hy|word}}
       ========================= */

    const templates = [
        ...translationSection.matchAll(
            /\{\{t\+?\+?\|hy\|([^}|]+)/gi
        )
    ];

    for (const match of templates) {

        const value =
            cleanText(match[1]);

        if (
            value &&
            !results.includes(value)
        ) {

            results.push(value);
        }
    }


    /* =========================
       ARMENIAN LINE FALLBACK
    ========================= */

    if (!results.length) {

        const armenianLine =
            translationSection.match(
                /^\*\s*Armenian:\s*(.+)$/im
            );

        if (armenianLine) {

            const links = [
                ...armenianLine[1].matchAll(
                    /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g
                )
            ];

            for (const link of links) {

                const value =
                    cleanText(link[1]);

                if (
                    value &&
                    !results.includes(value)
                ) {

                    results.push(value);
                }
            }
        }
    }


    return results.slice(0, 8);
}


/* ==================================================
   CLEAN TEXT
================================================== */

function cleanText(text) {

    return String(text)

        .replace(
            /\{\{[^{}]*\}\}/g,
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
            /<[^>]*>/g,
            ""
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


/* ==================================================
   ESCAPE REGEX
================================================== */

function escapeRegExp(string) {

    return String(string)
        .replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        );
}
