const express = require("express");
const app = express(); 
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const port = 5000;

// Set up express-session middleware
app.use(session({
  secret: 'your-secret-key', // Change this to a unique secret key
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

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

// Updated homepage route to pass session user data to the template
app.get("/", (req, res) => {
  res.render("index", { user: req.session.user });
});

// Handle search form submission
app.post("/search", (req, res) => {
  const searchTerm = req.body.searchTerm;

  const comicQuery = `SELECT * FROM comics WHERE title LIKE ? OR issue_number LIKE ?`;
  const params = [`%${searchTerm}%`, `%${searchTerm}%`];

  comicDb.all(comicQuery, params, (err, comics) => {
    if (err) {
      console.error("Database query error:", err.message);
      return res.status(500).send("An error occurred while searching.");
    }

    if (comics.length > 0) {
      const comicId = comics[0].id;  // Get the first matching comic

      const gradesQuery = `SELECT * FROM grades WHERE comic_id = ?`;
      comicDb.all(gradesQuery, [comicId], (err, grades) => {
        if (err) {
          console.error("Database query error:", err.message);
          return res.status(500).send("An error occurred while fetching grades.");
        }

        // Render the search-results page with user data and search results
        res.render("search-results", { title: 'Search Results', comic: comics[0], grades, searchTerm, user: req.session.user });
      });
    } else {
      res.render("search-results", { title: 'Search Results', comic: null, grades: [], searchTerm, user: req.session.user });
    }
  });
});

// Serve the login page
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if the user exists in the `users.db` database
  userDb.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (err) {
      console.error(err.message);
      return res.redirect("/login");
    }

    if (!user) {
      return res.send("Invalid email or password.");
    }

    // Compare hashed password with the entered password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error(err.message);
        return res.redirect("/login");
      }

      if (isMatch) {
        // Store the user in the session
        req.session.user = {
          id: user.id,
          name: user.name, // Save the username to display later
          email: user.email
        };
        return res.redirect("/");
      } else {
        return res.send("Invalid email or password.");
      }
    });
  });
});

// Handle registration form submission
app.post("/register", (req, res) => {
  const { name, email, password, confirm_password } = req.body;

  // Check if passwords match
  if (password !== confirm_password) {
    return res.send("Passwords do not match.");
  }

  // Hash the password before storing it
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.error(err.message);
      return res.redirect("/register");
    }

    // Insert the new user into the `users.db` database
    userDb.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [name, email, hashedPassword], (err) => {
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
