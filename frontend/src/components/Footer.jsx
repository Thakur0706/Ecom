import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">About CampusConnect</h3>
            <p className="text-sm leading-6 text-slate-600">
              CampusConnect helps students buy and sell essentials, offer skills, and
              collaborate with peers through one clean campus-focused platform.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Quick Links</h3>
            <div className="grid gap-2 text-sm text-slate-600">
              <Link to="/" className="transition hover:text-blue-600">
                Home
              </Link>
              <Link to="/products" className="transition hover:text-blue-600">
                Products
              </Link>
              <Link to="/services" className="transition hover:text-blue-600">
                Services
              </Link>
              <Link to="/dashboard" className="transition hover:text-blue-600">
                Dashboard
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Contact</h3>
            <div className="space-y-2 text-sm text-slate-600">
              <p>Student Activity Center, North Campus</p>
              <p>support@campusconnect.edu</p>
              <p>+91 98765 43210</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm text-slate-500">
          Copyright © 2026 CampusConnect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
