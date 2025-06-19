export default (sequelize, DataTypes) => {
  return sequelize.define('cache', {
    key: { type: DataTypes.STRING, primaryKey: true },
    value: DataTypes.JSONB,
    expires_at: DataTypes.DATE,
  }, {
    timestamps: false
  });
};
