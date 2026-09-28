# Certificate generator

Next.js app that stores events in MongoDB, draws a name and certificate id onto a PNG template, and can email that PNG through SMTP.

## Flow

1. Create an event.
2. Upload a template image. It is stored as base64 on the event.
3. Place the name and certificate id.
4. Add participants from a CSV or by hand.
5. Download certificates, or send them from Email Settings.

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

Set `MONGODB_URI`. SMTP settings are saved on each event. The password stays in the database and is not returned to the browser; leave the password field blank to keep the saved one.

## Tests

- `npm test` runs Jest
- `npm run test:unit` runs `lib/__tests__`
- `npm run test:e2e` runs Playwright
