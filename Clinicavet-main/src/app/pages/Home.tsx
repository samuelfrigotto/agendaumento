import { Link } from "react-router";
import {
  Stethoscope, Syringe, Scissors, Heart, Star, ArrowRight,
  Clock, MapPin, Phone, Shield, Award, Users, CheckCircle
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const heroImage = "https://images.unsplash.com/photo-1770836037793-95bdbf190f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJ5JTIwY2xpbmljJTIwZG9nJTIwY2F0JTIwaGFwcHl8ZW58MXx8fHwxNzc2MzAyNTg4fDA&ixlib=rb-4.1.0&q=80&w=1080";
const dogImage = "https://images.unsplash.com/photo-1593620659530-7f98c53de278?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwZG9nJTIwcHVwcHklMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzYzMDI1ODh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const catImage = "https://images.unsplash.com/photo-1771944981922-8446cbacca8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBraXR0ZW4lMjBjdXRlJTIwY2xvc2UlMjB1cHxlbnwxfHx8fDE3NzYzMDI1OTF8MA&ixlib=rb-4.1.0&q=80&w=1080";
const rabbitImage = "https://images.unsplash.com/photo-1774218308330-df953d1e334b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyYWJiaXQlMjBzbWFsbCUyMGFuaW1hbCUyMHBldHxlbnwxfHx8fDE3NzYzMDI1OTl8MA&ixlib=rb-4.1.0&q=80&w=1080";
const clinicImage = "https://images.unsplash.com/photo-1746021375258-79fa1464ca1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJ5JTIwY2xpbmljJTIwY2xlYW4lMjBtb2Rlcm4lMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzYzMDI1OTl8MA&ixlib=rb-4.1.0&q=80&w=1080";

const featuredServices = [
  { icon: Stethoscope, name: "Consultation", desc: "Comprehensive health check-ups", color: "bg-teal-50 text-teal-600" },
  { icon: Syringe, name: "Vaccination", desc: "Keep your pet protected", color: "bg-blue-50 text-blue-600" },
  { icon: Scissors, name: "Grooming", desc: "Full-service pet grooming", color: "bg-purple-50 text-purple-600" },
  { icon: Heart, name: "Surgery", desc: "Advanced surgical procedures", color: "bg-rose-50 text-rose-600" },
];

const testimonials = [
  {
    name: "Sarah M.",
    pet: "Owner of Buddy (Golden Retriever)",
    rating: 5,
    text: "The team at Paws Vet Clinic is absolutely wonderful. Buddy loves coming here and the staff treats him like family every single visit.",
    avatar: "SM",
  },
  {
    name: "James T.",
    pet: "Owner of Whiskers (Persian Cat)",
    rating: 5,
    text: "I've been bringing my cats here for 3 years. The online scheduling is so convenient and the vets are incredibly knowledgeable and gentle.",
    avatar: "JT",
  },
  {
    name: "Emily R.",
    pet: "Owner of Luna (Lab Mix)",
    rating: 5,
    text: "Booking appointments online is a game-changer! Quick, easy, and the reminders are super helpful. Highly recommend this clinic.",
    avatar: "ER",
  },
];

const stats = [
  { value: "5,000+", label: "Happy Patients", icon: Users },
  { value: "15+", label: "Years of Care", icon: Award },
  { value: "8", label: "Expert Vets", icon: Shield },
  { value: "98%", label: "Satisfaction Rate", icon: Star },
];

export function Home() {
  const { services } = useApp();

  return (
    <div className="overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={heroImage}
            alt="Happy pets at vet clinic"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-teal-900/90 via-teal-800/70 to-transparent" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 border border-teal-400/30 text-teal-200 px-3 py-1.5 rounded-full text-sm mb-5">
              <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
              Accepting New Patients
            </div>
            <h1 className="text-white mb-4" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800, lineHeight: 1.1 }}>
              Compassionate Care<br />
              <span className="text-teal-300">For Your Beloved Pets</span>
            </h1>
            <p className="text-teal-100 text-lg mb-8 leading-relaxed">
              Expert veterinary services with a personal touch. Schedule your appointment online in minutes and give your furry family member the care they deserve.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 bg-teal-500 text-white px-6 py-3 rounded-xl hover:bg-teal-400 transition-all"
                style={{ fontWeight: 600 }}
              >
                Book Appointment
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/services"
                className="inline-flex items-center gap-2 bg-white/10 border border-white/30 text-white px-6 py-3 rounded-xl hover:bg-white/20 transition-all"
                style={{ fontWeight: 500 }}
              >
                Our Services
              </Link>
            </div>

            <div className="flex items-center gap-6 mt-8">
              <div className="flex -space-x-2">
                {["SM", "JT", "ER", "DK"].map((init, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-teal-700 flex items-center justify-center text-white text-xs"
                    style={{
                      backgroundColor: ["#0d9488", "#0891b2", "#7c3aed", "#059669"][i],
                      fontWeight: 700
                    }}
                  >
                    {init}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-white text-sm ml-1" style={{ fontWeight: 600 }}>4.9</span>
                </div>
                <p className="text-teal-200" style={{ fontSize: "0.75rem" }}>from 500+ reviews</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Info Bar */}
      <div className="bg-teal-700 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-teal-300 shrink-0" />
              <div>
                <p className="text-xs text-teal-300">Hours</p>
                <p className="text-sm" style={{ fontWeight: 500 }}>Mon–Fri: 8am–6pm, Sat: 9am–4pm</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={18} className="text-teal-300 shrink-0" />
              <div>
                <p className="text-xs text-teal-300">Call Us</p>
                <p className="text-sm" style={{ fontWeight: 500 }}>(555) 867-5309</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-teal-300 shrink-0" />
              <div>
                <p className="text-xs text-teal-300">Location</p>
                <p className="text-sm" style={{ fontWeight: 500 }}>123 Maple Street, Springfield</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Services */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-teal-600 text-sm mb-2" style={{ fontWeight: 600, letterSpacing: "0.05em" }}>WHAT WE OFFER</p>
            <h2 className="text-gray-900" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800 }}>
              Comprehensive Veterinary Services
            </h2>
            <p className="text-gray-500 mt-2 max-w-xl mx-auto">
              From routine checkups to specialized treatments, we provide everything your pet needs to live a happy, healthy life.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {featuredServices.map(({ icon: Icon, name, desc, color }) => (
              <div
                key={name}
                className="bg-gray-50 rounded-2xl p-5 hover:shadow-md transition-all hover:-translate-y-1 cursor-default"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={22} />
                </div>
                <h3 className="text-gray-900 text-sm mb-1" style={{ fontWeight: 700 }}>{name}</h3>
                <p className="text-gray-500 text-xs">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 transition-colors"
              style={{ fontWeight: 600 }}
            >
              View all {services.length} services
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="text-center">
                <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Icon size={22} className="text-teal-600" />
                </div>
                <p className="text-teal-700" style={{ fontSize: "1.8rem", fontWeight: 800 }}>{value}</p>
                <p className="text-gray-600 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us / Clinic Image */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <ImageWithFallback
                src={clinicImage}
                alt="Paws Vet Clinic interior"
                className="w-full h-80 object-cover"
              />
            </div>
            <div>
              <p className="text-teal-600 text-sm mb-2" style={{ fontWeight: 600, letterSpacing: "0.05em" }}>WHY CHOOSE US</p>
              <h2 className="text-gray-900 mb-4" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 800 }}>
                A Clinic That Truly Cares
              </h2>
              <p className="text-gray-500 mb-6">
                At Paws Vet Clinic, we combine medical expertise with heartfelt compassion. Every pet that walks through our doors is treated with the same love and attention we'd give our own.
              </p>
              <ul className="space-y-3">
                {[
                  "Online appointment scheduling 24/7",
                  "Board-certified veterinarians & specialists",
                  "State-of-the-art diagnostic equipment",
                  "Gentle, stress-free handling techniques",
                  "Transparent pricing, no hidden fees",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-gray-600 text-sm">
                    <CheckCircle size={16} className="text-teal-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/book"
                className="inline-flex items-center gap-2 mt-7 bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-all"
                style={{ fontWeight: 600 }}
              >
                Book Appointment <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pet Types */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-teal-600 text-sm mb-2" style={{ fontWeight: 600, letterSpacing: "0.05em" }}>WE TREAT</p>
            <h2 className="text-gray-900" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800 }}>
              All Your Beloved Pets
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: "Dogs", img: dogImage, desc: "From puppies to senior dogs, we provide full-spectrum canine care." },
              { name: "Cats", img: catImage, desc: "Feline-friendly environment with specialists who understand cats." },
              { name: "Small Animals", img: rabbitImage, desc: "Rabbits, birds, reptiles and more — we welcome all small friends." },
            ].map(({ name, img, desc }) => (
              <div key={name} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
                <div className="h-48 overflow-hidden">
                  <ImageWithFallback
                    src={img}
                    alt={name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-gray-900 mb-1" style={{ fontWeight: 700 }}>{name}</h3>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-teal-600 text-sm mb-2" style={{ fontWeight: 600, letterSpacing: "0.05em" }}>TESTIMONIALS</p>
            <h2 className="text-gray-900" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800 }}>
              What Pet Parents Are Saying
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-teal-600 rounded-full flex items-center justify-center text-white text-xs" style={{ fontWeight: 700 }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-gray-900 text-sm" style={{ fontWeight: 600 }}>{t.name}</p>
                    <p className="text-gray-500" style={{ fontSize: "0.7rem" }}>{t.pet}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-teal-700 py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-white mb-3" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800 }}>
            Ready to Schedule Your Pet's Visit?
          </h2>
          <p className="text-teal-200 mb-7 text-lg">
            Book online in under 2 minutes. No phone calls needed.
          </p>
          <Link
            to="/book"
            className="inline-flex items-center gap-2 bg-white text-teal-700 px-8 py-3.5 rounded-xl hover:bg-teal-50 transition-all"
            style={{ fontWeight: 700 }}
          >
            Book an Appointment <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
