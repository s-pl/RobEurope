import { DataTypes } from "sequelize";
import sequelize from "../controller/db.controller.js";


import defineUser from "./user.model.js";
import defineRole from "./role.model.js";
import defineUserProfile from "./user.profile.model.js";
import defineTeam from "./team.model.js";
import defineTeamMember from "./team.member.model.js";
import defineCompetition from "./competition.model.js";
import defineCompetitionRegistration from "./competition.registration.model.js";
import defineCompetitionMedia from "./competition.media.model.js";
import defineMedia from "./media.model.js";
import definePost from "./post.model.js";
import definePostComment from "./post.comment.model.js";
import defineStream from "./stream.model.js";
import defineNotification from "./notification.model.js";


const models = {};
models.User = defineUser(sequelize, DataTypes);
models.Role = defineRole(sequelize, DataTypes);
models.UserProfile = defineUserProfile(sequelize, DataTypes);
models.Team = defineTeam(sequelize, DataTypes);
models.TeamMember = defineTeamMember(sequelize, DataTypes);
models.Competition = defineCompetition(sequelize, DataTypes);
models.CompetitionRegistration = defineCompetitionRegistration(sequelize, DataTypes);
models.CompetitionMedia = defineCompetitionMedia(sequelize, DataTypes);
models.Media = defineMedia(sequelize, DataTypes);
models.Post = definePost(sequelize, DataTypes);
models.PostComment = definePostComment(sequelize, DataTypes);
models.Stream = defineStream(sequelize, DataTypes);
models.Notification = defineNotification(sequelize, DataTypes);


Object.values(models).forEach((model) => {
  if (typeof model.associate === "function") {
    model.associate(models);
  }
});

export { sequelize };
export default models;
