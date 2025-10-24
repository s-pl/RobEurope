export default (sequelize, DataTypes) => {
  const CompetitionRegistration = sequelize.define("CompetitionRegistration", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    status: { type: DataTypes.STRING, defaultValue: "pending" },
    notes: DataTypes.TEXT,
  });
  return CompetitionRegistration;
};