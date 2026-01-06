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

  // Initialize array to hold country codes
  let countries = [];

  // Extract country codes from query result and populate array
  result.rows.forEach((country) => {
    countries.push(country.country_code); // Fixed: removed 'countries =' and fixed property name
  });

  // Render the main page with the list of visited countries
  res.render("index.ejs", {
    countries: countries,
    total: countries.length
  });
});

/**
 * POST route to add a new visited country
 * Accepts country name, looks up country code, and adds to visited countries
 * @route POST /add
 */
app.post("/add", async (req, res) => {
  // Extract country name from request body
  const input = req.body["country"];

  try {
    // Look up the country code from the countries table by country name
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'",
      [input.toLowerCase()]
    );

    // Check if country was found in the database
    if (result.rows.length !== 0) {
      // Country found, extract the country code
      const countryCode = result.rows[0].country_code;

      try {
        // Insert the country code into visited_countries table
        await db.query(
          "INSERT INTO visited_countries (country_code) VALUES ($1)",
          [countryCode]
        );
        // Redirect to home page to show updated list
        res.redirect("/");
      } catch (insertErr) {
        // Handle duplicate entry error (country already visited)
        console.log("Insert error:", insertErr);
        res.send("Country has already been added, try again.");
      }
    } else {
      // Country not found in countries table
      res.send("Country not found, try again.");
    }

  } catch (err) {
    // Handle any other database errors
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
