import { useState } from "react";
import { Mail, Phone, MapPin, Camera, Globe, MessageCircle } from "lucide-react";
import type { useToast } from "../../hooks/useToast";

export default function ContactoSection({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("¡Mensaje enviado! Te contactaremos pronto.");
    setNombre("");
    setEmail("");
    setMensaje("");
  };

  return (
    <section id="contacto" className="bg-[#1E1B2E] py-20 text-white">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="mb-12 text-center text-3xl font-extrabold sm:text-4xl">¿Tienes preguntas? Escríbenos</h2>

        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-5">
            <a href="mailto:hola@welve.pe" className="flex items-center gap-3 text-white/80 transition-colors hover:text-white">
              <Mail size={18} className="text-welve-400" /> hola@welve.pe
            </a>
            <a href="tel:+51999888777" className="flex items-center gap-3 text-white/80 transition-colors hover:text-white">
              <Phone size={18} className="text-welve-400" /> +51 999 888 777
            </a>
            <p className="flex items-center gap-3 text-white/80">
              <MapPin size={18} className="text-welve-400" /> Lima, Perú
            </p>
            <div className="flex gap-3 pt-2">
              {[Camera, Globe, MessageCircle].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              placeholder="Nombre"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-welve-400"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-welve-400"
            />
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              required
              rows={4}
              placeholder="Mensaje"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-welve-400"
            />
            <button
              type="submit"
              className="w-full rounded-xl bg-welve-500 py-3 text-sm font-bold text-white transition-all duration-150 hover:bg-welve-600 active:scale-[0.97]"
            >
              Enviar mensaje
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
