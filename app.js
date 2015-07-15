var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    favicon = require('static-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    _s = require('underscore.string'),
    moment = require('moment'),
    marked = require('marked'),
    validator = require('validator'),
    extend = require('extend'),
    raneto = require('raneto-core'),
    config = require('./config'),
    i18n = require("i18n"),
    app = express();

// Setup views
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.set('view engine', 'html');
app.enable('view cache');
app.engine('html', require('hogan-express'));

// Setup Express
app.use(favicon(__dirname +'/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Setup config
extend(raneto.config, config);

i18n.configure({
    locales:config.lang_paths,
    directory: __dirname + '/locales'
});

// Handle all requests
app.all('*', function(req, res, next) {
    var slug = req.params[0];

    var lang = raneto.getLangPrefix(slug, true);
    if (lang != "") {
        i18n.setLocale(lang.substring(0, lang.length-1));
    }

    var literal = function() { 
        return function(text, render) { return i18n.__(text); }; 
    }

    if(req.query.search){
        var searchQuery = validator.toString(validator.escape(_s.stripTags(req.query.search))).trim(),
            searchResults = raneto.doSearch(slug, searchQuery),
            pageListSearch = raneto.getPages(slug);

        return res.render('search', {
            config: config,
            pages: pageListSearch,
            search: searchQuery,
            searchResults: searchResults,
            body_class: 'page-search',
            root: '/' + raneto.getLangPrefix(slug, false),
            literal: literal
        });
    }
    else if(req.params[0]){
        var isHome = raneto.isHome(slug);
        if(isHome) slug = raneto.nromalizeHomeSlug(slug);

        var pageList = raneto.getPages(slug),
            filePath = raneto.mapPath(slug);
        if(!fs.existsSync(filePath)) filePath += '.md';

        if(isHome && !fs.existsSync(filePath)){
            return res.render('home', {
                config: config,
                pages: pageList,
                body_class: 'page-home',
                literal: literal
            });
        } else {
            fs.readFile(filePath, 'utf8', function(err, content) {
                if(err){
                    err.status = '404';
                    err.message = i18n.__('404');
                    return next(err);
                }

                // Process Markdown files
                if(path.extname(filePath) == '.md'){
                    // File info
                    var stat = fs.lstatSync(filePath);
                    // Meta
                    var meta = raneto.processMeta(content);
                    content = raneto.stripMeta(content);
                    if(!meta.title) meta.title = raneto.slugToTitle(filePath);
                    // Content
                    content = raneto.processVars(content);
                    var html = marked(content);

                    return res.render('page', {
                        config: config,
                        pages: pageList,
                        meta: meta,
                        content: html,
                        body_class: 'page-'+ raneto.cleanString(slug),
                        last_modified: moment(stat.mtime).format(i18n.__('Date Format')),
                        root: '/' + raneto.getLangPrefix(slug, false),
                        literal: literal
                    });
                } else {
                    // Serve static file
                    res.sendfile(filePath);
                }
            });
        }
    } else {
        next();
    }
});

// Handle any errors
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        config: config,
        status: err.status,
        message: err.message,
        error: {},
        body_class: 'page-error'
    });
});

module.exports = app;
