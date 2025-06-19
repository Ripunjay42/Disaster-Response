import sequelize from '../config/database.js';
import { DataTypes } from 'sequelize';
import DisasterModel from './disaster.js';
import ReportModel from './report.js';
import ResourceModel from './resource.js';
import CacheModel from './cache.js';

const Disaster = DisasterModel(sequelize, DataTypes);
const Report = ReportModel(sequelize, DataTypes);
const Resource = ResourceModel(sequelize, DataTypes);
const Cache = CacheModel(sequelize, DataTypes);

Disaster.hasMany(Report, { foreignKey: 'disaster_id' });
Disaster.hasMany(Resource, { foreignKey: 'disaster_id' });

export { sequelize, Disaster, Report, Resource, Cache };
