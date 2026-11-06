# Calder & Wren

A demonstration law-firm site with a front-desk chatbot. Visitors can ask what the firm handles, who the lawyers are, what a first conversation costs, and leave a message for a consultation.

The desk answers only from the firm profile in `src/lib/firm.ts`. It does not call a language model, so it will not invent legal advice, predict an outcome, or drift off the firm’s actual work. That is deliberate: a firm site should not freelance.

## Use it

- **Ask the desk** opens on every page. Try “I was fired,” “What does a consult cost?”, or “I need a divorce lawyer.”
- **Request a consultation** is the same intake as a form, if someone would rather not chat.
- A filed message gets a reference like `CW-7K2Q`. The firm replies within one business day in the story of the site. Nothing here creates an attorney-client relationship.

## Squarespace

The firm site can stay on Squarespace. This app is the desk, and Squarespace only loads it.

Open `/squarespace` on the published app and copy the snippet. Paste it into **Footer code injection** (Pages → Custom Code → Code Injection). That needs a Core, Plus, or Advanced plan, or a legacy plan that still includes code injection. Basic will not run it.

The button is drawn by `public/widget.js`. The conversation itself is `/embed`, an iframe on this app, so Squarespace’s CSS cannot restyle the chat and the page does not call the chat API itself. Squarespace blocks that kind of browser request.

A Code block on a single page can hold the iframe snippet from the same install page. Do not use an Embed block. Check the result in a private window. The Squarespace editor often hides injected code while you are logged in.

Practice and lawyer links inside an embedded answer open in a new tab, so the chat stays open on the Squarespace page.

Calder & Wren is sample content, not a law office. The phone number is fictional. The Rhode Island Bar referral number is real, and the desk uses it only when the firm does not take the work.

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

Consultation messages are stored in a `consultations` table.

- With `DATABASE_URL`, the app uses Postgres. Publishing this app can attach a database for that.
- Without `DATABASE_URL`, local development uses an in-memory database, so messages last only as long as that server process.

There is no public inbox. A message is confirmed to the person who sent it, and that is the only place it is shown.
