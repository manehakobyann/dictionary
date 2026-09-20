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

let currentAudio = null;


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

        /* =========================
           GET DICTIONARY DATA
        ========================= */

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


        const entry =
            await response.json();


        if (
            !entry ||
            !entry.meanings ||
            !entry.meanings.length
        ) {

            throw new Error(
                "No dictionary data"
            );
        }


        /* =========================
           SELECT FIRST MEANING
        ========================= */

        const meaning =
            entry.meanings[0];


        const definition =
            meaning
                ?.definitions
                ?.find(
                    item =>
                        item.definition
                );


        /* =========================
           WORD
        ========================= */

        wordElement.textContent =
            entry.word || word;


        /* =========================
           PHONETIC
        ========================= */

        const phonetic =
            entry.phonetic ||
            entry.phonetics?.find(
                item => item.text
            )?.text ||
            "Pronunciation unavailable.";


        phoneticElement.textContent =
            phonetic;


        /* =========================
           AUDIO
        ========================= */

        const audio =
            entry.phonetics?.find(
                item => item.audio
            )?.audio;


        if (audio) {

            currentAudio =
                new Audio(
                    audio.startsWith("//")
                        ? "https:" + audio
                        : audio
                );

            audioButton.style.display =
                "block";

        } else {

            currentAudio = null;

            audioButton.style.display =
                "none";
        }


        /* =========================
           PART OF SPEECH
        ========================= */

        partOfSpeechElement.textContent =
            meaning.partOfSpeech ||
            "Not available";


        /* =========================
           DEFINITION
        ========================= */

        meaningElement.textContent =
            definition?.definition ||
            "Definition unavailable.";


        /* =========================
           SYNONYMS
        ========================= */

        const synonyms =
            definition?.synonyms?.length
                ? definition.synonyms
                : meaning.synonyms || [];


        synonymsElement.textContent =
            synonyms.length
                ? synonyms.join(" · ")
                : "No synonyms available.";


        /* =========================
           ANTONYMS
        ========================= */

        const antonyms =
            definition?.antonyms?.length
                ? definition.antonyms
                : meaning.antonyms || [];


        antonymsElement.textContent =
            antonyms.length
                ? antonyms.join(" · ")
                : "No direct antonym available.";


        /* =========================
           EXAMPLE
        ========================= */

        const example =
            definition?.example || "";


        exampleElement.textContent =
            example ||
            "No example available.";


        /* =========================
           RESET ARMENIAN
        ========================= */

        armenianElement.textContent =
            "Translating...";

        armenianDefinitionElement.textContent =
            "Translating...";

        armenianExampleElement.textContent =
            "Translating...";


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
           TRANSLATION
        ========================= */

        if (definition?.definition) {

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
                                    meaning.partOfSpeech,

                                definition:
                                    definition.definition,

                                example:
                                    example

                            })
                        }
                    );


                if (
                    !translationResponse.ok
                ) {

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

        } else {

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
   AUDIO BUTTON
========================= */

audioButton.addEventListener(
    "click",
    function() {

        if (currentAudio) {

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
