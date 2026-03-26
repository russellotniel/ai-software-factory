export async function GET() {
  return Response.json({
    status: "ok",
    env: process.env.APP_ENV,
    timestamp: new Date().toISOString(),
  });
}
