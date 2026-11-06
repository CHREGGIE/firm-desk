# Ainsworth Gorkin desk

A test intake desk for [Ainsworth Gorkin](https://ainsworthgorkin.com), a Brooklyn firm for New York and New Jersey businesses. The firm's own site is on Squarespace. This app is the desk you paste onto it.

The desk qualifies a matter, asks for the company, the other side, the deadline, and the papers, and files a packet a lawyer can review. It answers only from `src/lib/firm.ts`. It does not call a language model, invent a fee, or say how a case comes out.

Open `/review` to read the queue. On a dev server the password is `desk-review`. On the published app it is the `REVIEW_PASSWORD` secret.

## Use it

- **Ask the desk** and try “A customer took the deposit and stopped answering,” “I was fired,” or “I got a foreclosure notice.”
- **Request a consultation** files the same kind of packet without the chat.
- A filed lead gets a reference like `AG-7K2Q` and a mark: ready, thin, or deadline. Nothing here hires the firm.

## Squarespace

ainsworthgorkin.com stays on Squarespace. This app is the desk.

Open `/squarespace` on the published app and copy the snippet. Paste it into **Footer code injection** (Pages → Custom Code → Code Injection). That needs a Core, Plus, or Advanced plan, or a legacy plan that still includes code injection. Basic will not run it.

The button is drawn by `public/widget.js`. The conversation itself is `/embed`, an iframe on this app, so Squarespace’s CSS cannot restyle the chat and the page does not call the chat API itself. Squarespace blocks that kind of browser request.

A Code block on a single page can hold the iframe snippet from the same install page. Do not use an Embed block. Check the result in a private window. The Squarespace editor often hides injected code while you are logged in.

Practice and lawyer links inside an embedded answer open in a new tab, so the chat stays open on the Squarespace page.

The phone, address, and practice list are taken from the firm's public site. The New York City Bar referral number is real, and the desk uses it only when the firm does not take the work.

## Make it your firm

Edit `src/lib/firm.ts`. The pages and the chatbot both read that file: name, practices, lawyers, fees, hours, and offices. Restart the dev server after you change it.

## Run locally

```bash
npm install
npm run dev
```

Then open the site on port **3847**.

```bash
npm test
npm run lint
```

## Where messages go

Leads and their files are stored in `leads` and `lead_files`.

- With `DATABASE_URL`, the app uses Postgres. Publishing this app can attach a database for that.
- Without `DATABASE_URL`, local development uses an in-memory database, so messages last only as long as that server process.

There is no public inbox. The person who sent a file sees the reference. Lawyers read the queue at `/review`.
