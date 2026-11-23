const express = require('express');
const router = express.Router();
const { Student, School } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * Dedicated Cloud Synchronization Controller
 * Base route: /api/sync
 * Manages two-way sync between Desktop offline apps and Online cloud servers
 */

// 1. Health & Sync Status Check
router.get('/status', (req, res) => {
  return sendSuccess(res, {
    status: 'ONLINE',
    service: 'India Book House Sync Engine',
    timestamp: new Date().toISOString()
  }, 'Sync service is ready and operational', 200);
});

// 2. Bulk synchronize students (Push from offline to cloud)
router.post('/students', async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return sendSuccess(res, { syncedCount: 0 }, 'No student records received for sync', 200);
    }

    let syncedCount = 0;
    for (const st of students) {
      const [record] = await Student.upsert(st);
      if (record) syncedCount++;
    }

    return sendSuccess(
      res,
      { syncedCount },
      `Successfully synchronized ${syncedCount} student records to cloud`,
      200
    );
  } catch (error) {
    console.error('[Sync Route Error - Students]:', error);
    return sendError(res, 'Failed to sync students', 500, error.message);
  }
});

// 3. Bulk synchronize schools (Push from offline to cloud)
router.post('/schools', async (req, res) => {
  try {
    const { schools } = req.body;
    if (!Array.isArray(schools) || schools.length === 0) {
      return sendSuccess(res, { syncedCount: 0 }, 'No school records received for sync', 200);
    }

    let syncedCount = 0;
    for (const sc of schools) {
      const [record] = await School.upsert(sc);
      if (record) syncedCount++;
    }

    return sendSuccess(
      res,
      { syncedCount },
      `Successfully synchronized ${syncedCount} schools to cloud`,
      200
    );
  } catch (error) {
    console.error('[Sync Route Error - Schools]:', error);
    return sendError(res, 'Failed to sync schools', 500, error.message);
  }
});

module.exports = router;
