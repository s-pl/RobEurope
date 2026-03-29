/**
 * Monthly Cloudflare R2 operation counters.
 * One row per calendar month (YYYY-MM).
 * Tracks Class A (write) and Class B (read) API calls made through this app.
 */
export default function defineR2StatsModel(sequelize, DataTypes) {
  const R2Stats = sequelize.define('R2Stats', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    month: {
      // YYYY-MM  e.g. "2026-03"
      type: DataTypes.STRING(7),
      allowNull: false,
      unique: true,
    },
    class_a_ops: {
      // Uploads + deletes (writes / mutations)
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    class_b_ops: {
      // List-files calls (reads)
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
  }, {
    tableName: 'R2Stats',
    timestamps: false,
  });

  return R2Stats;
}
