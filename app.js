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
var express = require('express')
  , routes = require('./routes/index')
  , http = require('http')
  , r = require('rethinkdb')
  , path = require('path')
  , paths = require('./paths');

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

/**
 * Connect to database and make connection available as global var rdb.
 *
 * Also set up tables if needed.
 */
r.connect({host:'localhost', port:28015}, function(conn) {
  // Create the db if we don't have it (will not overwrite).
  conn.run(r.dbCreate('imdb'));
  // Set to use imdb as database.
  conn.use('imdb');
  // rdb is now global connection.
  rdb = conn;
  // Set up all databases needed.
  for (var i in tables) {
    r.db('imdb').tableCreate({tableName: i, primaryKey: tables[i]}).run();
  }
});

// Cycle through paths and register them.
for (var i in paths) {
  var path = paths[i];
  // Should map to something like app.get('/index', routes.index);
  app[path.method](i, routes[path.route]);
}

// Start the server!
http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
