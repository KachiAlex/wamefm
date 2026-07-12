const BASE_URL = 'https://wamefm.vercel.app'

export default function StructuredData() {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Embassy Radio',
    alternateName: 'Word and Miracle Embassy Church',
    url: BASE_URL,
    logo: `${BASE_URL}/icon-512.png`,
    description: 'The official digital radio ministry of Word and Miracle Embassy Church. Live broadcasts, on-demand sermons, Christian podcasts, worship music, and prayer community — 24/7.',
    sameAs: [
      'https://facebook.com/embassyradio',
      'https://instagram.com/embassyradio',
      'https://youtube.com/embassyradio',
      'https://twitter.com/embassyradio',
    ],
  }
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Embassy Radio',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
  const radioProgram = {
    '@context': 'https://schema.org',
    '@type': 'RadioProgram',
    name: 'Embassy Radio',
    url: BASE_URL,
    description: '24/7 Christian radio ministry featuring live church broadcasts, sermon archives, worship music, and prayer programs from Word and Miracle Embassy Church.',
    broadcaster: {
      '@type': 'Organization',
      name: 'Word and Miracle Embassy Church',
    },
    inLanguage: 'en',
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(radioProgram) }} />
    </>
  )
}

