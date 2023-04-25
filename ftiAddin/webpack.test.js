const path = require('path');
const RemoveEmptyScriptsPlugin = require('webpack-remove-empty-scripts');
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const config = require('./src/app/config.json');
const ESLintPlugin = require('eslint-webpack-plugin');

/**
 * Removes "dev" element of the config tree on production build
 * 
 * @param {Buffer} content content of file
 * @param {string} path path to file
 */
const transform = function (content, path) {
    let addinName = 'fuel transaction import';
    let config = JSON.parse(content);
    let host = config.dev.dist.host;
    let len = config.items.length;
    config.name = addinName;
    // Appending the host to all item's url and icon
    for(let i=0;i<len;i++){
        config.items[i].url = host + config.version + '/' + config.items[i].url;
        // config.items[i].icon = host + config.version + '/' + config.items[i].icon; 
        config.items[i].svgIcon = host + config.version + '/' + config.items[i].svgIcon; 
        config.items[i].menuName.en = addinName;
    }

    delete config['dev'];
    delete config['prod'];
    let response = JSON.stringify(config, null, 2);
    // Returned string is written to file
    return response;
}

module.exports = merge(common, {
    mode: 'none',
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
                            publicPath: config.dev.dist.host + config.version + '/'
                        }
                    },
                    'css-loader',
                    {
                        loader: './src/.dev/loaders/css-sandbox/css-sandbox.js',
                        options: { prefix: '#ftiAddin' }
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
                type: 'asset/resource'
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
              })
        ]
    },
    plugins: [
        new ESLintPlugin({
            extensions: ['js'],
            exclude: ['/node_modules/', '/\.dev/'],
            formatter: 'stylish'
        }),
        new RemoveEmptyScriptsPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                { from: './src/app/images/icon.svg', to: 'images/' },
                { from: './src/app/config.json', transform: transform },
                { from: './src/app/translations/', to: 'translations/' }
            ]
        }) 
    ],
    output: {
        publicPath: config.dev.dist.host + config.version + '/'
    }
});