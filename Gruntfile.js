module.exports = function (grunt) {
	grunt.initConfig({
		concat: {
			node: {
				src: [
					"src/intro.js",
					"src/exports.js",
					"src/middle.js",
					"src/toc.util.js",
					"src/require-structure.js",
					"src/toc.fsm.js",
					"src/toc.grammar.js",
					"src/toc.re.js",
					"src/outro.js",
				],
				dest: "lib/node/toc.js",
			},
			browser: {
				src: [
					"src/intro.js",
					"src/exports.js",
					"src/middle.js",
					"src/toc.util.js",
					"node_modules/structure.js/lib/inline-hashtable.js",
					"src/after-inline-hashtable.js",
					"src/toc.fsm.js",
					"src/toc.grammar.js",
					"src/toc.re.js",
					"src/outro.js",
				],
				dest: "lib/browser/toc.js",
			},
		},

		jshint: {
			all: [
				"src/exports.js",
				"src/toc.util.js",
				"src/toc.fsm.js",
				"src/toc.grammar.js",
				"src/toc.re.js",
				"test/*.js",
				"benchmarks/*.js",
			],
		},

		uglify: {
			node: {
				src: ["lib/node/toc.js"],
				dest: "lib/node/toc.min.js",
			},
			browser: {
				src: ["lib/browser/toc.js"],
				dest: "lib/browser/toc.min.js",
			},
		},

		jsvalidate: {
			files: [
				"src/exports.js",
				"src/toc.util.js",
				"src/toc.fsm.js",
				"src/toc.grammar.js",
				"src/toc.re.js",
				"test/*.js",
				"benchmarks/*.js",
			],
		},

		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				immed: true,
				latedef: true,
				indent: 2,
				newcap: true,
				noarg: true,
				noempty: true,
				nonew: true,
				quotmark: "single",
				undef: true,
				unused: true,
				trailing: true,
				maxlen: 100,
			},
			globals: {
				console: true,
				require: true,
				define: true,
				requirejs: true,
				describe: true,
				expect: true,
				it: true,
			},
		},
	});
	grunt.loadNpmTasks("grunt-jsvalidate");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.registerTask("default", ["jsvalidate", "jshint", "concat", "uglify"]);


};
