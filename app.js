// Global variables.
var rdb = {};
var tables = {
  'settings': 'id',
  'cache': 'cid',
  'movies': 'dir'
};


/**
 * Module dependencies.
 */
var express = require('express');
var routes = require('./routes/index');
var http = require('http');
var r = require('rethinkdb');
var path = require('path');
var paths = require('./paths');
var bodyParser = require('body-parser');

var app = express();
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(bodyParser());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Connect to database and make connection available as global var rdb.
 */
r.connect({host:'localhost', port:28015}, function(e, conn) {
  // Create the db if we don't have it (will not overwrite).
  r.dbCreate('imdb').run(conn);
  // Set to use imdb as database.
  conn.use('imdb');
  // rdb is now global connection.
  rdb = conn;
  // Set up all tables needed.
  for (var i in tables) {
    r.db('imdb').tableCreate(i, {primaryKey: tables[i]}).run(conn);
  }
});

// Cycle through paths and register them.
for (var i in paths) {
  var path = paths[i];
  // Should map to something like app.get('/index', routes.index);
  app[path.method](i, routes[path.route]);
}

// Start the server!
app.port = 3000;
http.createServer(app).listen(app.port, function(){
  console.log("Express server listening on port " + app.port);
});
