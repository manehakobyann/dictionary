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


async function searchWord() {

    const word = searchInput.value.trim();

    if (!word) {
        alert("Please enter a word.");
        return;
    }

    searchButton.textContent = "SEARCHING...";
    searchButton.disabled = true;

    try {

        /* =========================
           GET WORD FROM DATAMUSE
        ========================== */

        const response = await fetch(
            "/api/search?word=" +
            encodeURIComponent(word)
        );

        if (!response.ok) {
            throw new Error("Word not found");
        }

        const data = await response.json();

        if (!data || !data.length) {
            throw new Error("No results");
        }

        const entry = data[0];

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

        const antonyms =
            entry.antonyms || [];

        antonymsElement.textContent =
            antonyms.length
                ? antonyms.join(" · ")
                : "No antonyms available.";


        /* =========================
           EXAMPLE
        ========================== */

        const example =
            meaning?.definitions?.[0]?.example ||
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

        result.classList.remove("hidden");

        result.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        /* =========================
           MYMEMORY TRANSLATION
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


/* SEARCH BUTTON */

searchButton.addEventListener(
    "click",
    searchWord
);


/* ENTER KEY */

searchInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {
            searchWord();
        }

    }
);
