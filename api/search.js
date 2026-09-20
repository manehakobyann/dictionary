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
           1. DATAMUSE
           DEFINITION + POS
        ========================== */

        const dictionaryResponse =
            await fetch(
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

        const item =
            dictionaryData[0];

        let partOfSpeech =
            "word";

        let definition =
            "Definition unavailable.";

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
           FORMAT POS
        ========================== */

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
            ] ||
            partOfSpeech;


        /* =========================
           DEFAULT VALUES
        ========================== */

        let synonyms = [];
        let antonyms = [];
        let example = "";
        let phonetic = "";


        /* =========================
           2. WIKTIONARY
        ========================== */

        try {

            const response =
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
                ========================== */

                const ipaMatch =
                    wikitext.match(
                        /\{\{IPA\|(?:en\|)?([^|}\n]+)/i
                    );

                if (ipaMatch) {

                    phonetic =
                        ipaMatch[1].trim();

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
                   FIND CORRECT POS SECTION
                ========================== */

                const section =
                    getPartOfSpeechSection(
                        wikitext,
                        formattedPartOfSpeech
                    );


                if (section) {

                    /* =========================
                       EXAMPLE
                    ========================== */

                    const exampleMatches = [
                        ...section.matchAll(
                            /\{\{(?:ux|usex)\|(?:en\|)?([^|}\n]+)/gi
                        )
                    ];

                    if (
                        exampleMatches.length
                    ) {

                        example =
                            cleanText(
                                exampleMatches[0][1]
                            );

                    }


                    /* =========================
                       SYNONYMS
                    ========================== */

                    synonyms =
                        extractListSection(
                            section,
                            "Synonyms"
                        );


                    /* =========================
                       ANTONYMS
                    ========================== */

                    antonyms =
                        extractListSection(
                            section,
                            "Antonyms"
                        );

                }

            }

        } catch (error) {

            console.log(
                "Optional Wiktionary data unavailable:",
                error.message
            );

        }


        /* =========================
           3. RESULT
        ========================== */

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
   FIND POS SECTION
========================= */

function getPartOfSpeechSection(
    wikitext,
    partOfSpeech
) {

    const names = {

        Noun: "Noun",
        Verb: "Verb",
        Adjective: "Adjective",
        Adverb: "Adverb",
        Pronoun: "Pronoun",
        Preposition: "Preposition",
        Conjunction: "Conjunction",
        Interjection: "Interjection"

    };

    const sectionName =
        names[partOfSpeech];

    if (!sectionName) {
        return "";
    }


    const pattern =
        new RegExp(
            "={3,4}" +
            sectionName +
            "={3,4}([\\s\\S]*?)(?=\\n={3,4}[^=]|$)",
            "i"
        );

    const match =
        wikitext.match(pattern);

    return match
        ? match[1]
        : "";
}


/* =========================
   EXTRACT SYNONYMS /
   ANTONYMS
========================= */

function extractListSection(
    section,
    heading
) {

    const pattern =
        new RegExp(
            "={4,5}" +
            heading +
            "={4,5}([\\s\\S]*?)(?=\\n={4,5}[^=]|\\n={3,4}[^=]|$)",
            "i"
        );

    const match =
        section.match(pattern);

    if (!match) {
        return [];
    }

    const text =
        match[1];

    const results = [];

    const links =
        text.match(
            /\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g
        ) || [];

    for (
        const link of links
    ) {

        const value =
            link
                .replace(/^\[\[/, "")
                .replace(/\]\]$/, "")
                .split("|")[0]
                .trim();

        if (value) {
            results.push(value);
        }
    }

    return [
        ...new Set(results)
    ].slice(0, 8);
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
