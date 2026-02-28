import HeroModule from './modules/HeroModule';
import StatsModule from './modules/StatsModule';
import MembersModule from './modules/MembersModule';
import PostsModule from './modules/PostsModule';
import CompetitionsModule from './modules/CompetitionsModule';
import AboutModule from './modules/AboutModule';
import GalleryModule from './modules/GalleryModule';
import RobotsModule from './modules/RobotsModule';
import CountdownModule from './modules/CountdownModule';
import SocialModule from './modules/SocialModule';

const MODULES = {
  hero: HeroModule,
  stats: StatsModule,
  members: MembersModule,
  posts: PostsModule,
  competitions: CompetitionsModule,
  about: AboutModule,
  gallery: GalleryModule,
  robots: RobotsModule,
  countdown: CountdownModule,
  social: SocialModule
};

/**
 * Renders a single module by type with shared props.
 */
export default function ModuleRenderer({ module, team, stats, isEditing, onConfigChange, accentColor }) {
  const Component = MODULES[module.type];

  if (!Component) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-400 text-sm">
        Módulo desconocido: <code>{module.type}</code>
      </div>
    );
  }

  return (
    <Component
      team={team}
      stats={stats}
      config={module.config || {}}
      isEditing={isEditing}
      onConfigChange={(newConfig) => onConfigChange?.(module.id, newConfig)}
      accentColor={accentColor}
    />
  );
}
