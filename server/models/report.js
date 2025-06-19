export default (sequelize, DataTypes) => {
  return sequelize.define('report', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    disaster_id: DataTypes.UUID,
    user_id: DataTypes.UUID,
    content: DataTypes.TEXT,
    image_url: DataTypes.TEXT,
    verification_status: DataTypes.TEXT,
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: false
  });
};
