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
const armenianExampleElement = document.getElementById("armenianExample");


async function searchWord() {

    const word = searchInput.value.trim();

    if (!word) {
        alert("Please enter a word.");
        return;
    }

    searchButton.textContent = "SEARCHING...";
    searchButton.disabled = true;

    try {

        /*
         * Lingora now uses our backend.
         * The backend communicates with the dictionary service.
         */
        const url =
            "/api/search?word=" +
            encodeURIComponent(word);

        // Stop waiting after 10 seconds
        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 10000);

        const response = await fetch(url, {
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {

            if (response.status === 404) {
                throw new Error("Word not found");
            }

            throw new Error("Server error");
        }

        const data = await response.json();

        if (!data || !data.length) {
            throw new Error("No results");
        }

        const entry = data[0];


        // -------------------------
        // WORD
        // -------------------------

        wordElement.textContent =
            entry.word || word;


        // -------------------------
        // PRONUNCIATION
        // -------------------------

        const phonetic =
            entry.phonetic ||
            (entry.phonetics || [])
                .find(item => item.text)?.text ||
            "Pronunciation unavailable";

        phoneticElement.textContent = phonetic;


        // -------------------------
        // MEANING
        // -------------------------

        const meaning =
            entry.meanings?.[0];

        partOfSpeechElement.textContent =
            meaning?.partOfSpeech ||
            "Not available";

        meaningElement.textContent =
            meaning?.definitions?.[0]?.definition ||
            "No definition available.";


        // -------------------------
        // SYNONYMS
        // -------------------------

        const synonyms =
            meaning?.synonyms || [];

        synonymsElement.textContent =
            synonyms.length
                ? synonyms.join(" · ")
                : "No synonyms available.";


        // -------------------------
        // ANTONYMS
        // -------------------------

        const antonyms =
            meaning?.antonyms || [];

        antonymsElement.textContent =
            antonyms.length
                ? antonyms.join(" · ")
                : "No antonyms available.";


        // -------------------------
        // EXAMPLE
        // -------------------------

        const example =
            meaning?.definitions
                ?.find(item => item.example)
                ?.example;

        exampleElement.textContent =
            example ||
            "No example available.";


        // -------------------------
        // ARMENIAN
        // -------------------------

        armenianElement.textContent =
            "AI Armenian translation — coming next.";

        armenianExampleElement.textContent =
            "AI Armenian example — coming next.";


        // -------------------------
        // SHOW RESULT
        // -------------------------

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

        searchButton.textContent = "SEARCH";
        searchButton.disabled = false;

    }
}


// -------------------------
// SEARCH BUTTON
// -------------------------

searchButton.addEventListener(
    "click",
    searchWord
);


// -------------------------
// ENTER KEY
// -------------------------

searchInput.addEventListener(
    "keydown",
    function(event) {

        if (event.key === "Enter") {
            searchWord();
        }

    }
);
