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
            `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word.toLowerCase())}`,
            {
                headers: {
                    "User-Agent": "Lingora/1.0 dictionary project"
                }
            }
        );

        if (!response.ok) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const data = await response.json();

        const englishEntries = Array.isArray(data.en)
            ? data.en
            : [];

        if (!englishEntries.length) {
            return res.status(404).json({
                error: "No English dictionary entry found"
            });
        }

        const entries = [];

        for (const entry of englishEntries) {
            if (!entry || !Array.isArray(entry.definitions)) {
                continue;
            }

            const senses = entry.definitions
                .map((item) => {
                    const definition = cleanText(
                        item.definition || ""
                    );

                    let example = "";

                    if (
                        Array.isArray(item.examples) &&
                        item.examples.length
                    ) {
                        example = cleanText(
                            item.examples[0]
                        );
                    }

                    return {
                        definition,
                        example,
                        armenian: [],
                        synonyms: [],
                        antonyms: []
                    };
                })
                .filter(
                    (item) => item.definition
                );

            if (senses.length) {
                entries.push({
                    partOfSpeech:
                        entry.partOfSpeech || "Other",
                    senses
                });
            }
        }

        if (!entries.length) {
            return res.status(404).json({
                error: "No dictionary definitions found"
            });
        }

        return res.status(200).json({
            word: word,
            entries
        });

    } catch (error) {
        console.error(
            "Lingora dictionary error:",
            error
        );

        return res.status(500).json({
            error: "Dictionary service unavailable"
        });
    }
}


/* =========================
   CLEAN WIKTIONARY TEXT
========================= */

function cleanText(text) {
    return String(text)
        .replace(/\.mw-parser-output\s+\.defdate\{[^}]*\}/g, "")
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
        .replace(/\[\[([^\]]+)\]\]/g, "$1")
        .replace(/'''/g, "")
        .replace(/''/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
