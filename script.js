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

searchButton.addEventListener("click", searchWord);

searchInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        searchWord();
    }
});

async function searchWord() {

    const word = searchInput.value.trim();

    if (!word) {
        alert("Please enter a word.");
        return;
    }

    searchButton.textContent = "SEARCHING...";
    searchButton.disabled = true;

    try {

        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );

        if (!response.ok) {
            throw new Error("Word not found");
        }

        const data = await response.json();

        const entry = data[0];

        wordElement.textContent = entry.word || word;

        phoneticElement.textContent =
            entry.phonetic ||
            entry.phonetics?.find(p => p.text)?.text ||
            "Pronunciation unavailable";

        const meaning = entry.meanings?.[0];

        partOfSpeechElement.textContent =
            meaning?.partOfSpeech || "Not available";

        meaningElement.textContent =
            meaning?.definitions?.[0]?.definition ||
            "Definition unavailable";

        synonymsElement.textContent =
            meaning?.synonyms?.join(" · ") ||
            "No synonyms available";

        antonymsElement.textContent =
            meaning?.antonyms?.join(" · ") ||
            "No antonyms available";

        exampleElement.textContent =
            meaning?.definitions?.find(d => d.example)?.example ||
            "No example available";

        armenianElement.textContent =
            "Armenian translation will be added with AI.";

        armenianExampleElement.textContent =
            "Հայերեն թարգմանությունը կավելացվի AI-ի միջոցով։";

        result.classList.remove("hidden");

        result.scrollIntoView({
            behavior: "smooth"
        });

    } catch (error) {

        alert(
            "We couldn't find this word. Please check the spelling and try again."
        );

    } finally {

        searchButton.textContent = "SEARCH";
        searchButton.disabled = false;

    }
}
