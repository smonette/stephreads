const Airtable = require("airtable");
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);
// Cache the records in case we get a lot of traffic.
// Otherwise, we'll hit Airtable's rate limit.
var cacheTimeoutMs = 5 * 1000; // Cache for 5 seconds.
var cachedResponse = null;
var cachedResponseDate = null;

const express = require("express");
const app = express();

app.set("view engine", "ejs");

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function(request, response) {
  response.redirect("/list/2020");
});

app.get("/list/:year", function(request, response) {
  if (cachedResponse && new Date() - cachedResponseDate < cacheTimeoutMs) {
    response.send(cachedResponse);
  } else {
    // Select the first 12 records from the view.
    base(request.params.year)
      .select({
        maxRecords: 60,
        sort: [{ field: "Rating", direction: "desc" },{ field: "Fave", direction: "desc" }],
        view: "Grid view"
      })
      .firstPage(function(error, records) {
        if (error) {
          response.send({ error: error });
        } else {
          response.render(__dirname + "/views/list", {
            data: records,
            year: request.params.year
          });
        }
      });
  }
});

app.get("*", function(request, response) {
  response.render(__dirname + "/views/not-found");
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function() {
  console.log("Your app is listening on port " + listener.address().port);
});
