import Navbar from './Navbar'
import MiniPlayer from './MiniPlayer'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      <Navbar />
      <main className="w-full min-w-0">
        {children}
      </main>
      <MiniPlayer />
    </div>
  )
}

