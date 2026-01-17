import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { MongoClient, ObjectId } from "https://deno.land/x/mongo@v0.32.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MONGODB_URI = Deno.env.get('MONGODB_URI');

let client: MongoClient | null = null;

async function getClient() {
  if (!client) {
    client = new MongoClient();
    await client.connect(MONGODB_URI!);
    console.log("Connected to MongoDB");
  }
  return client;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Path format: /mongodb-api/{action}
    const action = pathParts[pathParts.length - 1] || '';

    const mongoClient = await getClient();
    const db = mongoClient.database("diabetes_app");

    console.log(`MongoDB API called with action: ${action}, method: ${req.method}`);

    // USERS / AUTH ACTIONS
    if (action === 'signup' && req.method === 'POST') {
      const { email, password, fullName } = await req.json();
      
      const users = db.collection("users");
      
      // Check if user exists
      const existingUser = await users.findOne({ email });
      if (existingUser) {
        return new Response(
          JSON.stringify({ error: "User already exists" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create user (in production, hash the password!)
      const result = await users.insertOne({
        email,
        password, // TODO: Hash this in production!
        fullName,
        assessmentComplete: false,
        createdAt: new Date(),
      });

      console.log("User created:", result);

      return new Response(
        JSON.stringify({ success: true, userId: result.toString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'login' && req.method === 'POST') {
      const { email, password } = await req.json();
      
      const users = db.collection("users");
      const user = await users.findOne({ email, password }); // TODO: Compare hashed passwords in production!

      if (!user) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log("User logged in:", user._id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          user: {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            assessmentComplete: user.assessmentComplete || false,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ASSESSMENT ACTIONS
    if (action === 'save-assessment' && req.method === 'POST') {
      const { userId, assessmentData } = await req.json();

      const assessments = db.collection("health_assessments");
      const users = db.collection("users");

      // Upsert assessment
      await assessments.updateOne(
        { userId },
        { $set: { ...assessmentData, userId, updatedAt: new Date() } },
        { upsert: true }
      );

      // Update user's assessment status
      await users.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { assessmentComplete: true } }
      );

      console.log("Assessment saved for user:", userId);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get-assessment' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId required" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const assessments = db.collection("health_assessments");
      const assessment = await assessments.findOne({ userId });

      console.log("Assessment fetched for user:", userId);

      return new Response(
        JSON.stringify({ assessment }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get-user' && req.method === 'GET') {
      const userId = url.searchParams.get('userId');
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: "userId required" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const users = db.collection("users");
      const user = await users.findOne({ _id: new ObjectId(userId) });

      if (!user) {
        return new Response(
          JSON.stringify({ error: "User not found" }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          user: {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            assessmentComplete: user.assessmentComplete || false,
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('MongoDB API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
