function sudoku_solver() {
	var C = [], R = []
	{ // generate the sparse representation of the binary matrix
		var i, j, r, c, c2
		for (i = r = 0; i < 9; ++i) // generate c[729][4]
			for (j = 0; j < 9; ++j)
				for (k = 0; k < 9; ++k)
					// the 4 numbers correspond to row-col, box-num, row-num and col-num constraints
					C[r++] = [ 9 * i + j, (Math.floor(i/3)*3 + Math.floor(j/3)) * 9 + k + 81, 9 * i + k + 162, 9 * j + k + 243 ]
		for (c = 0; c < 324; ++c) R[c] = []
		for (r = 0; r < 729; ++r) // generate r[][] from c[][]
			for (c2 = 0; c2 < 4; ++c2)
				R[C[r][c2]].push(r)
	}

	// update the state vectors when we pick up choice r; v=1 for setting choice; v=-1 for reverting
	function sd_update(sr, sc, r, v) {
		var min = 10, min_c = 0;
		for (var c2 = 0; c2 < 4; ++c2) sc[C[r][c2]] += v<<7;
		for (var c2 = 0; c2 < 4; ++c2) { // update # available choices
			var r2, rr, cc2, c = C[r][c2];
			if (v > 0) { // move forward
				for (r2 = 0; r2 < 9; ++r2) {
					if (sr[rr = R[c][r2]]++ != 0) continue; // update the row status
					for (cc2 = 0; cc2 < 4; ++cc2) {
						var cc = C[rr][cc2];
						if (--sc[cc] < min) // update # allowed choices
							min = sc[cc], min_c = cc; // register the minimum number
					}
				}
			} else { // revert
				for (r2 = 0; r2 < 9; ++r2) {
					if (--sr[rr = R[c][r2]] != 0) continue; // update the row status
					var p = C[rr]
					++sc[p[0]]; ++sc[p[1]]; ++sc[p[2]]; ++sc[p[3]]; // update the count array
				}
			}
		}
		return min<<16 | min_c // return the col that has been modified and with the minimal available choices
	}

	// solve a Sudoku; _s is the standard dot/number representation; max_ret sets the maximum number of returned solutions
	return function(_s, max_ret) {
		var r, c, r2, min, cand, dir, hints = 0; // dir=1: forward; dir=-1: backtrack
		// sr[r]: # times the row is forbidden by others; cr[i]: row chosen at step i
		// sc[c]: bit 1-7 - # allowed choices; bit 8: the constraint has been used or not
		// cc[i]: col chosen at step i
		var sr = [], sc = [], cr = [], cc = [], out = [], ret = []; 
		if (max_ret == null) max_ret = 2;
		for (r = 0; r < 729; ++r) sr[r] = 0; // no row is forbidden
		for (c = 0; c < 324; ++c) sc[c] = 9; // 9 allowed choices; no constraint has been used
		for (var i = 0; i < 81; ++i) {
			var a = _s.charAt(i) >= '1' && _s.charAt(i) <= '9'? _s.charCodeAt(i) - 49 : -1; // number from -1 to 8
			if (a >= 0) sd_update(sr, sc, i * 9 + a, 1); // set the choice
			if (a >= 0) ++hints; // count the number of hints
			cr[i] = cc[i] = -1, out[i] = a + 1;
		}
		for (var i = 0, dir = 1, cand = 10<<16|0;;) {
			while (i >= 0 && i < 81 - hints) { // at most 81-hints steps
				if (dir == 1) {
					min = cand>>16, cc[i] = cand&0xffff
					if (min > 1) {
						for (c = 0; c < 324; ++c) {
							if (sc[c] < min) {
								min = sc[c], cc[i] = c; // choose the top constraint
								if (min <= 1) break; // this is for acceleration; slower without this line
							}
						}
					}
					if (min == 0 || min == 10) cr[i--] = dir = -1; // backtrack
				}
				c = cc[i];
				if (dir == -1 && cr[i] >= 0) sd_update(sr, sc, R[c][cr[i]], -1); // revert the choice
				for (r2 = cr[i] + 1; r2 < 9; ++r2) // search for the choice to make
					if (sr[R[c][r2]] == 0) break; // found if the state equals 0
				if (r2 < 9) {
					cand = sd_update(sr, sc, R[c][r2], 1); // set the choice
					cr[i++] = r2; dir = 1; // moving forward
				} else cr[i--] = dir = -1; // backtrack
			}
			if (i < 0) break;
			var y = []
			for (var j = 0; j < 81; ++j) y[j] = out[j]
			for (var j = 0; j < i; ++j) r = R[cc[j]][cr[j]], y[Math.floor(r/9)] = r%9 + 1; // the solution array (81 numbers)
			ret.push(y)
			if (ret.length >= max_ret) return ret;
			--i; dir = -1; // backtrack
		}
		return ret;
	}
}

/*
var solver = sudoku_solver()
var solstr, solarr = solver('..............3.85..1.2.......5.7.....4...1...9.......5......73..2.1........4...9', 2)
for (var i = 0; i < solarr.length; ++i) {
	solstr += solarr[i].join('') + '\n'
}
alert(solstr)
*/