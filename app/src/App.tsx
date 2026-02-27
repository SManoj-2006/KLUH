import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { Home } from '@/pages/Home';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Upload } from '@/pages/Upload';
import { Preview } from '@/pages/Preview';
import { Recommendations } from '@/pages/Recommendations';
import { SkillGap } from '@/pages/SkillGap';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes - Without Layout */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Main Routes - With Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            
            {/* Protected Routes */}
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/preview" 
              element={
                <ProtectedRoute>
                  <Preview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/recommendations" 
              element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/skill-gap" 
              element={
                <ProtectedRoute>
                  <SkillGap />
                </ProtectedRoute>
              } 
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
