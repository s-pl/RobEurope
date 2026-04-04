/**
 * @fileoverview
 * Mock backend responses for offline/demo mode.
 */

const nowIso = () => new Date().toISOString();

let mockUser = {
  id: 'demo-user-001',
  email: 'demo@robeurope.eu',
  first_name: 'Demo',
  last_name: 'User',
  username: 'demouser',
  role: 'user',
  profile_photo_url: ''
};

let mockCountries = [
  { id: 1, name: 'España' },
  { id: 2, name: 'Portugal' },
  { id: 3, name: 'Francia' }
];

let mockCompetitions = [
  {
    id: 1,
    title: 'Copa RobEurope 2026',
    description: 'Competición internacional con desafíos de robótica educativa y pruebas de innovación tecnológica.',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 16).toISOString(),
    max_teams: 24,
    teams_registered: 12,
    status: 'published',
    is_active: true,
    is_approved: true,
    website_url: 'https://robeurope.eu'
  },
  {
    id: 2,
    title: 'RobEurope Junior Lab',
    description: 'Categoría junior con retos guiados y mentorías especializadas.',
    start_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
    end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 31).toISOString(),
    max_teams: 16,
    teams_registered: 8,
    status: 'draft',
    is_active: false,
    is_approved: false,
    website_url: 'https://robeurope.eu/junior'
  }
];

let mockTeams = [
  {
    id: 1,
    name: 'Equipo Demo Centro',
    city: 'Madrid',
    description: 'Equipo de ejemplo para presentar el flujo de registro.',
    website_url: 'https://demo-team.robeurope.eu',
    country_id: 1,
    logo_url: ''
  },
  {
    id: 2,
    name: 'RoboNova',
    city: 'Porto',
    description: 'Equipo universitario centrado en robótica móvil.',
    website_url: 'https://robonova.example.com',
    country_id: 2,
    logo_url: ''
  }
];

let mockTeamMembers = [
  { id: 1, team_id: 1, user_id: mockUser.id, user_username: mockUser.username, user_photo: '', role: 'owner' },
  { id: 2, team_id: 1, user_id: 'demo-student', user_username: 'student1', user_photo: '', role: 'member' }
];

let mockRegistrations = [
  {
    id: 1,
    team_id: 1,
    competition_id: 1,
    status: 'approved',
    center_approval_status: 'approved',
    center_approval_reason: '',
    registration_date: nowIso(),
    Team: mockTeams[0]
  }
];

let mockStreams = [
  {
    id: 1,
    title: 'RobEurope Arena - Día 1',
    stream_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    competition_id: 1,
    team_id: 1,
    status: 'live'
  }
];

let mockPosts = [
  {
    id: 1,
    title: 'Bienvenidos a RobEurope 2026',
    content: '<p>Presentamos la nueva temporada con retos renovados y más oportunidades de aprendizaje.</p>',
    image_url: '',
    created_at: nowIso(),
    author_id: mockUser.id,
    is_pinned: true,
    PostLikes: [{ user_id: mockUser.id }],
    Comments: [{ id: 1 }]
  },
  {
    id: 2,
    title: 'Apertura de inscripciones',
    content: '<p>Las inscripciones ya están abiertas. Reserva tu plaza antes del 30 de abril.</p>',
    image_url: '',
    created_at: nowIso(),
    author_id: mockUser.id,
    is_pinned: false,
    PostLikes: [],
    Comments: []
  }
];

let mockComments = {
  1: [
    {
      id: 1,
      post_id: 1,
      content: '¡Qué ganas de empezar!',
      user_id: mockUser.id,
      created_at: nowIso()
    }
  ]
};

let mockSponsors = [
  { id: 1, name: 'TechNova', logo_url: 'https://placehold.co/80x40?text=Tech', website_url: 'https://technova.example.com' },
  { id: 2, name: 'RoboLabs', logo_url: 'https://placehold.co/80x40?text=Robo', website_url: 'https://robolabs.example.com' }
];

