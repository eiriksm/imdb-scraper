var rdb;
var r = require('rethinkdb');
// @todo. Make some fallback with this.
var unwritten = [];

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
  // Set up all databases needed.
});


/**
 * Function to write to database.
 *
 * @param str table
 *   The table to write information to.
 * @param obj obj
 *   The object to insert.
 */
var writedb = function(table, obj) {
   try {
    r.db('imdb').table(table).insert(obj).run(rdb);
   } catch(err) {
    // The database connection is most likely down.
    rdb.reconnect();
    unwritten.push(obj);
  }
}

/**
 * A constructor for a cache object.
 */
var Cache = function() {
  this.cid = '';
  this.data = {};
  this.expire = 0;
};

Cache.prototype.save = function(result) {
  // Write cache object to db.
  writedb('cache', this);
};

var film = function () {
  this.url = '';
  this.originalTitle = '';
  this.year = 0;
  this.title = '';
  this.countries = [];
  this.actors = [];
  this.runtime = '';
  this.directors = [];
  this.metaRating = 0;
  this.rating = 0;
  this.description = '';
  this.image = '';
  this.dir = '';
  this.genres = [];
  this.timestamp = parseInt(parseInt(new Date().getTime()) / 1000);
};

film.prototype.parse = function($) {
  var film = this;
  // Parse stuff with freakin jQuery!
  film.originalTitle = $('h1[itemprop="name"] span.title-extra').remove().text();
  // Get year of movie.
  film.year = $('h1[itemprop="name"] a').text();
  // Remove unnecessary stuff from the title.
  $('h1[itemprop="name"] span').remove();

  // Save title
  film.title = $('h1[itemprop="name"]').text();
  film.runtime = $('time[itemprop="duration"]').eq(0).text();
  $('a[href*="country"]').each(function(i,n) {
    film.countries.push($(n).text());
  });
  $('table.cast_list .name a').each(function(i,n) {
    // Save all actors in an array.
    film.actors.push({
      'id': $(n).attr('href'),
      'name': $(n).text()
    });
  });
  $('a[itemprop="director"]').each(function(i,n) {
    // Save all directors (most likely just one, though).
    film.directors.push({
      'id': $(n).attr('href'),
      'name': $(n).text()
    });
  });
  film.genres = [];
  $('a[itemprop="genre"]').each(function(i,n) {
    film.genres.push($(n).text());
  });
  film.image = $('img[itemprop="image"]').attr('src');
  film.rating = ($('.star-box-giga-star').text());
  film.metaRating = $('.star-box-details a[href="criticreviews"]').eq(1).text();
  // Save the p-tag with genre in a variable, since we will use it twice.
  $ptag = $('a[itemprop="genre"]').parent().parent().find('p');
  $ptag.remove('em');
  film.description = $ptag.text();
}

film.prototype.save = function() {
  writedb('movies', this);
}

exports.Cache = Cache;
exports.cache = Cache;
exports.writedb = writedb;
exports.film = film;
