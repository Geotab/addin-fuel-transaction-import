/* xlsx.js (C) 2013-present SheetJS -- http://sheetjs.com */
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
export default {
	input: 'app.js',
	output: {
		file: 'rollup.js',
		format: 'iife'
	},
	entry: 'app.js',
	//dest: 'rollup.js',
	plugins: [
		resolve({
			module: false,
			browser: true,
		}),
		commonjs()
	],
	format: 'iife'
};
