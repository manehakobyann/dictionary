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
           1. GET DICTIONARY DATA
        ========================== */

        const url =
            "/api/search?word=" +
            encodeURIComponent(word);

        const controller =
            new AbortController();

        const timeout =
            setTimeout(() => {
                controller.abort();
            }, 10000);

        const response =
            await fetch(url, {
                signal: controller.signal
            });

        clearTimeout(timeout);

        if (!response.ok) {

            if (response.status === 404) {
                throw new Error("Word not found");
            }

            throw new Error("Server error");
        }

        const data =
            await response.json();

        if (!data || !data.length) {
            throw new Error("No results");
        }

        const entry = data[0];

        /* =========================
           2. BASIC INFORMATION
        ========================== */

        wordElement.textContent =
            entry.word || word;

        const phonetic =
            entry.phonetic ||
            (entry.phonetics || [])
                .find(item => item.text)?.text ||
            "Pronunciation unavailable";

        phoneticElement.textContent =
            phonetic;

        const meaning =
            entry.meanings?.[0];

        const partOfSpeech =
            meaning?.partOfSpeech ||
            "Not available";

        partOfSpeechElement.textContent =
            partOfSpeech;

        const definition =
            meaning?.definitions?.[0]?.definition ||
            "No definition available.";

        meaningElement.textContent =
            definition;

        /* =========================
           3. SYNONYMS
        ========================== */

        const synonyms =
            meaning?.synonyms ||
            entry.synonyms ||
            [];

        synonymsElement.textContent =
            synonyms.length
                ? synonyms.join(" · ")
                : "No synonyms available.";

        /* =========================
           4. ANTONYMS
        ========================== */

        const antonyms =
            meaning?.antonyms ||
            entry.antonyms ||
            [];

        antonymsElement.textContent =
            antonyms.length
                ? antonyms.join(" · ")
                : "No antonyms available.";

        /* =========================
           5. EXAMPLE
        ========================== */

        const example =
            meaning?.definitions
                ?.find(item => item.example)
                ?.example ||
            "No example available.";

        exampleElement.textContent =
            example;


        /* =========================
           6. AI ARMENIAN TRANSLATION
        ========================== */

        armenianElement.textContent =
            "Translating with AI...";

        armenianExampleElement.textContent =
            "Creating Armenian example...";


        try {

            const translationResponse =
                await fetch("/api/translate", {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        word: word,

                        definition:
                            definition,

                        example:
                            example

                    })

                });


            if (!translationResponse.ok) {

                throw new Error(
                    "AI translation failed"
                );

            }


            const translation =
                await translationResponse.json();


            /* Armenian word */

            armenianElement.textContent =
                translation.armenian ||
                "Translation unavailable.";


            /* Armenian example */

            armenianExampleElement.textContent =
                translation.armenianExample ||
                "Example unavailable.";


            /*
             * If your HTML has a separate Armenian
             * definition element, use it too.
             */

            const armenianDefinitionElement =
                document.getElementById(
                    "armenianDefinition"
                );


            if (armenianDefinitionElement) {

                armenianDefinitionElement.textContent =
                    translation.armenianDefinition ||
                    "Definition unavailable.";

            }


        } catch (translationError) {

            console.error(
                "Lingora AI translation error:",
                translationError
            );

            armenianElement.textContent =
                "AI translation unavailable.";

            armenianExampleElement.textContent =
                "AI example unavailable.";

        }


        /* =========================
           7. SHOW RESULT
        ========================== */

        result.classList.remove("hidden");

        result.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


    } catch (error) {

        console.error(
            "Lingora search error:",
            error
        );


        if (error.name === "AbortError") {

            alert(
                "The search is taking too long. Please try again."
            );

        } else if (
            error.message === "Word not found"
        ) {

            alert(
                "Lingora couldn't find this word. Please check the spelling."
            );

        } else {

            alert(
                "Something went wrong. Please try again."
            );

        }

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
