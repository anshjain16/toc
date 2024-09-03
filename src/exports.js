if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
	module.exports = toc; // NodeJS
}

if (typeof exports !== "undefined" && typeof exports !== "function") {
	exports.toc = toc; // CommonJs
}

if (typeof define === "function" && define.amd) {
	define("toc", [], function () {
		return toc;
	}); // AMD
}

if (typeof window !== "undefined") {
	window.toc = toc; // <script>
}
