
export default (sequelize, DataTypes) => {
  const Stream = sequelize.define('Stream', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    url: DataTypes.STRING,
    description: DataTypes.TEXT,
  }, {
    tableName: 'streams',
    timestamps: false,
  });

  return Stream;
};
