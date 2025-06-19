export default (sequelize, DataTypes) => {
  return sequelize.define('resource', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    disaster_id: DataTypes.UUID,
    name: DataTypes.TEXT,
    location_name: DataTypes.TEXT,
    location: DataTypes.GEOGRAPHY('POINT', 4326),
    type: DataTypes.TEXT,
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, {
    timestamps: false,
    indexes: [{ fields: ['location'], using: 'gist' }]
  });
};
