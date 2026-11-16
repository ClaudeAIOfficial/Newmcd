# McDonald's guest feedback on Vercel

## Deploy the ZIP

1. Sign in to [Vercel Drop](https://vercel.com/drop) and drag the ZIP onto the page. Vercel builds the Next.js app. You can open the homepage as soon as the deployment finishes.
2. To turn on review submissions, use the project’s **Storage** tab to create or connect **Neon Postgres**. Connect it to this project’s **Production** environment. If you also use Preview, connect a separate preview database for test reviews. The integration supplies the server-only `DATABASE_URL` variable.
3. In **Deployments**, redeploy the project after connecting the database. The build creates the reviews table automatically. Click **Write a review** to see the receipt-number step.

If you already use PostgreSQL, you can set `DATABASE_URL` under the project’s **Settings → Environment Variables** and redeploy. Use a pooled connection string with the TLS settings supplied by your provider. The initial build needs permission to create a table and index in the public schema.

## Deploy through GitHub

Put the extracted files at your repository root. Import the repository into Vercel and select the **Next.js** preset. If you put the files in a subfolder, select that folder as the **Root Directory**. The folder must contain `package.json` and `vercel.json`. The ZIP supplies the install command, build command, Node.js version, and output directory. Connect Postgres and redeploy as described above.

## Custom domain

In your Vercel project, open **Settings → Domains**, add `mcdonalds.feedback`, and use the DNS values Vercel displays for that project. Earlier DNS instructions for the ChatGPT-hosted copy point to a different host.

## Review submissions

The form requires a receipt number, a rating from 1 to 5, and a comment. It validates the receipt number's format and discards the number. It does not query a point-of-sale system. Submissions stay in Postgres across deployments. Opening the homepage works before storage setup. The form shows a paused message until the database is ready.

To publish a review, open `public.reviews` in the database table editor and set `published` to `true` on the chosen row. Refresh the homepage to see it. To add a review supplied separately, create a row with `rating` and `review_text`, and set `published` to `true`. The database supplies the ID and timestamp.

## Run locally

Use Node.js 24 and run `npm ci`. Copy `.env.example` to `.env.local` and enter the connection string for your development database. Run `npm run db:init`, then `npm run dev`. Open http://localhost:3000. For a production build, use `npm run build` and `npm start`.
