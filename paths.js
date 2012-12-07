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
  '/savedir': {
    'method': 'post',
    'route': 'savedir'
  },
  '/proxy': {
    'method': 'post',
    'route': 'proxy'
  },
  '/search': {
    'method': 'post',
    'route': 'search'
  }
}

module.exports = paths;
