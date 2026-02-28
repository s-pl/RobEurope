import HeroModule         from './modules/HeroModule';
import StatsModule        from './modules/StatsModule';
import MembersModule      from './modules/MembersModule';
import PostsModule        from './modules/PostsModule';
import CompetitionsModule from './modules/CompetitionsModule';
import RichTextModule     from './modules/RichTextModule';
import CustomStatsModule  from './modules/CustomStatsModule';
import GalleryModule      from './modules/GalleryModule';
import RobotsModule       from './modules/RobotsModule';
import CountdownModule    from './modules/CountdownModule';
import SocialModule       from './modules/SocialModule';

const COMPONENTS = {
  hero:         HeroModule,
  stats:        StatsModule,
  members:      MembersModule,
  posts:        PostsModule,
  competitions: CompetitionsModule,
  richtext:     RichTextModule,
  customstats:  CustomStatsModule,
  about:        RichTextModule,   // legacy alias
  gallery:      GalleryModule,
  robots:       RobotsModule,
  countdown:    CountdownModule,
  social:       SocialModule,
};

export default function ModuleRenderer({ module: mod, team, stats, isEditing, onConfigChange, accentColor }) {
  const Component = COMPONENTS[mod.type];
  if (!Component) {
    return (
      <div className="border border-zinc-200 rounded-lg p-4 text-sm text-zinc-400">
        Módulo desconocido: <code className="font-mono">{mod.type}</code>
      </div>
    );
  }
  return (
    <Component
      team={team}
      stats={stats}
      config={mod.config || {}}
      isEditing={isEditing}
      onConfigChange={(newConfig) => onConfigChange?.(mod.id, newConfig)}
      accentColor={accentColor || '#18181b'}
    />
  );
}
