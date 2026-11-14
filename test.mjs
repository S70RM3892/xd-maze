// Checks the maze core in core.js: every maze must be a spanning tree
// (cells - 1 passages, all cells reachable) in 2 to 6 dimensions.
// Run: node test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

const core = readFileSync(new URL("./core.js", import.meta.url), "utf8");
const { createMaze, shortestPath } = new Function(core + '; return { createMaze, shortestPath };')();

let count = 0;
for (const algo of ['dfs', 'wilson']) {
  for (const [n, s] of [[2, 16], [3, 8], [4, 6], [5, 4], [6, 3], [4, 2]]) {
    for (let seed = 1; seed <= 5; seed++) {
      const m = createMaze(Array(n).fill(s), seed, algo);
      let edges = 0;
      for (let i = 0; i < m.total; i++) for (let k = 0; k < n; k++) if (m.canMove(i, k, 1)) edges++;
      assert.strictEqual(edges, m.total - 1, `${algo} ${n}D: passage count`);
      for (let i = 0; i < m.total; i++) assert.ok(shortestPath(m, 0, i), `${algo} ${n}D: cell ${i} unreachable`);
      const again = createMaze(Array(n).fill(s), seed, algo);
      assert.deepStrictEqual(again.open, m.open, 'same seed gives the same maze');
      count++;
    }
  }
}
console.log(`ok: ${count} mazes are spanning trees`);
