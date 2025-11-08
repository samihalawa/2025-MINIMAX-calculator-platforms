import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AppProvider } from './contexts/AppContext'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './components/Toast'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
// Lazy load pages to reduce bundle size
import { lazy, Suspense } from 'react'

const HomePage = lazy(() => import('./pages/HomePage'))
const CalculatorPage = lazy(() => import('./pages/CalculatorPage'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <ToastProvider>
            <AppProvider>
              <BrowserRouter>
                <Suspense fallback={
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Cargando Numera...</p>
                    </div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/calculadora/:categorySlug/:calculatorSlug" element={<CalculatorPage />} />
                    <Route path="*" element={<HomePage />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </AppProvider>
          </ToastProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>,
)