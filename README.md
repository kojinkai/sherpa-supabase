# sherpa-supabase

A repository for the supabase edge functions used in the Sherpa project

## Installation

### Prerequisites

- Node.js (managed via nvm)
- npm
- Supabase CLI
- Deno (for local function development)

### Setup Steps

1. Use the current node version:

   ```bash
   nvm use
   ```

2. Install the node modules:

   ```bash
   npm install
   ```

3. Install Deno (if not already installed):

   ```bash
   # macOS
   brew install deno

   # Or using curl
   curl -fsSL https://deno.land/x/install/install.sh | sh
   ```

## Running the Supabase Function

### Environment Setup

Before running the function, you need to set up the required environment variables:

1. Create a `.env` file in the function directory:

   ```bash
   touch supabase/functions/refresh-ipo-calendar/.env
   ```

2. Add the following environment variables to that file:

   ```env
   FINNHUB_API_KEY=your_finnhub_api_key_here
   ```

   - **FINNHUB_API_KEY**: Get this from [Finnhub](https://finnhub.io/)

### Local Development

Running the dev command will spin up a Supabase stack locally. If you are developing new models in the counterpart sherpa-mono repo, you should ensure that the `.env` file for the database package has the local Supabase DB URL e.g. `postgresql://postgres:postgres@127.0.0.1:54322/postgres` so that your migrations run against the local instance and not production!

1. Start the local Supabase instance:

   ```bash
   pnpm dev
   ```

   or

   ```bash
   npm run dev
   ```

2. The function will be available at:

   ```
   http://127.0.0.1:54321/functions/v1/refresh-ipo-calendar
   ```

3. Get your local anon key:

   ```bash
   npx supabase status
   ```

   This will print the `anon key` to stdout, which you'll need for the Authorization header.

4. Test the function locally:
   ```bash
   curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/refresh-ipo-calendar' \
     --header 'Authorization: Bearer SUPABASE_ANON_KEY' \
     --header 'Content-Type: application/json'
   ```

### Production Deployment

#### Automated Deployment (Recommended)

There is a Github action in `.github/workflows` which will deploy the edge function to the production Supabase instance when any branch is merged to `main`. This is the preferred way of getting the edge function into production

#### Manual Deployment

If you absolutely have to manually deploy then you can use the following steps

1. Link your project (if not already linked):

   ```bash
   npx supabase link --project-ref your-project-ref
   ```

2. Deploy the function:

   ```bash
   npx supabase functions deploy refresh-ipo-calendar
   ```

3. Set environment variables in production:
   ```bash
   npx supabase secrets set FINNHUB_API_KEY=your_finnhub_api_key_here
   npx supabase secrets set SUPABASE_URL=your_supabase_project_url
   npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

### Function Details

The `refresh-ipo-calendar` function:

- Fetches IPO calendar data from Finnhub API for the next 6 months
- Upserts the data into the `IPOEvent` table in your Supabase database
- Uses the `name` field as the conflict resolution key
- Returns the updated data or an error response

### Useful Commands

- **View function logs**:

  ```bash
  npx supabase functions logs refresh-ipo-calendar
  ```

- **Invoke function remotely**:

  ```bash
  npx supabase functions invoke refresh-ipo-calendar
  ```

- **Stop local Supabase**:

  ```bash
  npx supabase stop
  ```

- **Reset local database**:
  ```bash
  npx supabase db reset
  ```
