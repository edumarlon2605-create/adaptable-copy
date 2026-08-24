import { Link } from "@tanstack/react-router";
import { Mail, Phone, MessageCircle, Building2, MapPin, Clock, FileText } from "lucide-react";
import { useWhatsapp } from "@/lib/whatsapp-config";




export function SiteFooter() {
  const { url: WHATSAPP_URL } = useWhatsapp();
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/favicon-512.png"
                alt="BBC Consórcios"
                className="h-10 w-10 rounded-xl object-contain"
              />
              <div className="leading-tight">
                <div className="font-display font-bold text-lg">BBC</div>
                <div className="text-[10px] uppercase tracking-widest opacity-70">Consórcios</div>
              </div>
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              Consórcios planejados, seguros e transparentes. Regulamentados pelo Banco Central do Brasil.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Consórcio</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/consorcio/o-que-e" className="hover:opacity-100">O que é Consórcio</Link></li>
              <li><Link to="/consorcio/como-funciona" className="hover:opacity-100">Como Funciona</Link></li>
              <li><Link to="/consorcio/vantagens" className="hover:opacity-100">Vantagens</Link></li>
            </ul>
            <div className="mt-6">
              <img
                src="/selo-ra-2025-oficial.png"
                alt="Prêmio RA 2025 - Empresa Indicada"
                loading="lazy"
                className="mx-auto h-auto w-full max-w-[260px]"
              />
            </div>
          </div>


          <div>
            <h4 className="font-semibold mb-4">Institucional</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/sobre/historia" className="hover:opacity-100">Nossa História</Link></li>
              <li><Link to="/depoimentos" className="hover:opacity-100">Depoimentos</Link></li>
              <li><Link to="/trabalhe-conosco" className="hover:opacity-100">Trabalhe Conosco</Link></li>
              <li><Link to="/lgpd" className="hover:opacity-100">LGPD</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-sm opacity-80">
              <li>
                <a href="tel:+551140966541" className="flex items-center gap-2 hover:opacity-100">
                  <Phone className="h-4 w-4" /> (11) 4096-6541
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> atendimento@bbcconsorcios.com.br
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-4 py-2 font-medium text-white hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/15">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-sm opacity-90">
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 mt-0.5 opacity-70 shrink-0" />
              <div>
                <p className="font-medium">BBC Administradora de Consórcios Ltda</p>
                <p className="text-xs opacity-70 mt-1">Regulamentada pelo Banco Central do Brasil</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 mt-0.5 opacity-70 shrink-0" />
              <div>
                <p className="font-medium">CNPJ</p>
                <p className="opacity-80">36.770.683/0001-03</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 opacity-70 shrink-0" />
              <div>
                <p className="font-medium">Endereço</p>
                <p className="opacity-80">R. Dr. Renato Paes de Barros, 1017</p>
                <p className="opacity-80">Itaim Bibi – São Paulo/SP</p>
                <p className="opacity-80">CEP: 04530-001</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 mt-0.5 opacity-70 shrink-0" />
              <div>
                <p className="font-medium">Horário de Atendimento</p>
                <p className="opacity-80">Segunda a Sexta-feira</p>
                <p className="opacity-80">das 09h às 18h</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs opacity-60">
            <p>© {new Date().getFullYear()} BBC Consórcios. Todos os direitos reservados.</p>
            <p>Administradora de consórcios regulamentada pelo Banco Central do Brasil.</p>
          </div>

        </div>
      </div>
    </footer>
  );
}

export function WhatsappFloat() {
  const { url: WHATSAPP_URL } = useWhatsapp();
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco no WhatsApp"
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[var(--color-whatsapp)] text-white shadow-elegant hover:scale-105 transition-transform group"
    >
      <span className="absolute inset-0 rounded-full bg-[var(--color-whatsapp)] animate-ping opacity-20" />
      <span className="relative hidden sm:inline pl-4 pr-2 text-sm font-medium">Fale no WhatsApp</span>
      <span className="relative grid h-14 w-14 place-items-center">
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.216-1.365-.867-1.365-.867-.149-.272-.298-.51-.405-.867-.149-.272-.05-1.093-.05-1.093s-.204-.374-.51-.544c-.34-.187-.544-.272-.884-.272-.34 0-.646.102-.884.272-.34.17-.51.544-.51.544s-.102.82-.05 1.093c.102.357.238.595.405.867.136.272.867 1.365 1.365 1.365.17.136.374.238.578.34.204.102.442.17.68.17.238 0 .476-.068.68-.17.204-.102.408-.204.578-.34.272-.204 1.093-.816 1.365-1.058.272-.238.51-.476.578-.816.068-.34 0-.68-.102-1.058zM12 2C6.477 2 2 6.477 2 12c0 1.89.544 3.66 1.48 5.166L2 22l4.908-1.462A9.935 9.935 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.095a8.057 8.057 0 01-4.122-1.128l-.296-.17-3.06.912.816-3.026-.204-.306A8.075 8.075 0 013.905 12c0-4.462 3.633-8.095 8.095-8.095 4.462 0 8.095 3.633 8.095 8.095 0 4.462-3.633 8.095-8.095 8.095z" />
        </svg>
      </span>
    </a>
  );
}
