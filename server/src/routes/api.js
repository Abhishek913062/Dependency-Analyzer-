import express from 'express';
import multer from 'multer';
import { parseDependencies } from '../parsers/index.js';
import { checkVersions } from '../services/versionChecker.js';
import { scanVulnerabilities, computeRiskScore } from '../services/vulnScanner.js';
import { analyzeWithAI } from '../services/aiAnalyzer.js';
import Scan from '../models/Scan.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Submit a new scan
router.post('/scan', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const content = req.file.buffer.toString('utf-8');
    const fileName = req.file.originalname;

    // 1. Parse dependencies
    const { fileType, dependencies: parsedDeps } = parseDependencies(fileName, content);

    // 2. Initial save to DB (pending state)
    let scan = new Scan({
      fileName,
      fileType,
      rawContent: content,
      dependencies: parsedDeps,
      totalDependencies: parsedDeps.length,
      status: 'analyzing'
    });
    await scan.save();

    // 3. Process asynchronously (in a real app, use a queue like BullMQ)
    processScan(scan._id).catch(err => console.error('Background processing failed:', err));

    res.status(202).json({
      message: 'Scan started',
      scanId: scan._id,
      fileType,
      totalDependencies: parsedDeps.length
    });

  } catch (error) {
    console.error('Scan init error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Process scan in background
async function processScan(scanId) {
  try {
    const scan = await Scan.findById(scanId);
    if (!scan) return;

    // 4. Check versions from registries
    let dependencies = await checkVersions(scan.dependencies, scan.fileType);

    // 5. Scan for vulnerabilities via OSV
    dependencies = await scanVulnerabilities(dependencies, scan.fileType);

    // 6. Aggregate stats
    let outdatedCount = 0;
    let vulnerableCount = 0;
    let criticalCount = 0;
    const allVulns = [];

    dependencies.forEach(dep => {
      if (dep.status === 'major-behind' || dep.status === 'minor-behind' || dep.status === 'outdated') {
        outdatedCount++;
      }
      if (dep.vulnerabilities && dep.vulnerabilities.length > 0) {
        vulnerableCount++;
        allVulns.push(...dep.vulnerabilities);
        dep.vulnerabilities.forEach(v => {
          if (v.severity === 'CRITICAL' || v.severityScore >= 9.0) {
            criticalCount++;
          }
        });
      }
    });

    const riskScore = computeRiskScore(dependencies);

    scan.dependencies = dependencies;
    scan.vulnerabilities = allVulns;
    scan.outdatedCount = outdatedCount;
    scan.vulnerableCount = vulnerableCount;
    scan.criticalCount = criticalCount;
    scan.riskScore = riskScore;

    // 7. Get AI Analysis
    const aiAnalysis = await analyzeWithAI({
      fileType: scan.fileType,
      dependencies,
      vulnerabilities: allVulns,
      riskScore
    });

    scan.aiAnalysis = aiAnalysis;
    scan.status = 'completed';

    await scan.save();
  } catch (error) {
    console.error('Scan processing error:', error);
    await Scan.findByIdAndUpdate(scanId, {
      status: 'failed',
      errorMessage: error.message
    });
  }
}

// Get scan history (paginated)
router.get('/scans', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const scans = await Scan.find()
      .select('fileName fileType riskScore totalDependencies outdatedCount vulnerableCount status createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Scan.countDocuments();

    res.json({
      scans,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific scan report
router.get('/scans/:id', async (req, res) => {
  try {
    const scan = await Scan.findById(req.params.id);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json(scan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a scan
router.delete('/scans/:id', async (req, res) => {
  try {
    const scan = await Scan.findByIdAndDelete(req.params.id);
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json({ message: 'Scan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalScans = await Scan.countDocuments();

    const stats = await Scan.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          avgRiskScore: { $avg: '$riskScore' },
          totalVulnerabilities: { $sum: { $size: '$vulnerabilities' } },
          totalCritical: { $sum: '$criticalCount' },
          totalPackages: { $sum: '$totalDependencies' }
        }
      }
    ]);

    res.json({
      totalScans,
      avgRiskScore: stats[0]?.avgRiskScore || 0,
      totalVulnerabilities: stats[0]?.totalVulnerabilities || 0,
      totalCritical: stats[0]?.totalCritical || 0,
      totalPackagesAnalyzed: stats[0]?.totalPackages || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