let mockGallery = [
  { id: 1, url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80', title: 'Expo 2025', description: 'Zona de pruebas', original_name: 'expo.jpg' },
  { id: 2, url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80', title: 'Talleres', description: 'Mentorías en vivo', original_name: 'workshop.jpg' }
];

let mockArchives = [
  {
    id: 1,
    title: 'Guía de participación',
    description: 'Documento con reglas y requisitos.',
    content_type: 'file',
    visibility: 'public',
    file_name: 'guia-participacion.pdf',
    file_url: '/uploads/mock/guia-participacion.pdf',
    created_at: nowIso(),
    Competition: { id: 1, title: 'Copa RobEurope 2026' }
  }
];

let mockEducationalCenters = [
  {
    id: 1,
    name: 'Centro Demo RobEurope',
    city: 'Madrid',
    email: 'centro.demo@example.com',
    website_url: 'https://demo-center.example.com',
    approval_status: 'approved'
  }
];

let mockNotifications = [
  {
    id: 1,
    title: 'Invitación a equipo',
    message: 'RoboNova te ha invitado a colaborar.',
    is_read: false,
    type: 'team_invite',
    meta: { invite_token: 'demo-invite-token' }
  }
];

const favorites = new Set([1]);

const withDelay = async (payload) => {
  await new Promise((r) => setTimeout(r, 120));
  return payload;
};

const parseJsonBody = (body) => {
  if (!body) return {};
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const data = {};
    for (const [key, value] of body.entries()) {
      data[key] = value;
    }
    return data;
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
};

export async function mockApiRequest(path, { method = 'GET', body } = {}) {
  const [pathname, queryString] = path.split('?');
  const query = new URLSearchParams(queryString || '');
  const upperMethod = method.toUpperCase();

  if (pathname === '/auth/login' && upperMethod === 'POST') {
    return withDelay({ user: mockUser });
  }
  if (pathname === '/auth/register' && upperMethod === 'POST') {
    const payload = parseJsonBody(body);
    mockUser = { ...mockUser, ...payload };
    return withDelay({ user: mockUser });
  }
  if (pathname === '/auth/logout') {
    return withDelay({ ok: true });
  }
  if (pathname === '/auth/change-password') {
    return withDelay({ ok: true });
  }

  if (pathname === '/users/me') {
    if (upperMethod === 'PATCH') {
      const payload = parseJsonBody(body);
      mockUser = { ...mockUser, ...payload };
      return withDelay(mockUser);
    }
    return withDelay(mockUser);
  }

  if (pathname === '/users') {
    const q = query.get('q') || '';
    const users = [
      mockUser,
      { id: 'demo-mentor', username: 'mentor1', first_name: 'Mentor', last_name: 'Demo', email: 'mentor@robeurope.eu', role: 'user' },
      { id: 'demo-student', username: 'student1', first_name: 'Alumno', last_name: 'Demo', email: 'student@robeurope.eu', role: 'user' }
    ].filter((u) => u.username?.includes(q) || u.email?.includes(q));
    return withDelay(users);
  }

  if (pathname === '/countries') {
    return withDelay(mockCountries);
  }

  if (pathname === '/competitions') {
    if (upperMethod === 'POST') {
      const payload = parseJsonBody(body);
      const newItem = {
        id: mockCompetitions.length + 1,
        status: 'draft',
        teams_registered: 0,
        is_approved: false,
        ...payload
      };
      mockCompetitions = [newItem, ...mockCompetitions];
      return withDelay(newItem);
    }
    const q = query.get('q') || '';
    const isActive = query.get('is_active');
    const filtered = mockCompetitions.filter((c) =>
      (!q || c.title.toLowerCase().includes(q.toLowerCase())) &&
      (!isActive || String(c.is_active) === isActive)
    );
    return withDelay(filtered);
  }

  if (pathname === '/competitions/favorites/mine') {
    return withDelay(mockCompetitions.filter((c) => favorites.has(c.id)));
  }

  if (pathname.startsWith('/competitions/') && pathname.endsWith('/favorite')) {
    const id = Number(pathname.split('/')[2]);
    if (upperMethod === 'POST') favorites.add(id);
    if (upperMethod === 'DELETE') favorites.delete(id);
    return withDelay({ ok: true });
  }

  if (pathname.startsWith('/competitions/')) {
    const id = Number(pathname.split('/')[2]);
    if (upperMethod === 'PUT') {
      const payload = parseJsonBody(body);
      mockCompetitions = mockCompetitions.map((c) => (c.id === id ? { ...c, ...payload } : c));
      return withDelay(mockCompetitions.find((c) => c.id === id));
    }
    return withDelay(mockCompetitions.find((c) => c.id === id));
  }

  if (pathname === '/teams/status') {
    return withDelay({ ownedTeamId: mockTeams[0]?.id || null, memberOfTeamId: mockTeams[0]?.id || null });
  }

  if (pathname === '/teams/mine') {
    return withDelay(mockTeams[0] || null);
  }

  if (pathname === '/teams') {
    if (upperMethod === 'POST') {
      const payload = parseJsonBody(body);
      const newTeam = { id: mockTeams.length + 1, ...payload };
      mockTeams = [newTeam, ...mockTeams];
      return withDelay(newTeam);
    }
    const q = query.get('q') || '';
    const countryId = query.get('country_id');
    const filtered = mockTeams.filter((t) =>
      (!q || t.name.toLowerCase().includes(q.toLowerCase())) &&
      (!countryId || String(t.country_id) === countryId)
    );
    return withDelay(filtered);
  }

  if (pathname.match(/^\/teams\/(\d+)\/invite$/)) {
    return withDelay({ ok: true });
  }

  if (pathname === '/teams/invitations/accept' || pathname === '/teams/invitations/decline') {
    return withDelay({ ok: true });
  }

  if (pathname.match(/^\/teams\/(\d+)\/requests$/)) {
    if (upperMethod === 'POST') {
      return withDelay({ id: Date.now(), status: 'pending', user_id: mockUser.id, user_username: mockUser.username });
    }
    return withDelay([]);
  }

  if (pathname.match(/^\/teams\/requests\/(\d+)\/approve$/)) {
    return withDelay({ ok: true });
  }

  if (pathname.match(/^\/teams\/(\d+)\/register-competition$/)) {
    const payload = parseJsonBody(body);
    const newReg = {
      id: mockRegistrations.length + 1,
      team_id: Number(pathname.split('/')[2]),
      competition_id: payload?.competition_id,
      status: 'pending',
      center_approval_status: 'pending',
      center_approval_reason: ''
    };
    mockRegistrations = [...mockRegistrations, newReg];
    return withDelay(newReg);
  }

  if (pathname.match(/^\/teams\/(\d+)$/)) {
    const id = Number(pathname.split('/')[2]);
    if (upperMethod === 'PUT') {
      const payload = parseJsonBody(body);
      mockTeams = mockTeams.map((t) => (t.id === id ? { ...t, ...payload } : t));
      return withDelay(mockTeams.find((t) => t.id === id));
    }
    if (upperMethod === 'DELETE') {
      mockTeams = mockTeams.filter((t) => t.id !== id);
      return withDelay({ ok: true });
    }
  }

  if (pathname === '/team-members') {
    const teamId = Number(query.get('team_id'));
    return withDelay(mockTeamMembers.filter((m) => m.team_id === teamId));
  }

  if (pathname.match(/^\/team-members\/(\d+)$/) && upperMethod === 'DELETE') {
    const id = Number(pathname.split('/')[2]);
    mockTeamMembers = mockTeamMembers.filter((m) => m.id !== id);
    return withDelay({ ok: true });
  }

  if (pathname === '/teams/leave') {
    return withDelay({ ok: true });
  }

  if (pathname === '/registrations') {
    if (upperMethod === 'POST') {
      const payload = parseJsonBody(body);
      const newReg = { id: mockRegistrations.length + 1, status: 'pending', center_approval_status: 'pending', ...payload };
      mockRegistrations = [...mockRegistrations, newReg];
      return withDelay(newReg);
    }
    const teamId = query.get('team_id');
    const competitionId = query.get('competition_id');
    const filtered = mockRegistrations.filter((r) =>
      (!teamId || String(r.team_id) === teamId) && (!competitionId || String(r.competition_id) === competitionId)
    );
    return withDelay(filtered);
  }

  if (pathname.match(/^\/registrations\/(\d+)\/approve$/)) {
    return withDelay({ ok: true });
  }

  if (pathname.match(/^\/registrations\/(\d+)\/reject$/)) {
    return withDelay({ ok: true });
  }

  if (pathname === '/streams') {
    if (upperMethod === 'POST') {
      const payload = parseJsonBody(body);
      const newStream = { id: mockStreams.length + 1, status: 'scheduled', ...payload };
      mockStreams = [...mockStreams, newStream];
      return withDelay(newStream);
    }
    const competitionId = query.get('competition_id');
    return withDelay(mockStreams.filter((s) => !competitionId || String(s.competition_id) === competitionId));
  }

  if (pathname.match(/^\/streams\/(\d+)$/)) {
    const id = Number(pathname.split('/')[2]);
    if (upperMethod === 'PUT') {
      const payload = parseJsonBody(body);
      mockStreams = mockStreams.map((s) => (s.id === id ? { ...s, ...payload } : s));
      return withDelay(mockStreams.find((s) => s.id === id));
    }
    if (upperMethod === 'DELETE') {
      mockStreams = mockStreams.filter((s) => s.id !== id);
      return withDelay({ ok: true });
    }
  }

  if (pathname === '/posts') {
    if (upperMethod === 'POST') {
      const payload = parseJsonBody(body);
      const newPost = {
        id: mockPosts.length + 1,
        title: payload?.title || 'Nuevo post',
        content: payload?.content || '',
        created_at: nowIso(),
        author_id: mockUser.id,
        is_pinned: false,
        PostLikes: [],
        Comments: []
      };
      mockPosts = [newPost, ...mockPosts];
      return withDelay(newPost);
    }
    const q = query.get('q') || '';
    return withDelay(mockPosts.filter((p) => !q || p.title.toLowerCase().includes(q.toLowerCase())));
  }

  if (pathname.match(/^\/posts\/(\d+)\/comments$/)) {
    const id = Number(pathname.split('/')[2]);
    if (upperMethod === 'POST') {
      const payload = parseJsonBody(body);
      const newComment = { id: Date.now(), post_id: id, content: payload?.content || '', user_id: mockUser.id, created_at: nowIso() };
      mockComments[id] = [...(mockComments[id] || []), newComment];
      return withDelay(newComment);
    }
    return withDelay(mockComments[id] || []);
  }

  if (pathname.match(/^\/posts\/(\d+)\/like$/)) {
    return withDelay({ liked: true });
  }

  if (pathname.match(/^\/posts\/(\d+)\/pin$/)) {
    const id = Number(pathname.split('/')[2]);
    const post = mockPosts.find((p) => p.id === id);
    if (post) post.is_pinned = !post.is_pinned;
    return withDelay({ is_pinned: post?.is_pinned ?? false });
  }

  if (pathname.match(/^\/posts\/(\d+)$/) && upperMethod === 'PUT') {
    const id = Number(pathname.split('/')[2]);
    const payload = parseJsonBody(body);
    mockPosts = mockPosts.map((p) => (p.id === id ? { ...p, ...payload } : p));
    return withDelay(mockPosts.find((p) => p.id === id));
  }

  if (pathname.match(/^\/posts\/(\d+)$/) && upperMethod === 'DELETE') {
    const id = Number(pathname.split('/')[2]);
    mockPosts = mockPosts.filter((p) => p.id !== id);
    return withDelay({ ok: true });
  }

  if (pathname === '/sponsors') {
    if (upperMethod === 'POST') {
      const payload = parseJsonBody(body);
      const newSponsor = { id: mockSponsors.length + 1, ...payload };
      mockSponsors = [...mockSponsors, newSponsor];
      return withDelay(newSponsor);
    }
    return withDelay(mockSponsors);
  }

  if (pathname.match(/^\/sponsors\/(\d+)$/)) {
    const id = Number(pathname.split('/')[2]);
    if (upperMethod === 'PUT') {
      const payload = parseJsonBody(body);
      mockSponsors = mockSponsors.map((s) => (s.id === id ? { ...s, ...payload } : s));
      return withDelay(mockSponsors.find((s) => s.id === id));
    }
    if (upperMethod === 'DELETE') {
      mockSponsors = mockSponsors.filter((s) => s.id !== id);
      return withDelay({ ok: true });
    }
    return withDelay(mockSponsors.find((s) => s.id === id));
  }

  if (pathname === '/gallery') {
    if (upperMethod === 'POST') {
      const newItem = {
        id: mockGallery.length + 1,
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
        title: 'Nuevo recurso',
        description: 'Carga simulada en modo mockup',
        original_name: 'mock.jpg'
      };
      mockGallery = [newItem, ...mockGallery];
      return withDelay(newItem);
    }
    return withDelay({ items: mockGallery });
  }

  if (pathname.match(/^\/gallery\/(\d+)$/) && upperMethod === 'DELETE') {
    const id = Number(pathname.split('/')[2]);
    mockGallery = mockGallery.filter((g) => g.id !== id);
    return withDelay({ ok: true });
  }

  if (pathname === '/archives') {
    if (upperMethod === 'POST') {
      const payload = parseJsonBody(body);
      const newArchive = {
        id: mockArchives.length + 1,
        title: payload?.title || 'Archivo nuevo',
        description: payload?.description || '',
        content_type: payload?.file_type || 'file',
        visibility: payload?.visibility || 'public',
        file_name: payload?.file?.name || 'archivo-demo.pdf',
        file_url: '/uploads/mock/archivo-demo.pdf',
        created_at: nowIso(),
        Competition: payload?.competition_id
          ? { id: Number(payload.competition_id), title: mockCompetitions.find((c) => c.id === Number(payload.competition_id))?.title || 'Competición' }
          : null
      };
      mockArchives = [newArchive, ...mockArchives];
      return withDelay(newArchive);
    }
    const competitionId = query.get('competition_id');
    const filtered = mockArchives.filter((a) => !competitionId || String(a.Competition?.id) === competitionId);
    return withDelay({ items: filtered });
  }

  if (pathname.match(/^\/archives\/(\d+)$/)) {
    const id = Number(pathname.split('/')[2]);
    if (upperMethod === 'PUT') {
      const payload = parseJsonBody(body);
      mockArchives = mockArchives.map((a) => (a.id === id ? { ...a, ...payload } : a));
      return withDelay(mockArchives.find((a) => a.id === id));
    }
    if (upperMethod === 'DELETE') {
      mockArchives = mockArchives.filter((a) => a.id !== id);
      return withDelay({ ok: true });
    }
  }

  if (pathname === '/educational-centers') {
    if (upperMethod === 'POST') {
      const payload = parseJsonBody(body);
      const newCenter = { id: mockEducationalCenters.length + 1, approval_status: 'pending', ...payload };
      mockEducationalCenters = [newCenter, ...mockEducationalCenters];
      return withDelay(newCenter);
    }
    const status = query.get('status');
    const items = !status ? mockEducationalCenters : mockEducationalCenters.filter((c) => c.approval_status === status);
    return withDelay({ items });
  }

  if (pathname.match(/^\/educational-centers\/(\d+)\/approve$/)) {
    const id = Number(pathname.split('/')[2]);
    mockEducationalCenters = mockEducationalCenters.map((c) => (c.id === id ? { ...c, approval_status: 'approved' } : c));
    return withDelay({ ok: true });
  }

  if (pathname.match(/^\/educational-centers\/(\d+)\/reject$/)) {
    const id = Number(pathname.split('/')[2]);
    mockEducationalCenters = mockEducationalCenters.map((c) => (c.id === id ? { ...c, approval_status: 'rejected' } : c));
    return withDelay({ ok: true });
  }

  if (pathname.match(/^\/educational-centers\/(\d+)\/teams$/)) {
    return withDelay({ items: mockTeams });
  }

  if (pathname.match(/^\/educational-centers\/(\d+)\/users$/)) {
    return withDelay({ items: [mockUser] });
  }

  if (pathname.match(/^\/educational-centers\/(\d+)\/teams\/(\d+)$/) && upperMethod === 'DELETE') {
    return withDelay({ ok: true });
  }

  if (pathname.match(/^\/educational-centers\/(\d+)\/users\/(.+)$/) && upperMethod === 'DELETE') {
    return withDelay({ ok: true });
  }

  if (pathname.match(/^\/educational-centers\/(\d+)$/)) {
    const id = Number(pathname.split('/')[2]);
    if (upperMethod === 'PUT') {
      const payload = parseJsonBody(body);
      mockEducationalCenters = mockEducationalCenters.map((c) => (c.id === id ? { ...c, ...payload } : c));
      return withDelay(mockEducationalCenters.find((c) => c.id === id));
    }
    if (upperMethod === 'DELETE') {
      mockEducationalCenters = mockEducationalCenters.filter((c) => c.id !== id);
      return withDelay({ ok: true });
    }
  }

  if (pathname === '/registrations/my-center') {
    return withDelay(mockRegistrations);
  }

  if (pathname.match(/^\/registrations\/(\d+)\/center-approve$/)) {
    return withDelay({ ok: true });
  }

  if (pathname.match(/^\/registrations\/(\d+)\/center-reject$/)) {
    return withDelay({ ok: true });
  }

  if (pathname === '/admin/center-requests') {
    return withDelay([
      {
        id: 1,
        status: 'pending',
        request_type: 'create_center',
        decision_reason: '',
        created_at: nowIso(),
        requestingUser: mockUser,
        center: mockEducationalCenters[0]
      }
    ]);
  }

  if (pathname.match(/^\/admin\/center-requests\/(\d+)\/approve$/)) {
    return withDelay({ ok: true });
  }

  if (pathname.match(/^\/admin\/center-requests\/(\d+)\/reject$/)) {
    return withDelay({ ok: true });
  }

  if (pathname === '/notifications') {
    return withDelay(mockNotifications);
  }

  if (pathname.match(/^\/notifications\/(\d+)$/)) {
    const id = Number(pathname.split('/')[2]);
    mockNotifications = mockNotifications.map((n) => (n.id === id ? { ...n, is_read: true } : n));
    return withDelay({ ok: true });
  }

  if (pathname === '/robot-files') {
    return withDelay([
      {
        id: 1,
        file_name: 'Manual de diseño',
        file_url: '/uploads/mock/manual.pdf',
        description: 'Documento de referencia para el desafío.',
        Team: { name: mockTeams[0]?.name || 'Equipo Demo' }
      }
    ]);
  }

  return withDelay(Array.isArray(body) ? body : { ok: true });
}
