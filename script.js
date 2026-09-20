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
        return;
    }

    searchButton.textContent = "SEARCHING...";
    searchButton.disabled = true;

    try {

        const url =
            "https://api.dictionaryapi.dev/api/v2/entries/en/" +
            encodeURIComponent(word);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Word not found");
        }

        const data = await response.json();

        const entry = data[0];

        wordElement.textContent = entry.word || word;

        const phonetic =
            entry.phonetic ||
            (entry.phonetics || []).find(item => item.text)?.text ||
            "";

        phoneticElement.textContent = phonetic;

        const meaning = entry.meanings?.[0];

        partOfSpeechElement.textContent =
            meaning?.partOfSpeech || "Not available";

        meaningElement.textContent =
            meaning?.definitions?.[0]?.definition ||
            "No definition available.";

        const synonyms = meaning?.synonyms || [];

        synonymsElement.textContent =
            synonyms.length
                ? synonyms.join(" · ")
                : "No synonyms available.";

        const antonyms = meaning?.antonyms || [];

        antonymsElement.textContent =
            antonyms.length
                ? antonyms.join(" · ")
                : "No antonyms available.";

        const example =
            meaning?.definitions?.find(item => item.example)?.example;

        exampleElement.textContent =
            example || "No example available.";

        armenianElement.textContent =
            "AI Armenian translation — coming next.";

        armenianExampleElement.textContent =
            "AI Armenian example — coming next.";

        result.classList.remove("hidden");

        result.scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {

        console.error(error);

        alert(
            "Lingora couldn't find this word. Please try another word."
        );

    } finally {

        searchButton.textContent = "SEARCH";
        searchButton.disabled = false;

    }
}

searchButton.addEventListener("click", searchWord);

searchInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        searchWord();
    }

});
