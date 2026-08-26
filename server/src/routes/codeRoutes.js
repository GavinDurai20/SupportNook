const express = require("express");

const {
  getLanguages,
  runCode,
} = require("../controllers/codeController");

const router =
  express.Router();


router.get(
  "/languages",
  getLanguages
);


router.post(
  "/run",
  runCode
);


module.exports = router;