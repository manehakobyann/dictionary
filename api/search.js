export default async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const word = req.query.word?.trim();

    if (!word) {
        return res.status(400).json({
            error: "Please provide a word"
        });
    }

    try {

        const controller = new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 8000);

        const response = await fetch(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
            {
                signal: controller.signal
            }
        );

        clearTimeout(timeout);

        if (!response.ok) {
            return res.status(404).json({
                error: "Word not found"
            });
        }

        const data = await response.json();

        return res.status(200).json(data);

    } catch (error) {

        console.error("Dictionary error:", error);

        if (error.name === "AbortError") {
            return res.status(504).json({
                error: "Dictionary request timed out"
            });
        }

        return res.status(500).json({
            error: "Dictionary service unavailable"
        });
    }
}
