export default async function handler(req: any, res: any) {
  try {
    const url = new URL(req.url || '', `https://${req.headers.host || 'localhost'}`)
    const __path = url.searchParams.get('__path')
    if (__path) {
      req.url = '/' + __path
    } else if (req.url?.startsWith('/api/')) {
      req.url = req.url.slice(4)
    }
    const { default: app } = await import('./app.js')
    return app(req, res)
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack })
  }
}
