interface Env {
  CLOUDNAV_R2: any;
  PASSWORD: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-auth-password',
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
};

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // 1. Auth Check
  const providedPassword = request.headers.get('x-auth-password');
  const serverPassword = env.PASSWORD;

  if (!serverPassword || providedPassword !== serverPassword) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const newLinkData = await request.json() as any;
    
    // Validate input
    if (!newLinkData.title || !newLinkData.url) {
        return new Response(JSON.stringify({ error: 'Missing title or url' }), { status: 400, headers: corsHeaders });
    }

    // 2. Fetch current data from R2
    const object = await env.CLOUDNAV_R2.get('app_data.json');
    let currentData = { links: [], categories: [] };
    
    if (object) {
        currentData = await object.json();
    }

    // 3. Create new link object
    const newLink = {
        id: Date.now().toString(),
        title: newLinkData.title,
        url: newLinkData.url,
        description: newLinkData.description || '',
        categoryId: 'common', // Default to common
        createdAt: Date.now(),
        pinned: false,
        icon: undefined
    };

    // 4. Append
    // @ts-ignore
    currentData.links = [newLink, ...(currentData.links || [])];

    // 5. Save back to R2
    await env.CLOUDNAV_R2.put('app_data.json', JSON.stringify(currentData));

    return new Response(JSON.stringify({ success: true, link: newLink }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};