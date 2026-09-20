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
            "https://api.dictionaryapi.dev/api/v2/entries/en/" +
            encodeURIComponent(word);

        const controller =
            new AbortController();

        const timeout =
            setTimeout(() => {
                controller.abort();
            }, 15000);

        const response =
            await fetch(url, {
                signal: controller.signal
            });

        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error("Word not found");
        }

        const data =
            await response.json();

        if (!data || !data.length) {
            throw new Error("No results");
        }

        const entry =
            data[0];


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
           4. FIND MAIN MEANING
        ========================== */

        const meaning =
            entry.meanings?.[0];

        const partOfSpeech =
            meaning?.partOfSpeech ||
            "Not available";

        partOfSpeechElement.textContent =
            partOfSpeech;


        /* =========================
           5. DEFINITION
        ========================== */

        const definition =
            meaning?.definitions?.[0]?.definition ||
            "No definition available.";

        meaningElement.textContent =
            definition;


        /* =========================
           6. SYNONYMS
        ========================== */

        let synonyms = [];

        for (
            const meaningItem
            of entry.meanings || []
        ) {

            for (
                const definitionItem
                of meaningItem.definitions || []
            ) {

                if (
                    definitionItem.synonyms
                ) {

                    synonyms.push(
                        ...definitionItem.synonyms
                    );

                }

            }

        }


        /* =========================
           7. ANTONYMS
        ========================== */

        let antonyms = [];

        for (
            const meaningItem
            of entry.meanings || []
        ) {

            for (
                const definitionItem
                of meaningItem.definitions || []
            ) {

                if (
                    definitionItem.antonyms
                ) {

                    antonyms.push(
                        ...definitionItem.antonyms
                    );

                }

            }

        }


        /* =========================
           REMOVE DUPLICATES
        ========================== */

        synonyms = [
            ...new Set(
                synonyms.filter(Boolean)
            )
        ];

        antonyms = [
            ...new Set(
                antonyms.filter(Boolean)
            )
        ];


        /* =========================
           SHOW SYNONYMS
        ========================== */

        synonymsElement.textContent =
            synonyms.length
                ? synonyms.join(" · ")
                : "No synonyms available.";


        /* =========================
           SHOW ANTONYMS
        ========================== */

        antonymsElement.textContent =
            antonyms.length
                ? antonyms.join(" · ")
                : "No antonyms available.";


        /* =========================
           8. EXAMPLE
        ========================== */

        let example = "";

        for (
            const meaningItem
            of entry.meanings || []
        ) {

            for (
                const definitionItem
                of meaningItem.definitions || []
            ) {

                if (
                    definitionItem.example
                ) {

                    example =
                        definitionItem.example;

                    break;
                }

            }

            if (example) {
                break;
            }

        }


        exampleElement.textContent =
            example ||
            "No example available.";


        /* =========================
           9. ARMENIAN PLACEHOLDERS
        ========================== */

        armenianElement.textContent =
            "AI is translating...";

        armenianExampleElement.textContent =
            "AI is creating an Armenian example...";


        /* =========================
           10. SHOW RESULT
        ========================== */

        result.classList.remove("hidden");

        result.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });


        /* =========================
           11. ARMENIAN TRANSLATION
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

                let errorData = {};

                try {

                    errorData =
                        await translationResponse.json();

                } catch {

                    errorData = {};

                }

                throw new Error(
                    errorData.details ||
                    errorData.error ||
                    "Translation failed"
                );

            }


            const translation =
                await translationResponse.json();


            /* =========================
               ARMENIAN WORD
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
               ARMENIAN DEFINITION
            ========================== */

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
