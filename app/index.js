
'use strict';

// Modules
var path          = require('path');
var express       = require('express');
var favicon       = require('serve-favicon');
var logger        = require('morgan');
var cookie_parser = require('cookie-parser');
var body_parser   = require('body-parser');
var moment        = require('moment');
var validator     = require('validator');
var extend        = require('extend');
var hogan         = require('hogan-express');
var session       = require('express-session');
var raneto        = require('raneto-core');
var i18n          = require('i18n');

function initialize (config) {

  // Load Translations
  if (!config.locale) { config.locale = 'en'; }
  config.lang = require('./translations/' + config.locale + '.json');

  // Setup config
  extend(raneto.config, config);

  // Load Files
  var authenticate          = require('./middleware/authenticate.js')      (config);
  var error_handler         = require('./middleware/error_handler.js')     (config);
  var route_login           = require('./routes/login.route.js')           (config);
  var route_login_page      = require('./routes/login_page.route.js')      (config);
  var route_logout          = require('./routes/logout.route.js');
  var route_page_edit       = require('./routes/page.edit.route.js')       (config, raneto);
  var route_page_delete     = require('./routes/page.delete.route.js')     (config, raneto);
  var route_page_create     = require('./routes/page.create.route.js')     (config, raneto);
  var route_category_create = require('./routes/category.create.route.js') (config, raneto);
  var route_search          = require('./routes/search.route.js')          (config, raneto);
  var route_home            = require('./routes/home.route.js')            (config, raneto);
  var route_wildcard        = require('./routes/wildcard.route.js')        (config, raneto);

  // New Express App
  var app = express();

  // Setup Port
  app.set('port', process.env.PORT || 3000);

  // set locale as date and time format
  moment.locale(config.locale);

  // Setup Views
  if (!config.theme_dir)  { config.theme_dir  = path.join(__dirname, '..', 'themes'); }
  if (!config.theme_name) { config.theme_name = 'default'; }
  app.set('views', path.join(config.theme_dir, config.theme_name, 'templates'));
  app.set('layout', 'layout');
  app.set('view engine', 'html');
  app.enable('view cache');
  app.engine('html', hogan);

  // Setup Express
  app.use(favicon(config.public_dir + '/favicon.ico'));
  app.use(logger('dev'));
  app.use(body_parser.json());
  app.use(body_parser.urlencoded({ extended : false }));
  app.use(cookie_parser());
  app.use(express.static(config.public_dir));

  // Configure image static routes for each language
  app.use(config.image_url, express.static(path.normalize(path.join(config.content_dir, (config.default_lang_path||''), config.image_url))));
  for (var i = 0; i < config.lang_paths.length; i++) {
      var lang = config.lang_paths[i];
      app.use("/" + lang + config.image_url, express.static(path.normalize(path.join(config.content_dir, lang, config.image_url))));
  }
  
  app.use('/translations',  express.static(path.normalize(__dirname + '/translations')));

  // HTTP Authentication
  if (config.authentication === true) {
    app.use(session({
      secret            : 'changeme',
      name              : 'raneto.sid',
      resave            : false,
      saveUninitialized : false
    }));
    app.post('/rn-login', route_login);
    app.get('/login',     route_login_page);
    app.get('/logout',    route_logout);
  }

  // Online Editor Routes
  if (config.allow_editing === true) {
    app.post('/rn-edit',         authenticate, route_page_edit);
    app.post('/rn-delete',       authenticate, route_page_delete);
    app.post('/rn-add-page',     authenticate, route_page_create);
    app.post('/rn-add-category', authenticate, route_category_create);
  }

  // Setup i18n
  if (!config.locales_dir)  { config.locales_dir  = path.join(__dirname, '..', 'locales'); }
  i18n.configure({
      locales: config.lang_paths,
      directory: config.locales_dir
  });

  config.getBoundi18n = function(lang) {
    if (!lang) {
      lang = i18n.getLocale();
    } else {
      lang = lang.split("/")[0];  // Remove path separator if any
    }

    var boundLang = {
      locale: lang,
      phrase: undefined,
    };

    function translate(text) {
      boundLang.phrase = text;
      return i18n.__(boundLang);
    }

    // When passed to response.render exposes a template function.
    // {{#literal}}Some text{{/literal}}
    function literal() {
      return function(text, render) {
        return translate(text);
      }
    }

    return {
      literal,
      __: translate
    };
  }

  app.get(/^([^.]*)/, route_search, route_home, route_wildcard);

  // Handle Errors
  app.use(error_handler);

  return app;

}

// Exports
module.exports = initialize;
