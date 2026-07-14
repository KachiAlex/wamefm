import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AudioPlayerProvider } from './contexts/AudioPlayerContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { ToastProvider } from './contexts/ToastContext'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'

function lazyWithRetry(factory: () => Promise<any>) {
  return lazy(() =>
    factory().catch(() => {
      const reloaded = sessionStorage.getItem('chunk_reload')
      if (!reloaded) {
        sessionStorage.setItem('chunk_reload', '1')
        window.location.reload()
        return new Promise(() => {})
      }
      sessionStorage.removeItem('chunk_reload')
      return factory()
    })
  )
}

// Code-split pages for smaller initial bundle
const Home = lazyWithRetry(() => import('./pages/Home'))
const Login = lazyWithRetry(() => import('./pages/Login'))
const ForgotPassword = lazyWithRetry(() => import('./pages/ForgotPassword'))
const ResetPassword = lazyWithRetry(() => import('./pages/ResetPassword'))
const Broadcast = lazyWithRetry(() => import('./pages/Broadcast'))
const Archive = lazyWithRetry(() => import('./pages/Archive'))
const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'))
const MemberDashboard = lazyWithRetry(() => import('./pages/MemberDashboard'))
const Status = lazyWithRetry(() => import('./pages/Status'))
const Live = lazyWithRetry(() => import('./pages/Live'))
const Music = lazyWithRetry(() => import('./pages/Music'))
const SermonDetail = lazyWithRetry(() => import('./pages/SermonDetail'))
const PrayerWall = lazyWithRetry(() => import('./pages/PrayerWall'))
const Testimonies = lazyWithRetry(() => import('./pages/Testimonies'))
const Events = lazyWithRetry(() => import('./pages/Events'))
const EventDetail = lazyWithRetry(() => import('./pages/EventDetail'))
const AboutUs = lazyWithRetry(() => import('./pages/AboutUs'))
const Donate = lazyWithRetry(() => import('./pages/Donate'))
const Print = lazyWithRetry(() => import('./pages/Print'))
const Search = lazyWithRetry(() => import('./pages/Search'))
const SermonSeries = lazyWithRetry(() => import('./pages/SermonSeries'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--ink)' }}>
      <div className="w-8 h-8 border-2 border-[#E05A1A] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <div key={location.pathname} className="animate-fade-in">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/archive" element={<Archive />} />
        <Route path="/sermons/:id" element={<SermonDetail />} />
        <Route path="/status" element={<Status />} />
        <Route path="/live" element={<Live />} />
        <Route path="/live/:broadcastId" element={<Live />} />
        <Route path="/music" element={<Music />} />
        <Route path="/prayer" element={<PrayerWall />} />
        <Route path="/testimonies" element={<Testimonies />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/donate" element={<Donate />} />
        <Route path="/print" element={<Print />} />
        <Route path="/search" element={<Search />} />
        <Route path="/series" element={<SermonSeries />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['listener', 'admin', 'broadcaster']}>
              <MemberDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin', 'broadcaster']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/broadcast"
          element={
            <ProtectedRoute allowedRoles={['admin', 'broadcaster']}>
              <Broadcast />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        <FavoritesProvider>
          <NotificationProvider>
            <ToastProvider>
              <BrowserRouter>
                <ErrorBoundary>
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <AnimatedRoutes />
                    </Suspense>
                  </Layout>
                </ErrorBoundary>
              </BrowserRouter>
            </ToastProvider>
          </NotificationProvider>
        </FavoritesProvider>
      </AudioPlayerProvider>
    </AuthProvider>
  )
}

export default App

