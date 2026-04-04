import prisma from '../lib/prisma.js';

export const getStats = async (req, res) => {
  try {
    const [teamsCount, competitionsCount, usersCount, countriesCount, centersCount] = await Promise.all([
      prisma.team.count(),
      prisma.competition.count(),
      prisma.user.count(),
      prisma.country.count(),
      prisma.educationalCenter.count()
    ]);

    res.json({
      teams: teamsCount,
      competitions: competitionsCount,
      users: usersCount,
      countries: countriesCount,
      centers: centersCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch stats' });
  }
};
