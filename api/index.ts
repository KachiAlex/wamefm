import { Request, Response } from 'express'

export default function handler(req: Request, res: Response) {
  res.json({ ok: true, url: req.url, path: req.path })
}
