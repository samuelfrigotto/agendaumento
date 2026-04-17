import { useState } from "react";
import { Link } from "react-router";
import {
  Stethoscope, Syringe, Scissors, Heart, Clock, DollarSign,
  ArrowRight, Search, Filter
} from "lucide-react";
import { useApp } from "../context/AppContext";

const iconMap: Record<string, React.ElementType> = {
  stethoscope: Stethoscope,
  syringe: Syringe,
  scissors: Scissors,
  heart: Heart,
  scan: () => <span>🔬</span>,
  flask: () => <span>🧪</span>,
  ambulance: () => <span>🚑</span>,
  tooth: () => <span>🦷</span>,
};

const categoryColors: Record<string, string> = {
  "Preventive Care": "bg-teal-50 text-teal-700 border-teal-200",
  "Dental": "bg-blue-50 text-blue-700 border-blue-200",
  "Grooming": "bg-purple-50 text-purple-700 border-purple-200",
  "Surgery": "bg-rose-50 text-rose-700 border-rose-200",
  "Diagnostics": "bg-amber-50 text-amber-700 border-amber-200",
  "Emergency": "bg-red-50 text-red-700 border-red-200",
};

const categoryBg: Record<string, string> = {
  "Preventive Care": "bg-teal-500",
  "Dental": "bg-blue-500",
  "Grooming": "bg-purple-500",
  "Surgery": "bg-rose-500",
  "Diagnostics": "bg-amber-500",
  "Emergency": "bg-red-500",
};

export function Services() {
  const { services } = useApp();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(services.map((s) => s.category)))];
  const activeServices = services.filter((s) => s.active);

  const filtered = activeServices.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "All" || s.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-700 to-teal-900 py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-teal-300 text-sm mb-2" style={{ fontWeight: 600, letterSpacing: "0.05em" }}>WHAT WE OFFER</p>
          <h1 className="text-white mb-3" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800 }}>
            Our Veterinary Services
          </h1>
          <p className="text-teal-200 max-w-xl mx-auto mb-7">
            From preventive care to advanced treatments — all under one roof. Explore our full range of services and book your appointment today.
          </p>
          <div className="relative max-w-md mx-auto">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <Filter size={15} className="text-gray-400 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-sm border transition-all ${
                  activeCategory === cat
                    ? "bg-teal-600 text-white border-teal-600"
                    : "text-gray-600 border-gray-200 hover:border-teal-300 hover:text-teal-600"
                }`}
                style={{ fontWeight: activeCategory === cat ? 600 : 400 }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-400 text-lg">No services found matching your search.</p>
              <button
                onClick={() => { setSearch(""); setActiveCategory("All"); }}
                className="mt-3 text-teal-600 hover:underline text-sm"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((service) => {
                const Icon = iconMap[service.icon] ?? Stethoscope;
                const bgColor = categoryBg[service.category] ?? "bg-teal-500";
                const badgeColor = categoryColors[service.category] ?? "bg-gray-50 text-gray-700 border-gray-200";

                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col overflow-hidden"
                  >
                    <div className={`${bgColor} h-2`} />
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-gray-700">
                          <Icon size={22} />
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full border ${badgeColor}`} style={{ fontWeight: 500 }}>
                          {service.category}
                        </span>
                      </div>
                      <h3 className="text-gray-900 mb-1.5" style={{ fontWeight: 700 }}>{service.name}</h3>
                      <p className="text-gray-500 text-sm flex-1 leading-relaxed">{service.description}</p>

                      <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={13} />
                            {service.duration} min
                          </span>
                          <span className="flex items-center gap-1 text-teal-700">
                            <DollarSign size={13} />
                            <span style={{ fontWeight: 700 }}>{service.price}</span>
                          </span>
                        </div>
                        <Link
                          to={`/book?service=${service.id}`}
                          className="flex items-center gap-1 bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-teal-700 transition-colors"
                          style={{ fontWeight: 600 }}
                        >
                          Book
                          <ArrowRight size={12} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-teal-700 py-12 px-4 text-center">
        <h2 className="text-white mb-2" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
          Need Help Choosing a Service?
        </h2>
        <p className="text-teal-200 mb-5">
          Call us and our team will help you find the right care for your pet.
        </p>
        <a
          href="tel:5558675309"
          className="inline-flex items-center gap-2 bg-white text-teal-700 px-6 py-3 rounded-xl hover:bg-teal-50 transition-all"
          style={{ fontWeight: 700 }}
        >
          (555) 867-5309
        </a>
      </section>
    </div>
  );
}
