import { useEffect } from 'react'

export function usePageTitle(title: string) {
  useEffect(() => {
    const base = 'Embassy Radio'
    const full = title ? `${title} | ${base}` : base
    document.title = full
    return () => { document.title = base }
  }, [title])
}

