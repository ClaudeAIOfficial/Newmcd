# McDonald’s guest feedback on Vercel

## Deploy

Import this repository into Vercel or upload the ZIP to [Vercel Drop](https://vercel.com/drop). Use the folder containing `package.json` as the project root. Vercel builds the project with the supplied Next.js settings.

The existing production project uses its private Vercel Blob store for reviews. To run another copy, create a **private Blob store** under the new Vercel project’s **Storage** tab, connect it to **Production**, and redeploy. The connection supplies the server-only `BLOB_READ_WRITE_TOKEN`. A project without review storage can display the homepage.

## Collect and publish reviews

Guests enter a receipt number, a star rating, and a comment. The server checks the receipt format and discards the number. Each submission goes into a separate private JSON file under `pending/`.

To publish selected reviews, use the Blob store dashboard to create or update `published/reviews.json`. Its contents are a JSON array. Append the approved pending object (fields `id`, `rating`, `text`, and `date`) to the array and upload it to that path. Keep existing approved entries when editing. The order of the array determines the order on the page. An empty list is `[]`. The public API reads this curated list only.

## Optional PostgreSQL storage

Projects with a configured `DATABASE_URL` use PostgreSQL as their review store. The build creates `public.reviews` when the variable is set. New submissions start with `published` set to false. Set it to true in your database editor to publish a row. Choose one store for ongoing use. Changing the provider requires moving any reviews you want to keep displaying.

## Custom domain

Add the domain in the Vercel project’s **Settings → Domains** and use the DNS values Vercel gives for that project.

## Local development

Use Node.js 24 and run `npm ci`. Copy `.env.example` to `.env.local` and configure a development store. For PostgreSQL, run `npm run db:init`. Start the development server with `npm run dev` and open http://localhost:3000. Use `npm run build` and `npm start` to test the production build.
