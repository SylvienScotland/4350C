const express = require("express");
const app = express(); 
const path = require("path");
const port = 5000;

// Serve static files (CSS, JS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, "public"))); 

// Serve the HTML file for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "checkmycomic-html-prep.html"));
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
