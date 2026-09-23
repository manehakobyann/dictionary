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
   SEARCH WORD
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


        /* =========================
           SUPPORT ARRAY FORMAT
        ========================= */

        if (Array.isArray(data)) {
            data = data[0];
        }


        /* =========================
           FIND DICTIONARY ENTRY
        ========================= */

        let entry = null;
        let sense = null;


        if (
            data.entries &&
            Array.isArray(data.entries)
        ) {

            /*
             * Prefer Noun when available.
             * Otherwise use the first entry.
             */

            entry =
                data.entries.find(
                    item =>
                        String(
                            item.partOfSpeech
                        ).toLowerCase() ===
                        "noun"
                ) ||
                data.entries[0];


            /*
             * Use the first sense
             * belonging to this entry.
             */

            sense =
                entry?.senses?.[0];

        }


        /* =========================
           OLD FORMAT SUPPORT
        ========================= */

        if (!entry && data.meanings) {

            const meaning =
                data.meanings[0];

            entry = {

                partOfSpeech:
                    meaning?.partOfSpeech,

                senses: [{
                    definition:
                        meaning?.definitions?.[0]
                            ?.definition,

                    example:
                        meaning?.definitions?.[0]
                            ?.example,

                    armenian:
                        [],

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
           ENGLISH DEFINITION
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
           ENGLISH EXAMPLE
        ========================= */

        const example =
            sense.example || "";

        exampleElement.textContent =
            example ||
            "No example available.";


        /* =========================
           ARMENIAN
           FROM DICTIONARY ONLY
        ========================= */

        const armenian =
            Array.isArray(
                sense.armenian
            )
                ? sense.armenian
                : [];

        armenianElement.textContent =
            armenian.length
                ? armenian.join(" · ")
                : "No Armenian translation available.";


        /* =========================
           ARMENIAN DEFINITION
        ========================= */

        armenianDefinitionElement.textContent =
            "No Armenian definition available.";


        /* =========================
           ARMENIAN EXAMPLE
        ========================= */

        armenianExampleElement.textContent =
            "No Armenian example available.";


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

        const text =
            wordElement.textContent.trim();

        if (!text) {
            return;
        }

        const speech =
            new SpeechSynthesisUtterance(text);

        speech.lang = "en-US";

        window.speechSynthesis.cancel();

        window.speechSynthesis.speak(
            speech
        );
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
   ENTER KEY
========================= */

searchInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {
            searchWord();
        }

    }
);
