import { NavLink } from 'react-router-dom';

const sections = [
  { to: '/', label: 'Visión general', description: 'Qué es RobEurope' },
  { to: '/competitions', label: 'Competiciones', description: 'Clasificatorios, finales y streaming' },
  { to: '/contact', label: 'Contacto', description: 'Mentores, sponsors y prensa' },
  { to: '/terms', label: 'Términos & Políticas', description: 'Operación transparente' },
  { to: '/profile', label: 'Perfil de usuario', description: 'Gestión de cuenta' }
];

const Sidebar = () => (
  <aside className="hidden w-60 flex-shrink-0 flex-col gap-3 text-sm lg:flex">
    {sections.map((section) => (
      <NavLink
        key={section.to}
        to={section.to}
        className={({ isActive }) =>
          `rounded-2xl border border-slate-200 p-4 transition hover:border-slate-900 ${
            isActive ? 'border-slate-900 bg-white shadow-sm' : 'bg-white'
          }`
        }
      >
        <p className="text-[0.6rem] uppercase tracking-[0.4em] text-slate-400">Sección</p>
        <h3 className="text-base font-semibold text-slate-900">{section.label}</h3>
        <p className="text-xs text-slate-500">{section.description}</p>
      </NavLink>
    ))}
  </aside>
);

export default Sidebar;
