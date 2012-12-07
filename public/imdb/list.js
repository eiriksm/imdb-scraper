$(document).ready(function() {
  $.each(dir_mapping, function(i,n) {
    $('#thelist').append(makeFilmRow(i,n));
  });
  $('.name a').live('click', function() {
    var id = $(this).attr('data-id');
    $('#modalheader').html($(this).text());
    var films = [];
    var dirs = [];
    $.each(dir_mapping, function(a,b) {
      $.each(b.actors, function(i,n) {
        if (n.id == id) {
          films.push('<a href="javascript:void(0);" class="clickablefilm" data-id="' + b.url + '">' + b.title + '</a>');
        }
      });
      $.each(b.directors, function(i,n) {
        if (n.id == id) {
          dirs.push('<a href="javascript:void(0);" class="clickablefilm" data-id="' + b.url + '">' + b.title + '</a>');
        }
      });
    });
    films = films.join(', ');
    dirs = dirs.join(', ');
    films = '<div><span class="label">Actor in</span>: ' + films + '</div>' +
            '<div><span class="label">Director in</span>: ' + dirs + '</div>';
    $('#modalbody').html(films);
    $('#themodal').modal();
  });
  $('.clickablefilm').live('click', function() {
    var id = $(this).attr('data-id');
    location.hash = id;
    $('#themodal').modal('hide');
  });
  $('.thumbnail img').live('click', function() {
    var src = $(this).attr('data-image');
    $(this).attr('src', src);
  });
});

var makeFilmRow = function(i,n) {
  var rowclass = 'even';
  if (i % 2 > 0) {
    rowclass = 'odd';
  }
  var actors = [];
  if (!n.actors) {
    n.actors = [];
  }
  $.each(n.actors, function(a,b) {
    actors.push('<a href="javascript:void(0);" data-id="' + b.id + '">' + b.name + '</a>');
  });
  actors = actors.join(', ');
  var directors  = [];
  $.each(n.directors, function(a,b) {
    directors.push('<a href="javascript:void(0);" data-id="' + b.id + '">' + b.name + '</a>');
  });
  directors = directors.join(', ');
  var countries = makeRowValues(n.countries);
  var genres  = makeRowValues(n.genres);
  return '<div class="film-row ' + rowclass + '">' +
          '<div class="hidden">' + n.url + '</div>' +
          '<div class="thumbnail"><img src="imdb/img.png" data-image="' + n.image + '" /></div>' +
          '<h1>' + n.title + '<small>(' + n.year + ')</small></h1>' +
          '<div class="actors name"><span class="label">Actors:</span> ' + actors + '</div>' +
          '<div class="direcors name"><span class="label">Directed by:</span> ' + directors + '</div>' +
          makeLabelDiv(n.runtime, "Runtime") +
          makeLabelDiv(n.rating, "Rating") +
          makeLabelDiv(n.metaRating, "Meta rating") +
          makeLabelDiv(genres, "Genre") +
          makeLabelDiv(countries, "Country") +
          makeLabelDiv(new Date(n.timestamp * 1000), "Last updated") +
          '<div class="clearfix"></div>' +
          '</div>';
}

var makeRowValues = function(values) {
  var vals = [];
  $.each(values, function(a,b) {
    vals.push(b);
  });
  return vals.join(', ');
}

var makeLabelDiv = function(html, label) {
  return '<div class="' + label.toLowerCase + '"><span class="label">' + label + ':</span> <span class="value">' + html + '</span></div>';
}
