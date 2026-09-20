export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const word = req.query.word?.trim().toLowerCase();

    if (!word) {
        return res.status(400).json({
            error: "Please provide a word"
        });
    }

    try {

        /* =========================
           DATAMUSE
        ========================== */

        const response = await fetch(
            `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=dps&max=1`
        );

        const data = await response.json();

        if (!data.length) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const item = data[0];

        const definitions = item.defs || [];

        let partOfSpeech = "word";
        let definition = "Definition unavailable.";

        if (definitions.length) {

            const pieces =
                definitions[0].split("\t");

            partOfSpeech =
                pieces[0] || "word";

            definition =
                pieces.slice(1).join("\t") ||
                "Definition unavailable.";
        }


        /* =========================
           SYNONYMS
        ========================== */

        const synonymResponse = await fetch(
            `https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=8`
        );

        const synonymData =
            await synonymResponse.json();

        let synonyms =
            synonymData
                .map(item => item.word)
                .filter(Boolean)
                .filter(item =>
                    item.toLowerCase() !== word
                );


        /* =========================
           ANTONYMS
        ========================== */

        const antonymResponse = await fetch(
            `https://api.datamuse.com/words?rel_ant=${encodeURIComponent(word)}&max=8`
        );

        const antonymData =
            await antonymResponse.json();

        let antonyms =
            antonymData
                .map(item => item.word)
                .filter(Boolean);


        /* =========================
           ANTONYM FALLBACK
        ========================== */

        const antonymDictionary = {

            happy: ["sad", "unhappy"],
            sad: ["happy", "cheerful"],
            good: ["bad", "evil"],
            bad: ["good"],
            big: ["small", "little"],
            small: ["big", "large"],
            beautiful: ["ugly"],
            ugly: ["beautiful"],
            hot: ["cold"],
            cold: ["hot"],
            fast: ["slow"],
            slow: ["fast"],
            easy: ["difficult", "hard"],
            difficult: ["easy"],
            hard: ["easy", "soft"],
            soft: ["hard"],
            rich: ["poor"],
            poor: ["rich"],
            young: ["old"],
            old: ["young"],
            new: ["old"],
            clean: ["dirty"],
            dirty: ["clean"],
            light: ["dark", "heavy"],
            dark: ["light"],
            strong: ["weak"],
            weak: ["strong"],
            early: ["late"],
            late: ["early"],
            open: ["closed"],
            closed: ["open"],
            full: ["empty"],
            empty: ["full"],
            true: ["false"],
            false: ["true"],
            right: ["wrong"],
            wrong: ["right"],
            love: ["hate"],
            hate: ["love"],
            friend: ["enemy"],
            enemy: ["friend"],
            success: ["failure"],
            failure: ["success"],
            win: ["lose"],
            lose: ["win"],
            start: ["finish", "end"],
            finish: ["start"],
            end: ["beginning"],
            beginning: ["end"],
            increase: ["decrease"],
            decrease: ["increase"],
            high: ["low"],
            low: ["high"],
            near: ["far"],
            far: ["near"],
            inside: ["outside"],
            outside: ["inside"],
            above: ["below"],
            below: ["above"],
            before: ["after"],
            after: ["before"],
            always: ["never"],
            never: ["always"]
        };


        if (!antonyms.length) {

            antonyms =
                antonymDictionary[word] || [];

        }


        /* =========================
           EXAMPLES
        ========================== */

        const exampleDictionary = {

            house:
                "They bought a beautiful house.",

            happy:
                "She felt happy after hearing the good news.",

            sad:
                "He was sad when his friend left.",

            beautiful:
                "She wore a beautiful dress.",

            big:
                "They live in a big house.",

            small:
                "She has a small dog.",

            good:
                "He is a good student.",

            bad:
                "It was a bad decision.",

            love:
                "I love spending time with my family.",

            friend:
                "My friend helped me with my homework.",

            family:
                "My family lives in Armenia.",

            school:
                "She goes to school every morning.",

            book:
                "I am reading an interesting book.",

            water:
                "She drank a glass of water."
        };


        const example =
            exampleDictionary[word] || "";


        /* =========================
           FINAL RESULT
        ========================== */

        return res.status(200).json([{

            word:
                item.word || word,

            phonetic:
                item.tags?.find(tag =>
                    tag.startsWith("pron:")
                )?.replace("pron:", "") || "",

            phonetics: [],

            meanings: [{

                partOfSpeech:
                    partOfSpeech,

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
            "Lingora dictionary error:",
            error
        );

        return res.status(500).json({
            error:
                "Dictionary service unavailable"
        });
    }
}
