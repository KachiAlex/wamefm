import { parse } from 'url'

export default async function handler(req: any, res: any) {
  try {
    const parsed = parse(req.url || '', true)
    if (parsed.query.__path) {
      req.url = '/' + parsed.query.__path
    } else if (req.url?.startsWith('/api/')) {
      req.url = req.url.slice(4)
    }
    const { default: app } = await import('./app.js')
    return app(req, res)
  } catch (e: any) {
    res.status(500).json({ error: e.message, stack: e.stack })
  }
}
