import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
export default [
	// browser-friendly UMD build
	{
		input: 'src/main.js',
		output: {
			name: 'rollupGraphLink',
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			resolve({
				jsnext: true,
				main: true
			}), // so Rollup can find `ms`
			commonjs({
				include: 'node_modules/**',
				sourceMap: false
			}) // so Rollup can convert `ms` to an ES module
		]
	}
];