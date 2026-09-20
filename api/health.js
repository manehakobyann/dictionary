// Lingora backend health check
export default function handler(req, res) {
    res.status(200).json({
        status: "ok",
        message: "Lingora backend is working!"
    });
}
