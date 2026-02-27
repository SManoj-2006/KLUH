import { Link } from 'react-router-dom';
import { Briefcase, Mail, Phone, MapPin, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';

const footerLinks = {
  product: [
    { name: 'Upload Resume', href: '/upload' },
    { name: 'Job Recommendations', href: '/recommendations' },
    { name: 'Skill Analysis', href: '/skill-gap' },
    { name: 'Profile Preview', href: '/preview' },
  ],
  company: [
    { name: 'About Us', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Press', href: '#' },
  ],
  support: [
    { name: 'Help Center', href: '#' },
    { name: 'Contact Us', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-white">DEET Jobs</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-sm">
              AI-powered resume analysis and job matching platform. Connect with your dream career through intelligent skill mapping and personalized recommendations.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-blue-500" />
                <span>support@deetjobs.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-blue-500" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-blue-500" />
                <span>San Francisco, CA 94102</span>
              </div>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} DEET Jobs. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
