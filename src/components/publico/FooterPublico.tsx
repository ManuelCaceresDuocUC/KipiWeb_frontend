import { Link } from 'react-router-dom';
import { Mail, MessageCircle, Phone } from 'lucide-react';
import { CONTACTO, enlaceCorreo, enlaceWhatsApp } from '../../config/contacto';
import { Logo } from './Logo';

export const FooterPublico = () => (
  <footer id="contacto" className="bg-slate-900 text-slate-300 scroll-mt-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
      <div className="space-y-3">
        <Logo claro />
        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
          Sistema de punto de venta e inventario en la nube para comercios de Chile.
        </p>
      </div>

      <div className="space-y-3 text-sm">
        <h3 className="text-white font-semibold">Producto</h3>
        <ul className="space-y-2">
          <li><Link to="/#funciones" className="hover:text-white">Funciones</Link></li>
          <li><Link to="/planes" className="hover:text-white">Planes y precios</Link></li>
          <li><Link to="/#preguntas" className="hover:text-white">Preguntas frecuentes</Link></li>
          <li><Link to="/login" className="hover:text-white">Iniciar sesión</Link></li>
          <li><Link to="/registroempresa" className="hover:text-white">Crear cuenta</Link></li>
        </ul>
      </div>

      <div className="space-y-3 text-sm">
        <h3 className="text-white font-semibold">Contacto</h3>
        <ul className="space-y-2.5">
          <li>
            <a href={enlaceCorreo()} className="inline-flex items-center gap-2 hover:text-white">
              <Mail className="w-4 h-4" /> {CONTACTO.correo}
            </a>
          </li>
          <li>
            <a href={`tel:${CONTACTO.telefono.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 hover:text-white">
              <Phone className="w-4 h-4" /> {CONTACTO.telefono}
            </a>
          </li>
          <li>
            <a
              href={enlaceWhatsApp('Hola, quiero información sobre KIPI')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 hover:text-white"
            >
              <MessageCircle className="w-4 h-4" /> Escríbenos por WhatsApp
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-slate-800">
      <p className="max-w-6xl mx-auto px-4 sm:px-8 py-5 text-xs text-slate-500">
        © {new Date().getFullYear()} KIPI. Todos los derechos reservados.
      </p>
    </div>
  </footer>
);
