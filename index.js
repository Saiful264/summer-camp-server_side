const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Summer Camp Server is running..");
});

app.listen(port, () => {
  console.log(`Summer Camp is running on port ${port}`);
});
