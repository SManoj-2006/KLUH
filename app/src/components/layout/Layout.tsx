import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
