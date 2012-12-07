
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Directory mapping', index: 'index' });
};
exports.list = function(req, res){
  res.render('index', { title: 'The list', index: 'list' });
};

