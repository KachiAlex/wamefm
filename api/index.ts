export default async function handler(req: any, res: any) {
  const { default: app } = await import('./app.js')
  return app(req, res)
}
