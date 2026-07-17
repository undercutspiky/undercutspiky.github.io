const purgecss = require('@fullhuman/postcss-purgecss')({
    content: [
        // Jekyll output directory
        './_site/**/*.html',
    ],
    defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
    whitelistPatterns: [/^.[^\.]*\.[^\. "']*/g]
});

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        ...(isProduction ? [require('cssnano')({ preset: 'default' }), purgecss] : [])
    ]
};
