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

            throw new Error("Dictionary server error");
        }

        const data =
            await response.json();

        if (!data || !data.length) {
            throw new Error("No results");
        }

        const entry = data[0];


        /* =========================
           2. WORD
        ========================== */

        wordElement.textContent =
            entry.word || word;


        /* =========================
           3. PRONUNCIATION
        ========================== */

        const phonetic =
            entry.phonetic ||
            (entry.phonetics || [])
                .find(item => item.text)?.text ||
            "Pronunciation unavailable";

        phoneticElement.textContent =
            phonetic;


        /* =========================
           4. MEANING
        ========================== */

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
           5. CURRENT SYNONYMS
           
           We intentionally leave
           these empty for now.
           AI will provide the
           correct synonyms.
        ========================== */

        synonymsElement.textContent =
            "AI is finding synonyms...";

        antonymsElement.textContent =
            "AI is finding antonyms...";


        /* =========================
           6. CURRENT EXAMPLE
        ========================== */

        const example =
            meaning?.definitions
                ?.find(item => item.example)
                ?.example ||
            "";

        exampleElement.textContent =
            example ||
            "AI is creating an example...";


        /* =========================
           7. AI PLACEHOLDERS
        ========================== */

        armenianElement.textContent =
            "AI is translating...";

        armenianExampleElement.textContent =
            "AI is creating an Armenian example...";


        /* =========================
           8. SHOW RESULT
        ========================== */

        result.classList.remove("hidden");

        result.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        /* =========================
           9. ASK AI
        ========================== */

        try {

            const translationResponse =
                await fetch("/api/translate", {

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

                });


            /* =========================
               GET REAL AI ERROR
            ========================== */

            if (!translationResponse.ok) {

                let errorData = {};

                try {

                    errorData =
                        await translationResponse.json();

                } catch {

                    errorData = {};

                }


                console.error(
                    "AI ERROR:",
                    errorData
                );


                throw new Error(
                    errorData.details ||
                    errorData.error ||
                    `AI request failed (${translationResponse.status})`
                );

            }


            /* =========================
               READ AI RESULT
            ========================== */

            const translation =
                await translationResponse.json();


            console.log(
                "LINGORA AI RESULT:",
                translation
            );


            /* =========================
               ARMENIAN
            ========================== */

            armenianElement.textContent =
                translation.armenian ||
                "Translation unavailable.";


            /* =========================
               ARMENIAN EXAMPLE
            ========================== */

            armenianExampleElement.textContent =
                translation.armenianExample ||
                "Example unavailable.";


            /* =========================
               AI SYNONYMS
            ========================== */

            const aiSynonyms =
                translation.synonyms || [];


            synonymsElement.textContent =
                aiSynonyms.length
                    ? aiSynonyms.join(" · ")
                    : "No synonyms available.";


            /* =========================
               AI ANTONYMS
            ========================== */

            const aiAntonyms =
                translation.antonyms || [];


            antonymsElement.textContent =
                aiAntonyms.length
                    ? aiAntonyms.join(" · ")
                    : "No antonyms available.";


            /* =========================
               AI ENGLISH EXAMPLE
            ========================== */

            if (
                translation.englishExample
            ) {

                exampleElement.textContent =
                    translation.englishExample;

            }


            /* =========================
               ARMENIAN DEFINITION
            ========================== */

            const armenianDefinitionElement =
                document.getElementById(
                    "armenianDefinition"
                );


            if (
                armenianDefinitionElement &&
                translation.armenianDefinition
            ) {

                armenianDefinitionElement.textContent =
                    translation.armenianDefinition;

            }


        } catch (translationError) {

            console.error(
                "LINGORA AI TRANSLATION ERROR:",
                translationError
            );


            /*
             * SHOW THE REAL ERROR
             * TEMPORARILY
             */

            armenianElement.textContent =
                "AI ERROR: " +
                translationError.message;


            armenianExampleElement.textContent =
                "Please check the AI connection.";


            synonymsElement.textContent =
                "AI synonyms unavailable.";


            antonymsElement.textContent =
                "AI antonyms unavailable.";

        }


    } catch (error) {

        console.error(
            "LINGORA SEARCH ERROR:",
            error
        );


        if (
            error.name === "AbortError"
        ) {

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
