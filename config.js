var config = {

	// The base URL of your site (can use %base_url% in Markdown files)
	base_url: '',

	// Used for the "Get in touch" page footer link
	support_email: '',

	// Footer copyright content
	copyright: 'Copyright &copy; '+ new Date().getFullYear() +' - <a href="http://raneto.com">Powered by Raneto</a>',

	// Excerpt length (used in search)
	excerpt_length: 400,

	// The meta value by which to sort pages (value should be an integer)
	// If this option is blank pages will be sorted alphabetically
	page_sort_meta: 'sort',

	// Should categories be sorted numerically (true) or alphabetically (false)
	// If true category folders need to contain a "sort" file with an integer value
	category_sort: true,

	// The base URL of your images folder (can use %image_url% in Markdown files)
	image_url: '/images',

	// Specify the path of your content folder where all your '.md' files are located
	content_dir: './content/',

	// Slugs prefixes of root content directories to support separated content directories for 
	// multiple languages, place the language specific md files under a folder named as these roots
	lang_paths: ['en', 'ja'], 

	// lunr-languages ids
	lang_path_to_lunr: {en:'', ja:'jp'}, 

	// Default slug prefix, when there's no lang prefix we'll use this one; use '' to avoid languages completely
	default_lang_path: 'en',

	// Add your analytics tracking code (including script tags)
	analytics: ""

};

module.exports = config;
