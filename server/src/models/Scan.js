import mongoose from 'mongoose';

const vulnerabilitySchema = new mongoose.Schema({
  id: String,
  aliases: [String],
  summary: String,
  details: String,
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  severityScore: Number,
  affectedRange: String,
  fixVersion: String,
  advisoryUrl: String,
  packageName: String
});

const dependencySchema = new mongoose.Schema({
  name: String,
  currentVersion: String,
  latestVersion: String,
  status: {
    type: String,
    enum: ['up-to-date', 'minor-behind', 'major-behind', 'outdated', 'unknown'],
    default: 'unknown'
  },
  type: {
    type: String,
    enum: ['production', 'development', 'peer', 'optional'],
    default: 'production'
  },
  vulnerabilities: [vulnerabilitySchema],
  groupId: String,
  artifactId: String
});

const scanSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['npm', 'maven', 'pip', 'gradle'],
    required: true
  },
  rawContent: {
    type: String,
    required: true
  },
  dependencies: [dependencySchema],
  vulnerabilities: [vulnerabilitySchema],
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  totalDependencies: {
    type: Number,
    default: 0
  },
  outdatedCount: {
    type: Number,
    default: 0
  },
  vulnerableCount: {
    type: Number,
    default: 0
  },
  criticalCount: {
    type: Number,
    default: 0
  },
  aiAnalysis: {
    riskSummary: String,
    priorityUpgrades: String,
    conflictDetection: String,
    migrationGuide: String,
    securityRecommendations: String,
    fullAnalysis: String
  },
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'completed', 'failed'],
    default: 'pending'
  },
  errorMessage: String
}, {
  timestamps: true
});

scanSchema.index({ createdAt: -1 });
scanSchema.index({ fileType: 1 });
scanSchema.index({ riskScore: -1 });

const Scan = mongoose.model('Scan', scanSchema);

export default Scan;
