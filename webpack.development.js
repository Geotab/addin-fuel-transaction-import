const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = merge(common, {
    mode: 'development',
    entry: './src/.dev/index.js',
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.html$/,
                use: [
                    {
                        loader: 'html-loader',
                        options: { minimize: true }
                    }
                ]
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,  //2. Extract css into files
                    'css-loader'     //1. Turns css into commonjs
                ]
            },
            {
                test: /\.js$/,
                exclude: [/node_modules/],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                },
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                type: 'asset/resource'
            }
        ]
    },
    plugins: [
        new ESLintPlugin({
            extensions: ['js'],
            exclude: ['/node_modules/', '/\.dev/'],
            formatter: 'stylish'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: './src/app/images/icon.svg', to: 'images/' }
            ]
        })
    ],
    devServer: {
        static: {
            directory: path.join(__dirname)
        },
        devMiddleware: {
            index: 'importFuelTransactions.html'
        },
        compress: true,
        port: 9000,
        open: true
    }
});