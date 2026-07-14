import { useEffect } from 'react'

const BASE_URL = 'https://wamefm.vercel.app'
const BASE_NAME = 'Embassy Radio'

interface SeoOptions {
  description?: string
  image?: string
  type?: string
  path?: string
  breadcrumbs?: { name: string; path: string }[]
  jsonLd?: object | object[]
  publishedTime?: string
  modifiedTime?: string
  author?: string
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

const JSONLD_ID = 'page-jsonld'

function setJsonLd(data: object | object[]) {
  let el = document.getElementById(JSONLD_ID)
  if (!el) {
    el = document.createElement('script')
    el.id = JSONLD_ID
    el.setAttribute('type', 'application/ld+json')
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

function clearJsonLd() {
  document.getElementById(JSONLD_ID)?.remove()
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

    if (options.publishedTime) setMeta('property', 'article:published_time', options.publishedTime)
    if (options.modifiedTime) setMeta('property', 'article:modified_time', options.modifiedTime)
    if (options.author) setMeta('property', 'article:author', options.author)

    const jsonLdData: object[] = []

    if (options.breadcrumbs && options.breadcrumbs.length > 0) {
      jsonLdData.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: options.breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: b.name,
          item: `${BASE_URL}${b.path}`,
        })),
      })
    }

    if (options.jsonLd) {
      if (Array.isArray(options.jsonLd)) jsonLdData.push(...options.jsonLd)
      else jsonLdData.push(options.jsonLd)
    }

    if (jsonLdData.length > 0) setJsonLd(jsonLdData.length === 1 ? jsonLdData[0] : jsonLdData)
    else clearJsonLd()

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
      clearJsonLd()
    }
  }, [title, options.description, options.image, options.type, options.path, options.breadcrumbs, options.jsonLd, options.publishedTime, options.modifiedTime, options.author])
}

