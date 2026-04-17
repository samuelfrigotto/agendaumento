import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router";
import { PawPrint, Menu, X, Phone, Mail, MapPin, Facebook, Instagram, Twitter } from "lucide-react";

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "Services", href: "/services" },
    { label: "Book Appointment", href: "/book" },
    { label: "My Appointments", href: "/my-appointments" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="bg-teal-700 text-white py-2 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5">
              <Phone size={13} />
              (555) 867-5309
            </span>
            <span className="flex items-center gap-1.5">
              <Mail size={13} />
              hello@pawsvetclinic.com
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={13} />
              123 Maple Street, Springfield
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-teal-200">Mon – Sat: 8am – 6pm</span>
            <Link
              to="/admin"
              className="text-teal-200 hover:text-white transition-colors text-xs border border-teal-500 px-2 py-0.5 rounded"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center">
                <PawPrint size={20} className="text-white" />
              </div>
              <div>
                <span className="text-gray-900 block" style={{ fontSize: "1rem", fontWeight: 700, lineHeight: 1.2 }}>
                  Paws Vet Clinic
                </span>
                <span className="text-teal-600 block" style={{ fontSize: "0.65rem", letterSpacing: "0.05em" }}>
                  CARING FOR YOUR PETS
                </span>
              </div>
            </Link>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    isActive(link.href)
                      ? "bg-teal-50 text-teal-700"
                      : "text-gray-600 hover:text-teal-700 hover:bg-gray-50"
                  }`}
                  style={{ fontWeight: isActive(link.href) ? 600 : 400 }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/book"
                className="ml-3 bg-teal-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-teal-700 transition-colors"
                style={{ fontWeight: 600 }}
              >
                Book Now
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-teal-700"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white py-2 px-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block px-3 py-2.5 rounded-lg text-sm mb-1 ${
                  isActive(link.href)
                    ? "bg-teal-50 text-teal-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                style={{ fontWeight: isActive(link.href) ? 600 : 400 }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/admin"
              className="block px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Admin Portal
            </Link>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center">
                  <PawPrint size={16} className="text-white" />
                </div>
                <span className="text-white" style={{ fontWeight: 700 }}>Paws Vet Clinic</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Compassionate care for your beloved pets. We treat every animal like family.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-teal-700 transition-colors">
                  <Facebook size={15} />
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-teal-700 transition-colors">
                  <Instagram size={15} />
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-teal-700 transition-colors">
                  <Twitter size={15} />
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-white text-sm mb-4" style={{ fontWeight: 600 }}>Quick Links</h4>
              <ul className="space-y-2 text-sm">
                {navLinks.map((l) => (
                  <li key={l.href}>
                    <Link to={l.href} className="text-gray-400 hover:text-teal-400 transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm mb-4" style={{ fontWeight: 600 }}>Services</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>General Consultation</li>
                <li>Vaccination</li>
                <li>Dental Cleaning</li>
                <li>Grooming</li>
                <li>Surgery</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white text-sm mb-4" style={{ fontWeight: 600 }}>Contact</h4>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <MapPin size={14} className="mt-0.5 text-teal-500 shrink-0" />
                  123 Maple Street, Springfield, IL 62701
                </li>
                <li className="flex items-center gap-2">
                  <Phone size={14} className="text-teal-500 shrink-0" />
                  (555) 867-5309
                </li>
                <li className="flex items-center gap-2">
                  <Mail size={14} className="text-teal-500 shrink-0" />
                  hello@pawsvetclinic.com
                </li>
              </ul>
              <div className="mt-4 bg-gray-800 rounded-lg p-3 text-sm">
                <p className="text-teal-400" style={{ fontWeight: 600 }}>Hours</p>
                <p className="text-gray-400 text-xs mt-1">Mon – Fri: 8:00am – 6:00pm</p>
                <p className="text-gray-400 text-xs">Saturday: 9:00am – 4:00pm</p>
                <p className="text-gray-400 text-xs">Sunday: Closed</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-2 text-sm text-gray-500">
            <p>© 2026 Paws Vet Clinic. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
