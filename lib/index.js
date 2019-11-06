'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FETCHR = undefined;
exports.default = fetchrCacheMiddleware;
exports.resetCacheData = resetCacheData;

var _lruCache = require('lru-cache');

var _lruCache2 = _interopRequireDefault(_lruCache);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
 * Action types
 */
var FETCHR = exports.FETCHR = 'EFFECT_FETCHR';

var cacheInstance = null;

/*
 * Factory Method for cache instance (singleton)
 */
function createCache() {
  var cacheConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (cacheInstance !== null) {
    return cacheInstance;
  }

  cacheInstance = (0, _lruCache2.default)(cacheConfig);
  return cacheInstance;
}

/*
 * Middleware
 */
function fetchrCacheMiddleware() {
  var cacheConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var cache = createCache(cacheConfig);
  var excludes = options.excludes,
      fromCache = options.fromCache,
      toCache = options.toCache,
      resetCache = options.resetCache;


  return function (_ref) {
    var dispatch = _ref.dispatch,
        getState = _ref.getState;
    return function (next) {
      return function (action) {
        if (action.type !== FETCHR) {
          return next(action);
        }

        var _action$payload = action.payload,
            type = _action$payload.type,
            resource = _action$payload.resource,
            params = _action$payload.params;


        if (resetCache && resetCache(action, getState())) {
          cache.reset();
        }

        if (type !== 'read' || excludes && excludes.indexOf(resource) !== -1) {
          return next(action);
        }

        var sortedParams = {};
        Object.keys(params).sort().forEach(function (key) {
          return sortedParams[key] = params[key];
        });

        var key = resource + '@@' + JSON.stringify(sortedParams);
        var cachedResult = (!fromCache || fromCache(action, getState())) && cache.get(key);
        if (cachedResult) {
          return Promise.resolve(cachedResult);
        }

        return next(action).then(function (result) {
          if (!toCache || toCache(action, getState())) {
            cache.set(key, result);
          }

          return result;
        });
      };
    };
  };
}

function resetCacheData() {
  var cache = createCache();
  cache.reset();
}