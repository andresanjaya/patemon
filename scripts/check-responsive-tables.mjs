// Run with Chrome --remote-debugging-port=9222 and pnpm dev.
// BASE_URL=http://localhost:3000 node scripts/check-responsive-tables.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

function audit(directory) {
  let count = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      count += audit(file);
      continue;
    }
    if (
      !file.endsWith(".tsx") ||
      file.endsWith(`${path.sep}ui${path.sep}table.tsx`)
    )
      continue;
    const source = ts.createSourceFile(
      file,
      fs.readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX
    );
    function visit(node, inTable = false) {
      if (ts.isJsxElement(node)) {
        const opening = node.openingElement;
        const tag = opening.tagName.getText(source);
        if (tag === "table") {
          count++;
          inTable = true;
          assert(
            opening.getText(source).includes("table-responsive"),
            `${file}: missing responsive table`
          );
          assert(
            node.parent.openingElement
              ?.getText(source)
              .includes("table-responsive-wrapper"),
            `${file}: missing container`
          );
        }
        if (inTable && tag === "td") {
          assert(
            opening.attributes.properties.some((p) =>
              ["data-label", "colSpan"].includes(p.name?.getText(source))
            ),
            `${file}: unlabeled cell`
          );
        }
        if (inTable) {
          assert(
            !/truncate|line-clamp-|whitespace-nowrap|overflow-x-auto/.test(
              opening.getText(source)
            ),
            `${file}: clipped table content`
          );
        }
      }
      ts.forEachChild(node, (child) => visit(child, inTable));
    }
    visit(source);
  }
  return count;
}

async function main() {
  console.log(
    `Source audit: ${audit(path.join(import.meta.dirname, "../src"))} tables`
  );
  const tabs = await (await fetch("http://127.0.0.1:9222/json/list")).json();
  const socket = new WebSocket(
    tabs.find((t) => t.type === "page").webSocketDebuggerUrl
  );
  await new Promise((resolve) =>
    socket.addEventListener("open", resolve, { once: true })
  );
  let id = 0;
  const pending = new Map();
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(message.error);
    else request.resolve(message.result);
  };
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });
  const evaluate = async (expression) => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const base = process.env.BASE_URL || "http://localhost:3000";
  try {
    for (const width of [390, 768, 1440]) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height: 1000,
        deviceScaleFactor: 1,
        mobile: false,
      });
      for (const route of [
        "/pricing",
        "/workspace/demo/tasks",
        "/workspace/demo/banten",
        "/workspace/demo/budget",
        "/workspace/demo/vendors",
        "/workspace/demo/ceremonies",
        "/workspace/demo/guests",
        "/workspace/demo/rundown",
      ]) {
        await send("Page.navigate", { url: base + route });
        await new Promise((resolve) => setTimeout(resolve, 3500));
        await evaluate(`(() => {
          const button = [...document.querySelectorAll('button')].find(button => button.title === 'Tampilan Tabel' || button.textContent.trim() === 'Tabel');
          button?.click();
        })()`);
        await evaluate(`new Promise((resolve, reject) => {
          const start = Date.now();
          const check = () => {
            if (document.querySelector('table tbody td')) return resolve();
            [...document.querySelectorAll('button')].find(button => button.title === 'Tampilan Tabel' || button.textContent.trim() === 'Tabel')?.click();
            if (Date.now() - start > 30000) return reject(Error('Table missing: ' + location.pathname));
            setTimeout(check, 200);
          };
          check();
        })`);
        const state = await evaluate(`(() => {
          const tables = [...document.querySelectorAll('table')];
          const issues = [];
          const audit = () => {
            for (const table of tables) {
              if (table.scrollWidth > table.clientWidth + 1 || table.parentElement.scrollWidth > table.parentElement.clientWidth + 1) issues.push('Table/container overflow');
              for (const cell of table.querySelectorAll('td')) {
                if (cell.colSpan === 1 && !cell.dataset.label) issues.push('Missing label');
                if (getComputedStyle(cell).display === 'block' && cell.dataset.label && getComputedStyle(cell, '::before').content === 'none') issues.push('Missing visible label');
              }
              for (const element of table.querySelectorAll('td, td *:not(svg, svg *)')) {
                const style = getComputedStyle(element);
                if (element.clientWidth && element.scrollWidth > element.clientWidth + 1) issues.push('Content overflow: ' + element.tagName + '.' + element.className);
                if (element.clientHeight && element.scrollHeight > element.clientHeight + 2 && ['hidden','clip'].includes(style.overflowY)) issues.push('Clipped height');
                if (style.webkitLineClamp !== 'none' && style.webkitLineClamp !== '' && style.webkitLineClamp !== 'unset') issues.push('Clamped text');
              }
            }
          };
          audit();
          // Stress long names, URLs, notes, and badges without changing app data.
          const cell = tables[0].querySelector('tbody td');
          const sample = document.createElement('p');
          sample.className = 'line-clamp-1 truncate';
          sample.textContent = 'Catatan lengkap '.repeat(30) + 'https://example.test/' + 'alamatpanjang'.repeat(20);
          cell.append(sample);
          audit();
          sample.remove();
          return { path: location.pathname, pageOverflow: document.documentElement.scrollWidth > innerWidth + 1, tables: tables.length, issues: [...new Set(issues)], layout: getComputedStyle(cell).display };
        })()`);
        assert.equal(state.path, route);
        assert(!state.pageOverflow, `${width} ${route}: page overflow`);
        assert.deepEqual(state.issues, [], `${width} ${route}`);
        console.log(JSON.stringify({ width, route, ...state }));
      }
    }
  } finally {
    socket.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
