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

const armenianDefinitionElement =
    document.getElementById("armenianDefinition");

const audioButton =
    document.getElementById("audioButton");


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

        const response =
            await fetch(
                "/api/search?word=" +
                encodeURIComponent(word)
            );

        if (!response.ok) {
            throw new Error("Word not found");
        }

        let data =
            await response.json();


        /*
         * SUPPORT BOTH:
         *
         * New:
         * { word, entries: [...] }
         *
         * Old:
         * [ { word, meanings: [...] } ]
         */

        if (Array.isArray(data)) {
            data = data[0];
        }


        /* =========================
           NEW DICTIONARY FORMAT
        ========================= */

        let entry = null;
        let sense = null;


        if (
            data.entries &&
            Array.isArray(data.entries)
        ) {

            /*
             * Prefer noun first.
             * This makes "relative" use
             * the noun meaning.
             */

            entry =
                data.entries.find(
                    item =>
                        item.partOfSpeech ===
                        "Noun"
                ) ||
                data.entries[0];


            sense =
                entry?.senses?.[0];

        }


        /* =========================
           OLD FORMAT FALLBACK
        ========================= */

        if (!entry && data.meanings) {

            const meaning =
                data.meanings[0];

            entry = {

                partOfSpeech:
                    meaning?.partOfSpeech,

                senses: [{
                    definition:
                        meaning?.definitions?.[0]?.definition,

                    example:
                        meaning?.definitions?.[0]?.example,

                    synonyms:
                        meaning?.synonyms || [],

                    antonyms:
                        meaning?.antonyms || []
                }]

            };

            sense =
                entry.senses[0];
        }


        if (!entry || !sense) {
            throw new Error(
                "No dictionary data found"
            );
        }


        /* =========================
           WORD
        ========================= */

        wordElement.textContent =
            data.word || word;


        /* =========================
           PRONUNCIATION
        ========================= */

        phoneticElement.textContent =
            data.phonetic ||
            "Pronunciation unavailable.";


        /* =========================
           PART OF SPEECH
        ========================= */

        partOfSpeechElement.textContent =
            entry.partOfSpeech ||
            "Word";


        /* =========================
           DEFINITION
        ========================= */

        const definition =
            sense.definition ||
            "Definition unavailable.";

        meaningElement.textContent =
            definition;


        /* =========================
           SYNONYMS
        ========================= */

        const synonyms =
            Array.isArray(
                sense.synonyms
            )
                ? sense.synonyms
                : [];


        synonymsElement.textContent =
            synonyms.length
                ? synonyms.join(" · ")
                : "No synonyms available.";


        /* =========================
           ANTONYMS
        ========================= */

        const antonyms =
            Array.isArray(
                sense.antonyms
            )
                ? sense.antonyms
                : [];


        antonymsElement.textContent =
            antonyms.length
                ? antonyms.join(" · ")
                : "No direct antonym available.";


        /* =========================
           EXAMPLE
        ========================= */

        const example =
            sense.example || "";


        exampleElement.textContent =
            example ||
            "No example available.";


        /* =========================
           RESET ARMENIAN
        ========================= */

        armenianElement.textContent =
            "Loading...";

        armenianDefinitionElement.textContent =
            "Loading...";

        armenianExampleElement.textContent =
            "Loading...";


        /* =========================
           SHOW RESULT
        ========================= */

        result.classList.remove(
            "hidden"
        );

        result.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        /* =========================
           TEMPORARY TRANSLATION
        ========================= */

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

                            partOfSpeech:
                                entry.partOfSpeech,

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

            armenianDefinitionElement.textContent =
                translation.armenianDefinition ||
                "Definition unavailable.";

            armenianExampleElement.textContent =
                translation.armenianExample ||
                "Example unavailable.";


        } catch (translationError) {

            console.error(
                "Translation error:",
                translationError
            );

            armenianElement.textContent =
                "Translation unavailable.";

            armenianDefinitionElement.textContent =
                "Definition unavailable.";

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
   AUDIO
========================= */

audioButton.addEventListener(
    "click",
    function () {

        if (
            typeof currentAudio !==
            "undefined" &&
            currentAudio
        ) {

            currentAudio.currentTime =
                0;

            currentAudio.play();
        }

    }
);


/* =========================
   SEARCH BUTTON
========================= */

searchButton.addEventListener(
    "click",
    searchWord
);


/* =========================
   ENTER
========================= */

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {
            searchWord();
        }

    }
);
