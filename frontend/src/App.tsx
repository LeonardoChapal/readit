import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/AdminLayout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import OnboardingPage from './pages/OnboardingPage'
import CreateReviewPage from './pages/CreateReviewPage'
import ReviewDetailPage from './pages/ReviewDetailPage'
import ExplorePage from './pages/ExplorePage'
import ProfilePage from './pages/ProfilePage'
import SearchPage from './pages/SearchPage'
import BookPage from './pages/BookPage'
import NotFoundPage from './pages/NotFoundPage'
import DashboardPage from './pages/admin/DashboardPage'
import UsersPage from './pages/admin/UsersPage'
import BooksPage from './pages/admin/BooksPage'
import ReviewsPage from './pages/admin/ReviewsPage'
import CommentsPage from './pages/admin/CommentsPage'
import GenresPage from './pages/admin/GenresPage'
import TagsPage from './pages/admin/TagsPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/nueva-resena" element={<CreateReviewPage />} />
          <Route path="/resena/:id" element={<ReviewDetailPage />} />
          <Route path="/explorar" element={<ExplorePage />} />
          <Route path="/explorar/:genero" element={<ExplorePage />} />
          <Route path="/usuario/:username" element={<ProfilePage />} />
          <Route path="/buscar" element={<SearchPage />} />
          <Route path="/libro/:id" element={<BookPage />} />

          <Route path="*" element={<NotFoundPage />} />

          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="usuarios" element={<UsersPage />} />
            <Route path="libros" element={<BooksPage />} />
            <Route path="resenas" element={<ReviewsPage />} />
            <Route path="comentarios" element={<CommentsPage />} />
            <Route path="generos" element={<GenresPage />} />
            <Route path="etiquetas" element={<TagsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
