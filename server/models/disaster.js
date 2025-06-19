export default (sequelize, DataTypes) => {
  return sequelize.define('disaster', {
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
    title: DataTypes.TEXT,
    location_name: DataTypes.TEXT,
    location: DataTypes.GEOGRAPHY('POINT', 4326),
    description: DataTypes.TEXT,
    tags: DataTypes.ARRAY(DataTypes.TEXT),
    owner_id: DataTypes.UUID,
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    audit_trail: DataTypes.JSONB,
  }, {
    timestamps: false,
    indexes: [
      { fields: ['location'], using: 'gist' },
      { fields: ['tags'], using: 'gin' },
      { fields: ['owner_id'] }
    ]
  });
};
