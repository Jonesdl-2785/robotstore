const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const handlebars = require('express-handlebars').create({defaultLayout: 'main'});
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('/Users/ThedWord/Documents/coderCampBackEndFoundations/Persistence/Chinook_Sqlite_AutoIncrementPKs.sqlite');
//const query = `SELECT * from Album LIMIT 100`;
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.get("/albums", (req, res) => {
  const query = `SELECT Artist.Name as Artist, Album.Title as Album from Artist JOIN Album USING (ArtistId)`;
  let resultsArray = [];
  db.each(query, (err, row) => {
    if (err) throw err;
    // console.log(row);
    resultsArray.push(row);
  });
  res.render("albums", { results: resultsArray });
});
const port = 3000;

//db.each(query, (err, row) => {
//  if (err) throw err;
//});


//app.get('/albums', (req, res) => {
//  res.render('albums')
//});

//app.get('/albums', (req, res) => {
//  db.run('SELECT Title from Album')
//  console.log(req.body);
//});
//db.each(query, (err, row) => {
//  if (err) throw err;
//  console.log(row);
//});
app.listen(port, console.log('Listening on port:', port));
//db.close();
