const webpack = require('webpack');


module.exports = {
    entry: "./src/index.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    plugins: [
        new webpack.IgnorePlugin(/\.\/locale/)
    ]
};
