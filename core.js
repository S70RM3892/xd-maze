// Dimension-independent core. A maze is a spanning tree of the N-dimensional grid graph.
// open[i] bit k set = passage between cell i and the next cell along axis k.
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function createMaze(sizes, seed, algo) {
  const n = sizes.length, stride = [];
  let total = 1;
  for (let k = 0; k < n; k++) { stride.push(total); total *= sizes[k]; }
  const open = new Uint8Array(total), rnd = mulberry32(seed);
  const coord = (i, k) => Math.floor(i / stride[k]) % sizes[k];
  const inGrid = (i, k, s) => { const c = coord(i, k) + s; return c >= 0 && c < sizes[k]; };
  const canMove = (i, k, s) => inGrid(i, k, s) && (open[s > 0 ? i : i - stride[k]] >> k & 1) === 1;
  const carve = (i, k, s) => { open[s > 0 ? i : i - stride[k]] |= 1 << k; };
  const m = { n, sizes, stride, total, open, coord, canMove };
  const seen = new Uint8Array(total);

  if (algo === 'wilson') {
    // Loop-erased random walks: samples uniformly from all spanning trees.
    const dir = new Uint8Array(total);
    seen[Math.floor(rnd() * total)] = 1;
    for (let start = 0; start < total; start++) {
      let c = start;
      while (!seen[c]) {
        let d;
        do { d = Math.floor(rnd() * 2 * n); } while (!inGrid(c, d >> 1, d & 1 ? 1 : -1));
        dir[c] = d;
        c += (d & 1 ? 1 : -1) * stride[d >> 1];
      }
      c = start;
      while (!seen[c]) {
        const d = dir[c], k = d >> 1, s = d & 1 ? 1 : -1;
        seen[c] = 1; carve(c, k, s); c += s * stride[k];
      }
    }
  } else {
    // Randomized depth-first search with an explicit stack.
    const stack = [0], opts = [];
    seen[0] = 1;
    while (stack.length) {
      const c = stack[stack.length - 1];
      opts.length = 0;
      for (let d = 0; d < 2 * n; d++) {
        const k = d >> 1, s = d & 1 ? 1 : -1;
        if (inGrid(c, k, s) && !seen[c + s * stride[k]]) opts.push(d);
      }
      if (!opts.length) { stack.pop(); continue; }
      const d = opts[Math.floor(rnd() * opts.length)], k = d >> 1, s = d & 1 ? 1 : -1;
      carve(c, k, s); seen[c + s * stride[k]] = 1; stack.push(c + s * stride[k]);
    }
  }
  return m;
}
// Breadth-first search. Returns the list of cells from `from` to `to`, both included.
function shortestPath(m, from, to) {
  const prev = new Int32Array(m.total).fill(-1), queue = [from];
  prev[from] = from;
  for (let h = 0; h < queue.length; h++) {
    const c = queue[h];
    if (c === to) break;
    for (let k = 0; k < m.n; k++) for (const s of [-1, 1]) {
      const nb = c + s * m.stride[k];
      if (m.canMove(c, k, s) && prev[nb] < 0) { prev[nb] = c; queue.push(nb); }
    }
  }
  if (prev[to] < 0) return null;
  const path = [to];
  while (path[path.length - 1] !== from) path.push(prev[path[path.length - 1]]);
  return path.reverse();
}
