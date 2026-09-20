export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const {
        word,
        definition,
        example
    } = req.body || {};

    if (!word) {
        return res.status(400).json({
            error: "Word is required"
        });
    }

    try {

        /* =========================
           TRANSLATE WORD
        ========================== */

        const wordResponse = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|hy`
        );

        const wordData =
            await wordResponse.json();

        const armenian =
            wordData.responseData?.translatedText ||
            "Translation unavailable.";


        /* =========================
           TRANSLATE DEFINITION
        ========================== */

        let armenianDefinition =
            "Definition unavailable.";

        if (definition) {

            const definitionResponse =
                await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(definition)}&langpair=en|hy`
                );

            const definitionData =
                await definitionResponse.json();

            armenianDefinition =
                definitionData.responseData?.translatedText ||
                "Definition unavailable.";
        }


        /* =========================
           TRANSLATE EXAMPLE
        ========================== */

        let armenianExample =
            "Example unavailable.";

        if (example) {

            const exampleResponse =
                await fetch(
                    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(example)}&langpair=en|hy`
                );

            const exampleData =
                await exampleResponse.json();

            armenianExample =
                exampleData.responseData?.translatedText ||
                "Example unavailable.";
        }


        return res.status(200).json({

            armenian:
                armenian,

            armenianDefinition:
                armenianDefinition,

            englishExample:
                example ||
                "No example available.",

            armenianExample:
                armenianExample,

            synonyms: [],

            antonyms: []

        });


    } catch (error) {

        console.error(
            "Lingora translation error:",
            error
        );

        return res.status(500).json({
            error:
                "Translation service unavailable",
            details:
                error.message
        });
    }
}
