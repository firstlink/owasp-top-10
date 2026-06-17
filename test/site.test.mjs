import assert from "node:assert/strict";
import test from "node:test";

import { startServer } from "../server.mjs";

let server;
let baseUrl;

test.before(async () => {
  server = await startServer(0);
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
});

test("serves the home page", async () => {
  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/html/);
  assert.match(html, /Top 10 for Agentic Applications/);
  assert.match(html, /asi-grid-root/);
  assert.match(html, /assets\/site\.js/);
});

test("serves scenario index pages", async () => {
  const response = await fetch(`${baseUrl}/asi01.html`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /data-asi-id="ASI01"/);
  assert.match(html, /scenario-grid-root/);
  assert.match(html, /assets\/asi-data\.js/);
});

test("serves a scenario detail page", async () => {
  const response = await fetch(
    `${baseUrl}/scenario.html?asi=ASI01&scenario=asi01-support-refund`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /scenario-frame/);
  assert.match(html, /Attack View/);
  assert.match(html, /Defense View/);
});

test("serves interactive walkthrough data", async () => {
  const response = await fetch(
    `${baseUrl}/interactive.html?scenario=asi01-support-refund&view=attack`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /interactive-player\.js/);
  assert.match(html, /walkthrough-data\.js/);
});

test("serves shared assets", async () => {
  const response = await fetch(`${baseUrl}/assets/styles.css`);
  const css = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/css/);
  assert.match(css, /\.asi-grid/);
});
