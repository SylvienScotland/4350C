const express = require("express");
const app = express(); 
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const port = 5000;


// Initialize the SQLite databases
const userDb = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error("Error opening users.db:", err.message);
  } else {
    console.log("Connected to the users.db database.");
  }
});

const comicDb = new sqlite3.Database('./comics.db', (err) => {
  if (err) {
    console.error("Error opening comics.db:", err.message);
  } else {
    console.log("Connected to the comics.db database.");
  }
});

// Middleware to parse form data from POST requests
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, "public"))); 

// Set EJS as the view engine
app.set("view engine", "ejs");

// Serve the HTML file for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "checkmycomic-html-prep.html"));
});

// Handle search form submission
app.post("/search", (req, res) => {
  const searchTerm = req.body.searchTerm;

  console.log("Searching for:", searchTerm); // Debugging log

  // Query the comics database
  const query = `SELECT * FROM comics WHERE title LIKE ? OR issue_number LIKE ?`;
  const params = [`%${searchTerm}%`, `%${searchTerm}%`];

  comicDb.all(query, params, (err, rows) => {
    if (err) {
      console.error("Database query error:", err.message);
      return res.status(500).send("An error occurred while searching.");
    }

    console.log("Search Results:", rows); // Debugging log
    res.render("search-results", { comics: rows, searchTerm });
  });
});

// Serve the login page
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

// Serve the register page
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "register.html"));
});

// Handle login form submission
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if the user exists in the database
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error(err.message);
      res.redirect("/login");
    } else if (!user) {
      console.log("User not found");
      res.send("Invalid email or password.");
    } else {
      // Compare the hashed password
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (isMatch) {
          // Password is correct, create session
          req.session.user = user;
          res.redirect("/");
        } else {
          res.send("Invalid email or password.");
        }
      });
    }
  });
});

// Handle registration form submission
app.post("/register", (req, res) => {
  const { name, email, password, confirm_password } = req.body;

  if (password !== confirm_password) {
    return res.send("Passwords do not match.");
  }

  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err.message);
      return res.redirect("/register");
    }

    // Insert the new user into the database
    db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword], (err) => {
      if (err) {
        console.error(err.message);
        return res.send("Registration failed. Email may already be in use.");
      }
      res.redirect("/login");
    });
  });
});

// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err.message);
    }
    res.redirect("/");
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
