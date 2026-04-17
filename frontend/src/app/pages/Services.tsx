import { useState } from "react";
import { Link } from "react-router";
import {
  Search, Clock,
  Scissors, Heart, Stethoscope, PawPrint, Sparkles, Star,
  Droplets, Wind, Shield, Smile, Leaf, Zap,
} from "lucide-react";
import { useApp } from "../context/AppContext";

const iconMap: Record<string, React.ElementType> = {
  scissors: Scissors, heart: Heart, stethoscope: Stethoscope,
  pawprint: PawPrint, sparkles: Sparkles, star: Star,
  droplets: Droplets, wind: Wind, shield: Shield,
  smile: Smile, leaf: Leaf, zap: Zap,
};

export function Services() {
  const { services, clinicInfo } = useApp();
  const active = services.filter((s) => s.active);
  const [search, setSearch] = useState("");

  const filtered = active.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-800 to-teal-600 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Nossos Serviços</h1>
          <p className="text-teal-100 text-lg">
            Tudo que o seu pet precisa em um só lugar
          </p>
        </div>
      </section>

      {/* Search + filters */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar serviços..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filtered.map((service) => {
            const Icon = iconMap[service.icon] ?? Scissors;
            return (
              <div key={service.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{service.name}</h3>
                    <span className="text-xs text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                      {service.category}
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed flex-1 mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <div>
                    <p className="text-teal-700 font-bold text-lg">
                      R$ {service.price.toFixed(2).replace(".", ",")}
                    </p>
                    <p className="text-gray-400 text-xs flex items-center gap-1">
                      <Clock size={11} /> {service.duration} min
                    </p>
                  </div>
                  <Link
                    to="/agendar"
                    className="px-4 py-2 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                  >
                    Agendar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Scissors size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhum serviço encontrado.</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-teal-700 text-white rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Dúvidas sobre algum serviço?</h3>
          <p className="text-teal-100 mb-6">Entre em contato e teremos prazer em ajudar!</p>
          <a
            href={`tel:+55${clinicInfo.telefone.replace(/\D/g, "")}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-2xl hover:bg-teal-50 transition-colors"
          >
            {clinicInfo.telefone}
          </a>
        </div>
      </section>
    </div>
  );
}
