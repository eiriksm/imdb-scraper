var paths = {
  '/': {
    'method': 'get',
    'route': 'index'
  },
  '/list': {
    'method': 'get',
    'route': 'list'
  },
  '/getdirs': {
    'method': 'get',
    'route': 'getdirs'
  },
  '/exclude': {
    'method': 'post',
    'route': 'exclude'
  },
  '/proxy': {
    'method': 'post',
    'route': 'proxy'
  },
  '/search': {
    'method': 'post',
    'route': 'search'
  },
  '/test': {
    'method': 'get',
    'route': 'test'
  }
}

module.exports = paths;
