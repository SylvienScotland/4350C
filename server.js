const express = require("express");
const app = express(); 
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const port = 5000;

// Initialize the SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the users.db database.");
});


// Middleware to parse form data from POST requests
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images) from the 'public' directory
app.use(express.static(path.join(__dirname, "public"))); 

// Serve the HTML file for the root route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "checkmycomic-html-prep.html"));
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
  console.log("User login data:", email, password);
  // Add login validation logic here
  res.redirect("/"); // Redirect to the home page after login
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


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
