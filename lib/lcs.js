/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.compare = compare;
exports.reduce = reduce;

var REMOVE, RIGHT, ADD, DOWN, SKIP;

REMOVE = RIGHT = -1;
ADD = DOWN = 1;
SKIP = 0;

exports.REMOVE = REMOVE;
exports.RIGHT = RIGHT;
exports.ADD = ADD;
exports.DOWN = DOWN;
exports.EQUAL = SKIP;

var skip = { value: 1, type: SKIP };

/**
 * Create an lcs comparison matrix describing the differences
 * between two array-like sequences
 * @param {array} a array-like
 * @param {array b array-like
 * @returns {{prefix:number, matrix:array<array>, suffix:number}}
 */
function compare(a, b) {
	var cols = a.length;
	var rows = b.length;

	var prefix = findPrefix(a, b);
	var suffix, remove;
	if(prefix === cols || prefix === rows) {
		suffix = 0;
	} else {
		suffix = findSuffix(a, b);
	}

	remove = suffix+prefix;
	cols -= remove;
	rows -= remove;
	var matrix = createMatrix(cols, rows);

	for (var j = cols - 1; j >= 0; --j) {
		for (var i = rows - 1; i >= 0; --i) {
			matrix[i][j] = backtrack(matrix, a, b, prefix, j, i);
		}
	}

	return {
		prefix: prefix,
		matrix: matrix,
		suffix: suffix
	};
}

/**
 * Reduce a set of lcs changes previously created using compare
 * @param {function(result:*, change:object, i:number, j:number)} f reducer function
 * @param {*} r initial value
 * @param {{prefix:number, matrix:array<array>, suffix:number}} lcs results
 *   created by compare()
 * @returns {*}
 */
function reduce(f, r, lcs) {
	var i, j, k, op;

	// Reduce shared prefix
	var l = lcs.prefix;
	for(i = 0;i < l; ++i) {
		r = f(r, skip, i, i);
	}

	// Reduce longest change span
	k = i;
	l = lcs.matrix.length;
	i = 0;
	j = 0;
	while(i < l) {
		op = lcs.matrix[i][j];
		r = f(r, op, i+k, j+k);

		switch(op.type) {
			case SKIP:  ++i; ++j; break;
			case RIGHT: ++j; break;
			case DOWN:  ++i; break;
		}
	}

	// Reduce shared suffix
	i += k;
	j += k;
	l = lcs.suffix;
	for(k = 0;k < l; ++k) {
		r = f(r, skip, i+k, j+k);
	}

	return r;
}

function findPrefix(a, b) {
	var i = 0;
	var l = Math.min(a.length, b.length);
	while(i < l && a[i] === b[i]) {
		++i;
	}
	return i;
}

function findSuffix(a, b) {
	var al = a.length-1;
	var bl = b.length-1;
	var l = Math.min(al, bl);
	for(var i = 0; i < l; ++i) {
		if(a[al-i] !== b[bl-i]) {
			break;
		}
	}

	return i;
}

function backtrack(matrix, a, b, start, j, i) {
	if (a[j+start] === b[i+start]) {
		return { value: matrix[i + 1][j + 1].value, type: SKIP };
	}
	if (matrix[i][j + 1].value < matrix[i + 1][j].value) {
		return { value: matrix[i][j + 1].value + 1, type: RIGHT };
	}

	return { value: matrix[i + 1][j].value + 1, type: DOWN };
}

function createMatrix (cols, rows) {
	var m = [], i, j, lastrow;

	// Fill the last row
	lastrow = m[rows] = [];
	for (j = 0; j<cols; ++j) {
		lastrow[j] = { value: cols - j, type: RIGHT };
	}

	// Fill the last col
	for (i = 0; i<rows; ++i) {
		m[i] = [];
		m[i][cols] = { value: rows - i, type: DOWN };
	}

	// Fill the last cell
	m[rows][cols] = { value: 0, type: SKIP };

	return m;
}
