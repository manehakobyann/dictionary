const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const result = document.getElementById("result");

const wordElement = document.getElementById("word");
const phoneticElement = document.getElementById("phonetic");
const partOfSpeechElement = document.getElementById("partOfSpeech");
const meaningElement = document.getElementById("meaning");
const armenianElement = document.getElementById("armenian");
const synonymsElement = document.getElementById("synonyms");
const antonymsElement = document.getElementById("antonyms");
const exampleElement = document.getElementById("example");
const armenianExampleElement =
    document.getElementById("armenianExample");


/* =========================
   ANTONYM DATABASE
========================= */

const antonymDatabase = {

    happy: ["sad", "unhappy"],
    sad: ["happy"],
    good: ["bad"],
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


/* =========================
   EXAMPLE DATABASE
========================= */

const exampleDatabase = {

    house:
        "They bought a beautiful house.",

    happy:
        "She felt happy after hearing the good news.",

    sad:
        "He was sad when his friend left.",

    beautiful:
        "She wore a beautiful dress.",

    ugly:
        "The building looked old and ugly.",

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

    hate:
        "He hates waking up early.",

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


/* =========================
   SEARCH
========================= */

async function searchWord() {

    const word =
        searchInput.value.trim();

    if (!word) {
        alert("Please enter a word.");
        return;
    }

    searchButton.textContent =
        "SEARCHING...";

    searchButton.disabled =
        true;

    try {

        /* =========================
           GET DICTIONARY DATA
        ========================== */

        const response =
            await fetch(
                "/api/search?word=" +
                encodeURIComponent(word)
            );

        if (!response.ok) {
            throw new Error(
                "Word not found"
            );
        }

        const data =
            await response.json();

        if (!data || !data.length) {
            throw new Error(
                "No results"
            );
        }

        const entry =
            data[0];

        const meaning =
            entry.meanings?.[0];

        const definition =
            meaning?.definitions?.[0]?.definition ||
            "Definition unavailable.";


        /* =========================
           WORD
        ========================== */

        wordElement.textContent =
            entry.word || word;


        /* =========================
           PHONETIC
        ========================== */

        phoneticElement.textContent =
            entry.phonetic ||
            "Pronunciation unavailable.";


        /* =========================
           PART OF SPEECH
        ========================== */

        partOfSpeechElement.textContent =
            meaning?.partOfSpeech ||
            "Not available";


        /* =========================
           DEFINITION
        ========================== */

        meaningElement.textContent =
            definition;


        /* =========================
           SYNONYMS
        ========================== */

        const synonyms =
            entry.synonyms || [];

        synonymsElement.textContent =
            synonyms.length
                ? synonyms.join(" · ")
                : "No synonyms available.";


        /* =========================
           ANTONYMS
        ========================== */

        const normalizedWord =
            word.toLowerCase();

        const antonyms =
            antonymDatabase[
                normalizedWord
            ] || [];

        antonymsElement.textContent =
            antonyms.length
                ? antonyms.join(" · ")
                : "No antonyms available.";


        /* =========================
           EXAMPLE
        ========================== */

        const dictionaryExample =
            meaning?.definitions?.find(
                item => item.example
            )?.example || "";

        const example =
            dictionaryExample ||
            exampleDatabase[
                normalizedWord
            ] ||
            "";


        exampleElement.textContent =
            example ||
            "No example available.";


        /* =========================
           ARMENIAN
        ========================== */

        armenianElement.textContent =
            "Translating...";

        armenianExampleElement.textContent =
            "Translating...";


        /* =========================
           SHOW RESULT
        ========================== */

        result.classList.remove(
            "hidden"
        );

        result.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        /* =========================
           ARMENIAN TRANSLATION
        ========================== */

        try {

            const translationResponse =
                await fetch(
                    "/api/translate",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            word:
                                word,

                            definition:
                                definition,

                            example:
                                example

                        })
                    }
                );


            if (!translationResponse.ok) {
                throw new Error(
                    "Translation failed"
                );
            }


            const translation =
                await translationResponse.json();


            armenianElement.textContent =
                translation.armenian ||
                "Translation unavailable.";


            armenianExampleElement.textContent =
                translation.armenianExample ||
                "Example unavailable.";


            const armenianDefinitionElement =
                document.getElementById(
                    "armenianDefinition"
                );


            if (
                armenianDefinitionElement
            ) {

                armenianDefinitionElement.textContent =
                    translation.armenianDefinition ||
                    "Definition unavailable.";

            }


        } catch (translationError) {

            console.error(
                "Translation error:",
                translationError
            );

            armenianElement.textContent =
                "Translation unavailable.";

            armenianExampleElement.textContent =
                "Example unavailable.";

        }

    } catch (error) {

        console.error(
            "Search error:",
            error
        );

        alert(
            "Something went wrong. Please try again."
        );

    } finally {

        searchButton.textContent =
            "SEARCH";

        searchButton.disabled =
            false;

    }
}


/* =========================
   SEARCH BUTTON
========================= */

searchButton.addEventListener(
    "click",
    searchWord
);


/* =========================
   ENTER KEY
========================= */

searchInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {
            searchWord();
        }

    }
);
