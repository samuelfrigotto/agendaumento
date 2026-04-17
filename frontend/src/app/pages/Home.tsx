import { Link } from "react-router";
import {
  Scissors, Heart, Star, CheckCircle, PawPrint,
  Phone, CalendarCheck, Shield, Clock, Award
} from "lucide-react";
import { useApp } from "../context/AppContext";

function fmtH(t: string) {
  const [h, m] = t.split(":");
  return m === "00" ? `${h}h` : `${h}h${m}`;
}

export function Home() {
  const { services, clinicInfo } = useApp();
  const featured = services.filter((s) => s.active).slice(0, 3);
  const horaSegSex = `Seg–Sex: ${fmtH(clinicInfo.horarioSegSexInicio)}–${fmtH(clinicInfo.horarioSegSexFim)}`;
  const horaSab    = `Sáb: ${fmtH(clinicInfo.horarioSabInicio)}–${fmtH(clinicInfo.horarioSabFim)}`;

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-teal-800 via-teal-700 to-teal-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <PawPrint
              key={i}
              size={40 + (i % 3) * 20}
              className="absolute text-white"
              style={{ top: `${(i * 17) % 90}%`, left: `${(i * 13) % 90}%`, transform: `rotate(${i * 30}deg)` }}
            />
          ))}
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 bg-teal-600/50 border border-teal-400/30 rounded-full px-4 py-1.5 text-sm mb-6">
            <Star size={14} className="text-yellow-300" />
            <span>Mais de 500 pets atendidos com carinho</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Cuidado e Carinho <br />
            <span className="text-teal-200">para o Seu Pet</span>
          </h1>
          <p className="text-teal-100 text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Banho, tosa e muito mais com profissionais apaixonados pelo que fazem.
            Agende agora e deixe seu pet brilhar!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/agendar"
              className="px-8 py-3.5 bg-white text-teal-700 font-bold rounded-2xl hover:bg-teal-50 transition-colors text-base shadow-lg"
            >
              Agendar Agora
            </Link>
            <Link
              to="/servicos"
              className="px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors text-base"
            >
              Ver Serviços
            </Link>
          </div>
        </div>
      </section>

      {/* Quick info bar */}
      <section className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: Phone, label: clinicInfo.telefone, sub: "Ligue ou WhatsApp" },
            { icon: Clock, label: horaSegSex, sub: horaSab },
            { icon: CalendarCheck, label: "Agendamento Online", sub: "Rápido e fácil" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center justify-center gap-3 py-2">
              <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                <Icon size={18} className="text-teal-600" />
              </div>
              <div className="text-left">
                <p className="text-gray-900 font-semibold text-sm">{label}</p>
                <p className="text-gray-500 text-xs">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured services */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Nossos Serviços em Destaque</h2>
          <p className="text-gray-500">Cuidado completo para o seu pet</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {featured.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mb-4">
                <Scissors size={22} className="text-teal-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1">{service.name}</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">{service.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-teal-700 font-bold text-lg">
                  R$ {service.price.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-gray-400 text-xs">{service.duration} min</span>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center">
          <Link
            to="/servicos"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-teal-600 text-teal-600 font-semibold rounded-2xl hover:bg-teal-50 transition-colors"
          >
            Ver Todos os Serviços
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-teal-700 text-white py-14">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "500+", label: "Pets Atendidos" },
            { value: "8", label: "Serviços Disponíveis" },
            { value: "4.9", label: "Avaliação Média" },
            { value: "3+", label: "Anos de Experiência" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-4xl font-bold text-white mb-1">{value}</p>
              <p className="text-teal-200 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose us */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Por que Escolher o Agendaumento?</h2>
          <p className="text-gray-500">Comprometidos com o bem-estar do seu pet</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { icon: Shield, title: "Profissionais Qualificados", desc: "Nossa equipe é treinada e apaixonada pelo cuidado animal." },
            { icon: Heart, title: "Tratamento com Amor", desc: "Cada pet é tratado com carinho e atenção individualizada." },
            { icon: Award, title: "Produtos de Qualidade", desc: "Usamos apenas produtos seguros e de alta qualidade." },
            { icon: Clock, title: "Horários Flexíveis", desc: "Atendemos de segunda a sábado para sua comodidade." },
            { icon: CheckCircle, title: "Agendamento Online", desc: "Agende em minutos pelo nosso sistema online." },
            { icon: Star, title: "Alta Satisfação", desc: "Mais de 98% dos nossos clientes recomendam nossos serviços." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 bg-white rounded-2xl shadow-sm">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                <Icon size={18} className="text-teal-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-1 text-sm">{title}</h4>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pet types */}
      <section className="bg-gray-100 py-14">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Atendemos Vários Tipos de Pets</h2>
          <p className="text-gray-500 mb-10">Nosso cuidado não tem raça</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { emoji: "🐕", label: "Cães" },
              { emoji: "🐈", label: "Gatos" },
              { emoji: "🐇", label: "Coelhos" },
              { emoji: "🐹", label: "Outros" },
            ].map(({ emoji, label }) => (
              <div key={label} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-4xl mb-2">{emoji}</div>
                <p className="font-semibold text-gray-800">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">O que Nossos Clientes Dizem</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Maria Silva", pet: "Bolinha (Poodle)", text: "Atendimento incrível! Meu Bolinha amou. Saiu cheiroso e linda a tosa.", stars: 5 },
            { name: "João Santos", pet: "Luna (Shih Tzu)", text: "Profissionais excelentes e muito carinhosos. Super recomendo!", stars: 5 },
            { name: "Ana Oliveira", pet: "Mel (Persa)", text: "Agendamento fácil e serviço de qualidade. Voltarei sempre!", stars: 5 },
          ].map(({ name, pet, text, stars }) => (
            <div key={name} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex gap-0.5 mb-3">
                {[...Array(stars)].map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm italic mb-4 leading-relaxed">"{text}"</p>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{name}</p>
                <p className="text-gray-400 text-xs">{pet}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gradient-to-r from-teal-700 to-teal-600 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-3">Pronto para Cuidar do Seu Pet?</h2>
          <p className="text-teal-100 mb-8 text-lg">
            Agende agora mesmo e garanta o melhor cuidado para o seu companheiro!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/agendar"
              className="px-8 py-3.5 bg-white text-teal-700 font-bold rounded-2xl hover:bg-teal-50 transition-colors"
            >
              Agendar Online
            </Link>
            <a
              href={`tel:+55${clinicInfo.telefone.replace(/\D/g, "")}`}
              className="px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-2xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={16} /> {clinicInfo.telefone}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
