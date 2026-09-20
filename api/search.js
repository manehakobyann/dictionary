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
            `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dpsf&max=1`
        );

        if (!response.ok) {
            return res.status(500).json({
                error: "Dictionary service unavailable"
            });
        }

        const data = await response.json();

        if (!data.length) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const item = data[0];

        const definitions = item.defs || [];

        const firstDefinition =
            definitions.length
                ? definitions[0].replace(/^[^\t]+\t/, "")
                : "Definition unavailable.";

        const partOfSpeech =
            definitions.length
                ? definitions[0].split("\t")[0]
                : "word";

        const result = [{
            word: word,

            phonetic: "",

            phonetics: [],

            meanings: [{
                partOfSpeech: partOfSpeech,

                definitions: [{
                    definition: firstDefinition,
                    example: ""
                }],

                synonyms: [],

                antonyms: []
            }],

            synonyms: [],

            antonyms: []
        }];

        return res.status(200).json(result);

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
