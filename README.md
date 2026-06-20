# OWASP Agentic Security Site

This repo now runs as a small static website backed by the content in `/Users/firstlink/Documents/owasp/agentic-security`.

## Run locally

```bash
npm start
```

Then open the URL printed in the terminal. The server starts at `http://127.0.0.1:3000` and will automatically move to the next open port if `3000` is already in use.

## Run smoke tests

```bash
npm test
```

The test suite starts the local server on an ephemeral port and checks the home page, category page, scenario page, interactive walkthrough page, and shared CSS asset.

## Documentation

- ASI01 shared defense architecture: [agentic-security/ASI01_DEFENSE_VIEW.md](/Users/firstlink/Documents/owasp/agentic-security/ASI01_DEFENSE_VIEW.md)
