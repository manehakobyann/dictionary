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
           DATAMUSE
           DEFINITION
        ========================== */

        const dictionaryResponse =
            await fetch(
                `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dps&max=1`
            );

        if (!dictionaryResponse.ok) {
            throw new Error(
                "Dictionary request failed"
            );
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
           FORMAT PART OF SPEECH
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
           SYNONYMS
        ========================== */

        let synonyms = [];

        try {

            const synonymResponse =
                await fetch(
                    `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=8`
                );

            const synonymData =
                await synonymResponse.json();

            synonyms =
                synonymData
                    .map(item => item.word)
                    .filter(Boolean)
                    .filter(item =>
                        item.toLowerCase() !==
                        word.toLowerCase()
                    );

        } catch {

            synonyms = [];

        }


        /* =========================
           ANTONYMS
        ========================== */

        let antonyms = [];

        try {

            const antonymResponse =
                await fetch(
                    `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=8`
                );

            const antonymData =
                await antonymResponse.json();

            antonyms =
                antonymData
                    .map(item => item.word)
                    .filter(Boolean)
                    .filter(item =>
                        item.toLowerCase() !==
                        word.toLowerCase()
                    );

        } catch {

            antonyms = [];

        }


        /* =========================
           WIKTIONARY
           PRONUNCIATION + EXAMPLE
        ========================== */

        let phonetic = "";
        let example = "";

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
                   IPA
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
                   EXAMPLE
                ========================== */

                const exampleMatches =
                    [
                        ...wikitext.matchAll(
                            /\{\{ux\|en\|([^|}]+)/gi
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

            }

        } catch (error) {

            console.log(
                "Optional Wiktionary data unavailable:",
                error.message
            );

        }


        /* =========================
           RESULT
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
