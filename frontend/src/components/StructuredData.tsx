export default function StructuredData() {
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Embassy Radio',
    alternateName: 'Word and Miracle Embassy Church',
    url: 'https://embassyradio.org',
    logo: 'https://embassyradio.org/logo.png',
    description: 'The official digital radio ministry of Word and Miracle Embassy Church.',
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
    url: 'https://embassyradio.org',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://embassyradio.org/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  )
}

