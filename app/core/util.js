'use strict';

const util = require('util');

/**
 * Takes a clasic node function that accepts callback as last argument
 * and returns a function that returns promises
 */
function promisify (func) {
  const promisified = function () {
    const _self = this;
    const _arguments = arguments;

    return new Promise(function (resolve, reject) {
      function cb (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }

      const args = Array.prototype.slice.call(_arguments).concat(cb);
      func.apply(_self, args);
    });
  };

  return promisified;
}

// Since node 8 we can use util.promisify
exports.promisify = util.promisify ? util.promisify : promisify;
