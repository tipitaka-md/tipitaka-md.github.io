export function GET() {
  return new Response(JSON.stringify({ version: __SITE_BUILD_ID__ }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
