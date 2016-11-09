
'use strict';

// Modules
var path                           = require('path');
var fs                             = require('fs');
var moment                         = require('moment');
var marked                         = require('marked');
var remove_image_content_directory = require('../functions/remove_image_content_directory.js');

function route_wildcard (config, raneto) {
  return function (req, res, next) {

    // Skip if nothing matched the wildcard Regex
    if (!req.params[0]) { return next(); }

    var suffix = 'edit';
    var slug   = req.params[0];
    if (raneto.isHome(slug)) {
        slug = raneto.normalizeHomeSlug(slug);
    }

    var lang = raneto.getLangPrefix(slug, true);
    var i18n = config.getBoundi18n(lang);

    var file_path      = raneto.mapPath(slug);
    var file_path_orig = file_path;

    // Remove "/edit" suffix
    if (config.allow_editing !== false && file_path.indexOf(suffix, file_path.length - suffix.length) !== -1) {
      file_path = file_path.slice(0, - suffix.length - 1);
    }

    if (!fs.existsSync(file_path)) { file_path += '.md'; }

    fs.readFile(file_path, 'utf8', function (error, content) {

      if (error) {
        error.status = '404';
        error.message = config.lang.error['404'];
        return next(error);
      }

      // Process Markdown files
      if (path.extname(file_path) === '.md') {

        // File info
        var stat = fs.lstatSync(file_path);

        // Meta
        var meta = raneto.processMeta(content);
        if (!meta.title) { meta.title = raneto.slugToTitle(file_path); }

        // Content
        content = raneto.stripMeta(content);
        content = raneto.processVars(content, slug);

        var template = meta.template || 'page';
        var render   = template;

        // Check for "/edit" suffix
        if (config.allow_editing !== false && file_path_orig.indexOf(suffix, file_path_orig.length - suffix.length) !== -1) {

          // Edit Page
          if (config.authentication === true && !req.session.loggedIn) {
            res.redirect('/login');
            return;
          }
          render  = 'edit';
          content = content;

        } else {
          // Render the content
          var makedOptions = {langPrefix: ''};
          content = raneto.renderPage(content, makedOptions);
        }

        var page_list = remove_image_content_directory(config, raneto.getPages(slug));

        return res.render(render, {
          config        : config,
          pages         : page_list,
          meta          : meta,
          content       : content,
          body_class    : template + '-' + raneto.cleanString(slug),
          last_modified : moment(stat.mtime).format(i18n.__('Date Format')),
          lang          : config.lang,
          loggedIn      : (config.authentication ? req.session.loggedIn : false),
          root          : "/" + raneto.getLangPrefix(slug, false),
          literal       : i18n.literal
        });

      } else {
        // Serve static file
        res.sendfile(file_path);
      }

    });

  };
}

// Exports
module.exports = route_wildcard;
