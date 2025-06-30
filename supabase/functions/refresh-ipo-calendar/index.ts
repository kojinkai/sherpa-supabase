// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { ApiClient, DefaultApi } from "npm:finnhub@1.2.19";

const config = {
  finnHubApiKey: Deno.env.get("FINNHUB_API_KEY")!,
  supabaseUrl: Deno.env.get("SUPABASE_URL")!,
  supabaseServiceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
};

// Type definitions for IPO Calendar response from Finnhub
// See: https://finnhub.io/docs/api/ipo-calendar

type IPOEvent = {
  symbol: string;
  name: string;
  ipoDate: string;
  exchange: string;
  numberOfShares?: number;
  price?: string;
  status?: string;
};

type IPOCalendarResponse = {
  ipoCalendar: IPOEvent[];
};

Deno.serve(async (req) => {
  if (!config.finnHubApiKey) {
    throw new Error("FINNHUB_API_KEY environment variable is not set");
  }

  // Initialize Finnhub client following the documentation pattern
  // found here https://finnhub.io/docs/api/ipo-calendar
  const api_key = ApiClient.instance.authentications["api_key"];
  api_key.apiKey = config.finnHubApiKey;
  const finnhubClient = new DefaultApi();

  // Get current date for IPO calendar events
  const today = new Date();
  const from = today.toISOString().split("T")[0]; // YYYY-MM-DD format

  // Set to date to 6 months in the future
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  const to = sixMonthsFromNow.toISOString().split("T")[0]; // YYYY-MM-DD format

  try {
    const supabaseClient = createClient(
      config.supabaseUrl,
      config.supabaseServiceKey,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );
    // Call IPO Calendar API using the Finnhub client with callback pattern
    const { ipoCalendar } = await new Promise<IPOCalendarResponse>(
      (resolve, reject) => {
        finnhubClient.ipoCalendar(
          from,
          to,
          (error: Error | null, data: unknown, _response: unknown) => {
            if (error) {
              reject(error);
            } else {
              resolve(data as IPOCalendarResponse);
            }
          },
        );
      },
    );

    const { data, error } = await supabaseClient
      .from("IPOEvent")
      .upsert(ipoCalendar, {
        onConflict: "name",
      })
      .select("*");

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ data }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching IPO calendar:", error);
    return new Response(JSON.stringify({ error }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
