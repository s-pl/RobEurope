import sequelize from '../controller/db.controller.js';
import { DataTypes } from 'sequelize';

// Import model definitions
import defineUser from './user.model.js';
import defineCountry from './country.model.js';
import defineTeam from './team.model.js';
import defineTeamMember from './teamMember.model.js';
import defineCompetition from './competition.model.js';
import defineRegistration from './registration.model.js';
import defineStream from './stream.model.js';
import defineStreamTeam from './streamTeam.model.js';
import defineStreamCompetition from './streamCompetition.model.js';
import defineTeamSocial from './teamSocial.model.js';
import defineGlobalPost from './globalPost.model.js';
import defineCompetitionPost from './competitionPost.model.js';
import definePostLike from './postLike.model.js';
import defineChatMessage from './chatMessage.model.js';
import defineChatReaction from './chatReaction.model.js';
import defineMedia from './media.model.js';
import defineSponsor from './sponsor.model.js';
import defineSponsorCompetition from './sponsorCompetition.model.js';
import defineNotification from './notification.model.js';

const db = {};

db.sequelize = sequelize;
db.DataTypes = DataTypes;

// Initialize models
db.User = defineUser(sequelize, DataTypes);
db.Country = defineCountry(sequelize, DataTypes);
db.Team = defineTeam(sequelize, DataTypes);
db.TeamMember = defineTeamMember(sequelize, DataTypes);
db.Competition = defineCompetition(sequelize, DataTypes);
db.Registration = defineRegistration(sequelize, DataTypes);
db.Stream = defineStream(sequelize, DataTypes);
db.StreamTeam = defineStreamTeam(sequelize, DataTypes);
db.StreamCompetition = defineStreamCompetition(sequelize, DataTypes);
db.TeamSocial = defineTeamSocial(sequelize, DataTypes);
db.GlobalPost = defineGlobalPost(sequelize, DataTypes);
db.CompetitionPost = defineCompetitionPost(sequelize, DataTypes);
db.PostLike = definePostLike(sequelize, DataTypes);
db.ChatMessage = defineChatMessage(sequelize, DataTypes);
db.ChatReaction = defineChatReaction(sequelize, DataTypes);
db.Media = defineMedia(sequelize, DataTypes);
db.Sponsor = defineSponsor(sequelize, DataTypes);
db.SponsorCompetition = defineSponsorCompetition(sequelize, DataTypes);
db.Notification = defineNotification(sequelize, DataTypes);

// Associations
// Countries
db.Country.hasMany(db.User, { foreignKey: 'country_id' });
db.User.belongsTo(db.Country, { foreignKey: 'country_id' });

db.Country.hasMany(db.Team, { foreignKey: 'country_id' });
db.Team.belongsTo(db.Country, { foreignKey: 'country_id' });

// Teams and Members
db.Team.hasMany(db.TeamMember, { foreignKey: 'team_id' });
db.TeamMember.belongsTo(db.Team, { foreignKey: 'team_id' });
db.User.hasMany(db.TeamMember, { foreignKey: 'user_id' });
db.TeamMember.belongsTo(db.User, { foreignKey: 'user_id' });

// Teams created by user
db.User.hasMany(db.Team, { foreignKey: 'created_by_user_id' });
db.Team.belongsTo(db.User, { foreignKey: 'created_by_user_id' });

// Competitions
db.Competition.belongsTo(db.Country, { foreignKey: 'country_id' });
db.Country.hasMany(db.Competition, { foreignKey: 'country_id' });

// Registrations
db.Registration.belongsTo(db.Competition, { foreignKey: 'competition_id' });
db.Competition.hasMany(db.Registration, { foreignKey: 'competition_id' });
db.Registration.belongsTo(db.Team, { foreignKey: 'team_id' });
db.Team.hasMany(db.Registration, { foreignKey: 'team_id' });

// Streams and associations
db.Stream.hasMany(db.StreamTeam, { foreignKey: 'stream_id' });
db.StreamTeam.belongsTo(db.Stream, { foreignKey: 'stream_id' });
db.Team.hasMany(db.StreamTeam, { foreignKey: 'team_id' });
db.StreamTeam.belongsTo(db.Team, { foreignKey: 'team_id' });

db.Stream.hasMany(db.StreamCompetition, { foreignKey: 'stream_id' });
db.StreamCompetition.belongsTo(db.Stream, { foreignKey: 'stream_id' });
db.Competition.hasMany(db.StreamCompetition, { foreignKey: 'competition_id' });
db.StreamCompetition.belongsTo(db.Competition, { foreignKey: 'competition_id' });

// Team socials
db.Team.hasMany(db.TeamSocial, { foreignKey: 'team_id' });
db.TeamSocial.belongsTo(db.Team, { foreignKey: 'team_id' });

// Posts
db.User.hasMany(db.GlobalPost, { foreignKey: 'author_user_id' });
db.GlobalPost.belongsTo(db.User, { foreignKey: 'author_user_id' });

db.User.hasMany(db.CompetitionPost, { foreignKey: 'author_user_id' });
db.CompetitionPost.belongsTo(db.User, { foreignKey: 'author_user_id' });
db.Competition.hasMany(db.CompetitionPost, { foreignKey: 'competition_id' });
db.CompetitionPost.belongsTo(db.Competition, { foreignKey: 'competition_id' });
db.Team.hasMany(db.CompetitionPost, { foreignKey: 'team_id' });
db.CompetitionPost.belongsTo(db.Team, { foreignKey: 'team_id' });

// Post likes
db.PostLike.belongsTo(db.User, { foreignKey: 'user_id' });
db.User.hasMany(db.PostLike, { foreignKey: 'user_id' });

// Chat
db.Competition.hasMany(db.ChatMessage, { foreignKey: 'competition_id' });
db.ChatMessage.belongsTo(db.Competition, { foreignKey: 'competition_id' });
db.User.hasMany(db.ChatMessage, { foreignKey: 'user_id' });
db.ChatMessage.belongsTo(db.User, { foreignKey: 'user_id' });
db.ChatMessage.hasMany(db.ChatReaction, { foreignKey: 'message_id' });
db.ChatReaction.belongsTo(db.ChatMessage, { foreignKey: 'message_id' });

// Media
db.Competition.hasMany(db.Media, { foreignKey: 'competition_id' });
db.Team.hasMany(db.Media, { foreignKey: 'team_id' });
db.User.hasMany(db.Media, { foreignKey: 'uploaded_by_user_id' });

// Sponsors
db.Sponsor.belongsToMany(db.Competition, { through: db.SponsorCompetition, foreignKey: 'sponsor_id', otherKey: 'competition_id' });
db.Competition.belongsToMany(db.Sponsor, { through: db.SponsorCompetition, foreignKey: 'competition_id', otherKey: 'sponsor_id' });

// Notifications
db.User.hasMany(db.Notification, { foreignKey: 'user_id' });
db.Notification.belongsTo(db.User, { foreignKey: 'user_id' });

export default db;
