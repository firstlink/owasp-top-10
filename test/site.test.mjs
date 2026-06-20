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

test("serves the ASI07 category page", async () => {
  const response = await fetch(`${baseUrl}/asi07.html`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /data-asi-id="ASI07"/);
  assert.match(html, /Insecure Inter-Agent Communication/);
});

test("serves the ASI05 category page", async () => {
  const response = await fetch(`${baseUrl}/asi05.html`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /data-asi-id="ASI05"/);
  assert.match(html, /Unexpected Code Execution \(RCE\)/);
  assert.match(html, /scenario-grid-root/);
});

test("serves the ASI08 category page", async () => {
  const response = await fetch(`${baseUrl}/asi08.html`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /data-asi-id="ASI08"/);
  assert.match(html, /Cascading Failures/);
  assert.match(html, /scenario-grid-root/);
});

test("serves the ASI09 category page", async () => {
  const response = await fetch(`${baseUrl}/asi09.html`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /data-asi-id="ASI09"/);
  assert.match(html, /Human-Agent Trust Exploitation/);
  assert.match(html, /scenario-grid-root/);
});

test("serves the ASI10 category page", async () => {
  const response = await fetch(`${baseUrl}/asi10.html`);
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /data-asi-id="ASI10"/);
  assert.match(html, /Rogue Agents/);
  assert.match(html, /scenario-grid-root/);
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

test("serves the ASI01 defense scenario page", async () => {
  const response = await fetch(
    `${baseUrl}/scenario.html?asi=ASI01&scenario=asi01-shared-defense&view=defense`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /scenario-frame/);
  assert.match(html, /Defense Flow/);
});

test("serves an ASI05 scenario detail page", async () => {
  const response = await fetch(
    `${baseUrl}/scenario.html?asi=ASI05&scenario=asi05-self-healing-disaster`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /scenario-frame/);
  assert.match(html, /Attack View/);
  assert.match(html, /Defense View/);
});

test("serves an ASI08 scenario detail page", async () => {
  const response = await fetch(
    `${baseUrl}/scenario.html?asi=ASI08&scenario=asi08-financial-trading-cascade`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /scenario-frame/);
  assert.match(html, /Attack View/);
  assert.match(html, /Defense View/);
});

test("serves an ASI09 scenario detail page", async () => {
  const response = await fetch(
    `${baseUrl}/scenario.html?asi=ASI09&scenario=asi09-confident-invoice-fraud`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /scenario-frame/);
  assert.match(html, /Attack View/);
  assert.match(html, /Defense View/);
});

test("serves an ASI10 scenario detail page", async () => {
  const response = await fetch(
    `${baseUrl}/scenario.html?asi=ASI10&scenario=asi10-retail-returns-optimizer`
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

test("serves an ASI07 scenario detail page", async () => {
  const response = await fetch(
    `${baseUrl}/scenario.html?asi=ASI07&scenario=asi07-clinical-mitm`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /scenario-frame/);
  assert.match(html, /Attack View/);
  assert.match(html, /Defense View/);
});

test("serves ASI01 defense interactive walkthrough data", async () => {
  const response = await fetch(
    `${baseUrl}/interactive.html?scenario=asi01-shared-defense&view=defense`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /interactive-player\.js/);
  assert.match(html, /walkthrough-data\.js/);
});

test("serves ASI07 interactive walkthrough data", async () => {
  const response = await fetch(
    `${baseUrl}/interactive.html?scenario=asi07-payment-replay&view=attack`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /interactive-player\.js/);
  assert.match(html, /walkthrough-data\.js/);
});

test("serves ASI05 interactive walkthrough data", async () => {
  const response = await fetch(
    `${baseUrl}/interactive.html?scenario=asi05-self-healing-disaster&view=attack`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /interactive-player\.js/);
  assert.match(html, /walkthrough-data\.js/);
});

test("serves ASI08 interactive walkthrough data", async () => {
  const response = await fetch(
    `${baseUrl}/interactive.html?scenario=asi08-financial-trading-cascade&view=attack`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /interactive-player\.js/);
  assert.match(html, /walkthrough-data\.js/);
});

test("serves ASI09 interactive walkthrough data", async () => {
  const response = await fetch(
    `${baseUrl}/interactive.html?scenario=asi09-confident-invoice-fraud&view=attack`
  );
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /interactive-player\.js/);
  assert.match(html, /walkthrough-data\.js/);
});

test("serves ASI10 interactive walkthrough data", async () => {
  const response = await fetch(
    `${baseUrl}/interactive.html?scenario=asi10-enterprise-self-replication&view=attack`
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

test("ships ASI05 content in the shared data asset", async () => {
  const response = await fetch(`${baseUrl}/assets/asi-data.js`);
  const js = await response.text();

  assert.equal(response.status, 200);
  assert.match(js, /id: "ASI05"/);
  assert.match(js, /href: "\.\/asi05\.html"/);
  assert.match(js, /asi05-self-healing-disaster/);
  assert.match(js, /asi05-pharmacy-sql-injection/);
  assert.match(js, /asi05-retail-inventory-shell/);
});

test("ships ASI08 content in the shared data asset", async () => {
  const response = await fetch(`${baseUrl}/assets/asi-data.js`);
  const js = await response.text();

  assert.equal(response.status, 200);
  assert.match(js, /id: "ASI08"/);
  assert.match(js, /href: "\.\/asi08\.html"/);
  assert.match(js, /asi08-financial-trading-cascade/);
  assert.match(js, /asi08-retail-overstock-cascade/);
  assert.match(js, /asi08-diagnosis-cascade/);
});

test("ships ASI09 content in the shared data asset", async () => {
  const response = await fetch(`${baseUrl}/assets/asi-data.js`);
  const js = await response.text();

  assert.equal(response.status, 200);
  assert.match(js, /id: "ASI09"/);
  assert.match(js, /href: "\.\/asi09\.html"/);
  assert.match(js, /asi09-confident-invoice-fraud/);
  assert.match(js, /asi09-phantom-candidate/);
  assert.match(js, /asi09-medical-overconfidence/);
});

test("ships ASI10 content in the shared data asset", async () => {
  const response = await fetch(`${baseUrl}/assets/asi-data.js`);
  const js = await response.text();

  assert.equal(response.status, 200);
  assert.match(js, /id: "ASI10"/);
  assert.match(js, /href: "\.\/asi10\.html"/);
  assert.match(js, /asi10-retail-returns-optimizer/);
  assert.match(js, /asi10-enterprise-self-replication/);
  assert.match(js, /asi10-legal-compliance-gaming/);
});
