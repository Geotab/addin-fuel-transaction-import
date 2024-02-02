const path = require('path');
// const FixStyleOnlyEntriesPlugin = require('webpack-fix-style-only-entries');
// const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const config = require('./src/config/production/config.json');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

/**
 * Removes "dev" element of the config tree on production build
 * 
 * @param {Buffer} content content of file
 * @param {string} path path to file
 */
const transform = function (content, path) {
    let config = JSON.parse(content);
    let host = config.dev.dist.host;
    let len = config.items.length;
    // Appending the host to all item's url and icon
    for(let i=0;i<len;i++){
        config.items[i].url = host + config.items[i].url;
        config.items[i].icon = host + config.items[i].icon; 
    }

    delete config['dev'];
    let response = JSON.stringify(config, null, 2);
    // Returned string is written to file
    return response;
}

module.exports = merge(common, {
    mode:'production',
    entry: './src/app/index.js',
    module: {
        rules: [
            {
                test: /\.css$/,
                exclude: /\.dev/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            publicPath: config.dev.dist.host
                        }
                    },
                    'css-loader',
                    {
                        loader: './src/.dev/loaders/css-sandbox/css-sandbox.js',
                        options: { prefix: '#importFuelTransactions' }
                    }
                ]
            },
            {
                test: /\.js$/,
                exclude: [/node_modules/, /\.dev/],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                },
            },
            {
                test: /\.html$/,
                exclude: /\.dev/,
                use: [
                    {
                        loader: 'html-loader',
                        options: { minimize: true }
                    }
                ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                exclude: /\.dev/,
                use: [
                    'file-loader'
                ]
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserPlugin({
                test: /\.js(\?.*)?$/i
            }),
            new ImageMinimizerPlugin({
                minimizer: {
                    implementation: ImageMinimizerPlugin.imageminMinify,
                    options: {
                        // Lossless optimization with custom option
                        // Feel free to experiment with options for better result for you
                        plugins: [
                            ["gifsicle", { interlaced: true }],
                            ["jpegtran", { progressive: true }],
                            ["optipng", { optimizationLevel: 5 }],
                            // Svgo configuration here https://github.com/svg/svgo#configuration
                            [
                                "svgo",
                                {
                                    plugins: [
                                        {
                                            name: "preset-default",
                                            params: {
                                                overrides: {
                                                    removeViewBox: false,
                                                    addAttributesToSVGElement: {
                                                        params: {
                                                            attributes: [
                                                                { xmlns: "http://www.w3.org/2000/svg" },
                                                            ],
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    ],
                                },
                            ],
                        ],
                    },
                },
            }),
        ]
    }, 
    plugins: [
        new ESLintPlugin({
            extensions: ['js'],
            exclude: ['/node_modules/', '/\.dev/'],
            formatter: 'stylish'
        }),
        new RemoveEmptyScriptsPlugin(),
        // new HtmlWebpackPlugin({
        //     template: "./src/app/importFuelTransactions.html", //source html file
        //     filename: "importFuelTransactions.html" //dest filename in the dest folder
        // }),
        // new FixStyleOnlyEntriesPlugin(),
        new CopyWebpackPlugin({
            patterns: [    
                { from: './src/app/images/icon.svg', to: 'images/'},
                { 
                    from: './src/config/production/config.json',
                    transform: transform
                },
                { from: './src/app/translations/', to: 'translations/' },
                { from: './src/app/scripts/', to: 'scripts/'},
                { from: './src/app/styles/', to: 'styles/'},
                { from: './src/app/generic_fuel_card_csv_file_sample.csv', to: 'generic_fuel_card_csv_file_sample.csv'}
            ]}
        )
    ],
    output: {
        publicPath: config.dev.dist.host
    }
});