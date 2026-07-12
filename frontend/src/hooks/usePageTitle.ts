import { useEffect } from 'react'

const BASE_URL = 'https://wamefm.vercel.app'
const BASE_NAME = 'Embassy Radio'

interface SeoOptions {
  description?: string
  image?: string
  type?: string
  path?: string
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', url)
}

export function usePageTitle(title: string, options: SeoOptions = {}) {
  useEffect(() => {
    const full = title ? `${title} | ${BASE_NAME}` : `${BASE_NAME} - Word and Miracle Embassy Church`
    const description = options.description || 'Listen to live broadcasts, on-demand sermons, Christian podcasts, worship music, and join our prayer community — 24/7.'
    const image = options.image || `${BASE_URL}/icon-512.png`
    const type = options.type || 'website'
    const url = options.path ? `${BASE_URL}${options.path}` : `${BASE_URL}${window.location.pathname}`

    document.title = full

    setMeta('name', 'description', description)
    setMeta('property', 'og:title', full)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', image)
    setMeta('property', 'og:type', type)
    setMeta('name', 'twitter:title', full)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)
    setCanonical(url)

    return () => {
      const defaultTitle = `${BASE_NAME} - Word and Miracle Embassy Church`
      const defaultDesc = 'Embassy Radio brings the Word and Miracle Embassy Church to the world. Listen to live broadcasts, on-demand sermons, Christian podcasts, worship music, and join our prayer community — 24/7.'
      document.title = defaultTitle
      setMeta('name', 'description', defaultDesc)
      setMeta('property', 'og:title', defaultTitle)
      setMeta('property', 'og:description', defaultDesc)
      setMeta('property', 'og:url', `${BASE_URL}/`)
      setMeta('property', 'og:image', `${BASE_URL}/icon-512.png`)
      setMeta('property', 'og:type', 'website')
      setMeta('name', 'twitter:title', defaultTitle)
      setMeta('name', 'twitter:description', defaultDesc)
      setMeta('name', 'twitter:image', `${BASE_URL}/icon-512.png`)
      setCanonical(`${BASE_URL}/`)
    }
  }, [title, options.description, options.image, options.type, options.path])
}

