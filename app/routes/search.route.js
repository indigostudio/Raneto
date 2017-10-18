
'use strict';

// Modules
var validator                      = require('validator');
var _s                             = require('underscore.string');
var remove_image_content_directory = require('../functions/remove_image_content_directory.js');

function route_search (config, raneto) {
  return function (req, res, next) {

    // Skip if Search not present
    if (!req.query.search) { return next(); }

    var slug = req.params[0] || '/';

    var lang = raneto.getLangPrefix(slug, true);
    var i18n = config.getBoundi18n(lang);

    var searchQuery    = validator.toString(validator.escape(_s.stripTags(req.query.search))).trim();

    raneto
      .doSearch(slug, searchQuery)
      .then(function(searchResults) {
      var pageListSearch = remove_image_content_directory(config, raneto.getPages(slug));

      // TODO: Move to Raneto Core
      // Loop through Results and Extract Category
      searchResults.forEach(function (result) {
        result.category = null;
        var split = result.slug.split('/');
        if (split.length > 1) {
          result.category = split[0];
        }
      });
  
      res.render('search', {
        config        : config,
        pages         : pageListSearch,
        search        : searchQuery,
        searchResults : searchResults,
        body_class    : 'page-search',
        lang          : config.lang,
        loggedIn      : (config.authentication ? req.session.loggedIn : false),
        root          : config.base_url + "/" + raneto.getLangPrefix(slug, false),
        literal       : i18n.literal
      });
    })
    .catch(function (err) {
      if (!res.headersSent) {
        res.sendStatus(500);
      }
    });
  };
}

// Exports
module.exports = route_search;
