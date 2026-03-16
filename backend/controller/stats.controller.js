import db from '../models/index.js';

export const getStats = async (req, res) => {
  try {
    const [teamsCount, competitionsCount, usersCount, countriesCount, centersCount] = await Promise.all([
      db.Team.count(),
      db.Competition.count(),
      db.User.count(),
      db.Country.count(),
      db.EducationalCenter ? db.EducationalCenter.count() : Promise.resolve(0)
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
