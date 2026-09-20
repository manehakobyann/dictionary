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
           DEFINITION + PART OF SPEECH
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
           2. SYNONYMS
        ========================== */

        let synonyms = [];

        try {

            const response =
                await fetch(
                    `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=8`
                );

            const data =
                await response.json();

            synonyms =
                data
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
           3. ANTONYMS
        ========================== */

        let antonyms = [];

        try {

            const response =
                await fetch(
                    `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=8`
                );

            const data =
                await response.json();

            antonyms =
                data
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
           4. WIKTIONARY
           PRONUNCIATION ONLY
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

            if (pronunciationResponse.ok) {

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
                        ipaMatch[1].trim();

                }


                /* Direct IPA fallback */

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

        } catch (error) {

            console.log(
                "Pronunciation unavailable:",
                error.message
            );

        }


        /* =========================
           5. RESULT
        ========================== */

        return res.status(200).json([{

            word:
                item.word || word,

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
                        ""

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
