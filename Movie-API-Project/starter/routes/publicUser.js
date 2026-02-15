const express = require("express");
const router = express.Router();
const { getPublicUser } = require("../controllers/user");

router.get("/:id", getPublicUser);

module.exports = router;