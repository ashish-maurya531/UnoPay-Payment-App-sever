const express = require("express");
const authenticateToken = require("../middleware/auth");
const router = express.Router();


router.post("/cashkavach", authenticateToken,async(req, res) => {
    console.log("🔔 Webhook Received:", JSON.stringify(req.body, null, 2));
    res.status(200).json({ message: "Webhook received successfully" });
});

module.exports = router;
