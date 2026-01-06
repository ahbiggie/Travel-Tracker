/**
 * Travel Tracker Application
 * A web application to track visited countries using PostgreSQL database
 */

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

// Initialize Express application
const app = express();
const port = 3000;

/**
 * PostgreSQL database client configuration
 * @type {pg.Client}
 */
const db = new pg.Client({
  user: "postgres",          // Database username
  host: "localhost",         // Database host (local machine)
  database: "world",         // Database name
  password: "123456",        // Database password
  port: 5432,                // PostgreSQL default port
})

// Establish connection to the database
db.connect();

// Middleware to parse URL-encoded bodies (form data)
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware to serve static files from the 'public' directory
app.use(express.static("public"));

/**
 * Test query to verify database connection
 * Retrieves all records from visited_countries table
 */
db.query("SELECT * FROM visited_countries", (err, res) => {
  if (err) {
    console.error("Database query error:", err);
  } else {
    console.log("Visited countries:", res.rows);
  }
})

/**
 * GET route for home page
 * Fetches all visited countries from database and renders the main page
 * @route GET /
 */
app.get("/", async (req, res) => {
  // Query database for country codes of all visited countries
  const result = await db.query("SELECT country_code FROM visited_countries");
  // create a variable to hold the country codes
  let countries = [];
  // Extract country codes from query result
  countries = result.rows.forEach((country) => {
    countries.push(country.countrycode);
  });
  // Render the main page with the list of visited countries
  res.render("index.ejs", {
    countries: countries, total: countries.length

  });

});
// POST route to add a new visited country
app.post("/add", async (req, res) => {
  // Extract country code from request body
  const input = req.body["country"];
  try {
    // LOOKUP the country code in the database and insert it if not already present
    const result = await db.query("SELECT country_code FROM visited_countries WHERE country_name ILIKE $1", [input]);

    if (result.rows.length !== 0) {
      // Country found, insert into visited_countries table
      const countryCode = result.rows[0].country_code;

      // INSERT the countryCode into visited_countries table
      await db.query("INSERT INTO visited_countries (country_code) VALUES ($1)", [countryCode]);
      res.redirect("/");
    } else {
      // Country not found, send error response
      res.send("Country not found, try again.");
    }

  } catch (err) {
    console.error("Error adding country:", err);
    res.status(500).send("Internal Server Error");
  }
});



/**
 * Start the Express server
 * @listens {number} port - The port number to listen on
 */
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
