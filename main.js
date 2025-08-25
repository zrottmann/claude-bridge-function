import { Client, Databases, Query } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('68a4e3da0022f3e129d0')
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.json({}, 200, corsHeaders);
  }

  try {
    // Handle status endpoint
    if (req.method === 'GET' && req.path === '/status') {
      return res.json({
        status: 'running',
        version: '1.0.0',
        type: 'appwrite_function',
        timestamp: new Date().toISOString()
      }, 200, corsHeaders);
    }

    // Handle Claude bridge requests
    if (req.method === 'POST' && req.path === '/claude') {
      const { prompt, sessionId = 'default', requestId = Date.now().toString(), targetUrl } = req.body;

      if (!prompt) {
        return res.json({ 
          error: 'Prompt is required',
          type: 'validation_error'
        }, 400, corsHeaders);
      }

      if (!targetUrl) {
        return res.json({ 
          error: 'Target URL is required for bridge connection',
          type: 'validation_error'
        }, 400, corsHeaders);
      }

      // Forward request to local bridge server
      try {
        const response = await fetch(targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prompt,
            sessionId,
            requestId
          })
        });

        if (!response.ok) {
          throw new Error(`Bridge server responded with ${response.status}`);
        }

        const result = await response.json();
        
        // Log the interaction
        log(`Bridge request: ${prompt.substring(0, 100)}...`);
        log(`Bridge response: ${result.success ? 'Success' : 'Failed'}`);

        // Optionally store in database for history
        try {
          await databases.createDocument(
            'console_db',
            'claude_sessions',
            requestId,
            {
              sessionId,
              prompt: prompt.substring(0, 500), // Truncate for storage
              response: JSON.stringify(result).substring(0, 1000),
              timestamp: new Date().toISOString(),
              success: result.success || false
            }
          );
        } catch (dbError) {
          // Non-critical - log but don't fail the request
          log(`Database storage failed: ${dbError.message}`);
        }

        return res.json(result, 200, corsHeaders);

      } catch (fetchError) {
        error(`Bridge connection failed: ${fetchError.message}`);
        return res.json({
          error: 'Failed to connect to local bridge server',
          details: fetchError.message,
          type: 'bridge_connection_error'
        }, 502, corsHeaders);
      }
    }

    // Handle session list endpoint
    if (req.method === 'GET' && req.path === '/sessions') {
      try {
        const sessions = await databases.listDocuments(
          'console_db',
          'claude_sessions',
          [
            Query.orderDesc('timestamp'),
            Query.limit(50)
          ]
        );

        return res.json({
          sessions: sessions.documents.map(doc => ({
            sessionId: doc.sessionId,
            timestamp: doc.timestamp,
            success: doc.success,
            prompt: doc.prompt.substring(0, 100) + '...'
          }))
        }, 200, corsHeaders);

      } catch (dbError) {
        return res.json({
          error: 'Failed to retrieve sessions',
          details: dbError.message
        }, 500, corsHeaders);
      }
    }

    // 404 for unknown routes
    return res.json({ 
      error: 'Endpoint not found',
      available_endpoints: ['/status', '/claude', '/sessions']
    }, 404, corsHeaders);

  } catch (err) {
    error(`Function error: ${err.message}`);
    return res.json({
      error: 'Internal function error',
      details: err.message
    }, 500, corsHeaders);
  }
};