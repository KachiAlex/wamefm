/**
 * Lightweight prerender script — generates static HTML files for key routes
 * so crawlers see route-specific meta tags without executing JavaScript.
 *
 * This copies dist/index.html to dist/{route}/index.html with injected
 * route-specific <title>, <meta description>, <meta og:*>, and JSON-LD.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'

const BASE_URL = 'https://wamefm.vercel.app'
const BASE_NAME = 'Embassy Radio'
const distDir = join(process.cwd(), 'dist')

if (!existsSync(distDir)) {
  console.error('[prerender] dist/ not found. Run build first.')
  process.exit(1)
}

const baseHtml = readFileSync(join(distDir, 'index.html'), 'utf-8')

const routes = [
  {
    path: '/',
    title: 'Embassy Radio - Word and Miracle Embassy Church',
    description: 'Embassy Radio — the 24/7 digital radio ministry of Word and Miracle Embassy Church. Listen to live broadcasts, explore sermon archives, worship music, prayer, and Christian community.',
    type: 'website',
  },
  {
    path: '/live',
    title: 'Live Broadcast | Embassy Radio',
    description: 'Listen to the live broadcast from Word and Miracle Embassy Church. Join the conversation with live chat, prayer, and community interaction.',
    type: 'website',
  },
  {
    path: '/archive',
    title: 'Sermon Archive | Embassy Radio',
    description: 'Browse and listen to on-demand sermon recordings from Word and Miracle Embassy Church. Search by speaker, series, or scripture reference.',
    type: 'website',
  },
  {
    path: '/music',
    title: 'Music Library | Embassy Radio',
    description: 'Explore Christian worship music, gospel songs, and hymns on Embassy Radio. Create playlists and listen to uplifting music from Word and Miracle Embassy Church.',
    type: 'website',
  },
  {
    path: '/events',
    title: 'Events | Embassy Radio',
    description: 'Stay connected with upcoming events at Word and Miracle Embassy Church. Services, conferences, prayer meetings, and special gatherings.',
    type: 'website',
  },
  {
    path: '/prayer',
    title: 'Prayer Wall | Embassy Radio',
    description: 'Submit your prayer requests and pray for others on the Embassy Radio Prayer Wall. Join our faith community in intercession and support.',
    type: 'website',
  },
  {
    path: '/testimonies',
    title: 'Testimonies | Embassy Radio',
    description: "Read and share testimonies of God's faithfulness from the Word and Miracle Embassy Church community.",
    type: 'website',
  },
  {
    path: '/about',
    title: 'About Us | Embassy Radio',
    description: 'Learn about Word and Miracle Embassy Church and Embassy Radio, our 24/7 digital radio ministry bringing the whole Word to the whole world.',
    type: 'website',
  },
  {
    path: '/donate',
    title: 'Give & Support | Embassy Radio',
    description: 'Support the ministry of Word and Miracle Embassy Church through your giving. Help us continue broadcasting the gospel 24/7.',
    type: 'website',
  },
  {
    path: '/print',
    title: 'Print Media | Embassy Radio',
    description: 'Download Christian tracts, booklets, and print resources from Word and Miracle Embassy Church. Free gospel literature for evangelism and discipleship.',
    type: 'website',
  },
  {
    path: '/search',
    title: 'Search | Embassy Radio',
    description: 'Search for sermons, music, events, and more on Embassy Radio.',
    type: 'website',
  },
  {
    path: '/series',
    title: 'Sermon Series | Embassy Radio',
    description: 'Explore sermon series from Word and Miracle Embassy Church. Thematic collections of teachings on faith, prayer, salvation, and Christian living.',
    type: 'website',
  },
]

function injectMeta(html, route) {
  const url = `${BASE_URL}${route.path}`
  const title = route.title
  const desc = route.description
  const image = `${BASE_URL}/icon-512.png`
  const type = route.type || 'website'

  // Replace title
  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)

  // Replace or add meta description
  out = out.replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${desc}"`)

  // Replace og:title, og:description, og:url, og:image, og:type
  out = out.replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${title}"`)
  out = out.replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${desc}"`)
  out = out.replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${url}"`)
  out = out.replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${image}"`)
  out = out.replace(/<meta property="og:type" content="[^"]*"/, `<meta property="og:type" content="${type}"`)

  // Replace twitter:title, twitter:description
  out = out.replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${title}"`)
  out = out.replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${desc}"`)

  // Replace canonical
  out = out.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${url}"`)

  // Add breadcrumb JSON-LD for non-home pages
  if (route.path !== '/') {
    const crumbs = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}/` },
      { '@type': 'ListItem', position: 2, name: route.title.replace(` | ${BASE_NAME}`, ''), item: url },
    ]
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs,
    }
    const jsonLdTag = `<script type="application/ld+json" data-prerender="true">${JSON.stringify(jsonLd)}</script>`
    out = out.replace('</head>', `${jsonLdTag}\n  </head>`)
  }

  return out
}

let count = 0
for (const route of routes) {
  if (route.path === '/') continue // root already exists as index.html
  const routeDir = join(distDir, route.path)
  mkdirSync(routeDir, { recursive: true })
  const html = injectMeta(baseHtml, route)
  writeFileSync(join(routeDir, 'index.html'), html)
  count++
}

console.log(`[prerender] Generated ${count} static route HTML files`)
