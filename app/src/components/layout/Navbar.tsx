import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Menu, X, Briefcase, User, LogIn, LogOut, Settings, ChevronDown, ServerOff } from 'lucide-react';

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Upload Resume', href: '/upload', protected: true },
  { name: 'Preview Profile', href: '/preview', protected: true },
  { name: 'Job Recommendations', href: '/recommendations', protected: true },
  { name: 'Skill Gap Analysis', href: '/skill-gap', protected: true },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, isAuthenticated, isBackendAvailable, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
  };

  // Filter nav links based on auth status
  const visibleNavLinks = navLinks.filter(link => 
    !link.protected || isAuthenticated
  );

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Backend Status Banner */}
      {!isBackendAvailable && (
        <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 border-amber-200">
          <ServerOff className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            Backend server is not running. Please start the server with: <code className="bg-amber-100 px-1 py-0.5 rounded">npm run server</code>
          </AlertDescription>
        </Alert>
      )}
      
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-lg shadow-blue-600/20 transition-transform group-hover:scale-105">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
            DEET Jobs
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-1">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive(link.href)
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              {link.name}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
              )}
            </Link>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/preview" className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                  <User className="h-4 w-4 mr-2" />
                  Register
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="px-4 py-4 space-y-2">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="pt-4 border-t border-slate-200 space-y-2">
              {isAuthenticated ? (
                <>
                  <div className="px-4 py-2">
                    <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                  </div>
                  <Link to="/preview" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="w-full justify-center text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-center">
                      <LogIn className="h-4 w-4 mr-2" />
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700">
                      <User className="h-4 w-4 mr-2" />
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
