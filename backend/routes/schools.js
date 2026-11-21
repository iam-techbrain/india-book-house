const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { School, Student } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// Fetch all registered schools with real enrolled student counts and dispatch metrics
router.get('/', async (req, res) => {
  try {
    const schools = await School.findAll({ order: [['id', 'ASC']] });

    const enrichedSchools = await Promise.all(
      schools.map(async (school) => {
        const schoolJson = school.toJSON();
        const studentsCount = await Student.count({ where: { school_id: school.id } });
        const deliveredCount = await Student.count({
          where: {
            school_id: school.id,
            [Op.or]: [
              { delivery_status: 'DELIVERED' },
              { payment_status: 'PAID' }
            ]
          }
        });

        return {
          ...schoolJson,
          students_count: studentsCount,
          delivered_books_count: deliveredCount
        };
      })
    );

    return sendSuccess(res, enrichedSchools, 'Schools fetched successfully', 200, { total: enrichedSchools.length });
  } catch (error) {
    return sendError(res, 'Failed to fetch schools', 500, error.message);
  }
});

// Fetch single school details by numeric ID
router.get('/:id', async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school) {
      return sendError(res, 'School not found', 404);
    }
    return sendSuccess(res, school, 'School details fetched successfully', 200);
  } catch (error) {
    return sendError(res, 'Failed to fetch school details', 500, error.message);
  }
});

// Register a new school profile
router.post('/', async (req, res) => {
  try {
    const { code, name, address, board_type, curriculum, status, date } = req.body;

    if (!code || !name) {
      return sendError(res, 'School code and school name are required', 400);
    }

    const cleanCode = code.trim().toUpperCase();

    // Check duplicate school code
    const existing = await School.findOne({ where: { code: cleanCode } });
    if (existing) {
      return sendError(res, `School with code "${cleanCode}" already exists (${existing.name})`, 409);
    }

    const newSchool = await School.create({
      code: cleanCode,
      name: name.trim(),
      address: address ? address.trim() : null,
      board_type: board_type ? board_type.trim().toUpperCase() : 'CBSE',
      curriculum: curriculum ? curriculum.trim() : 'NCERT',
      status: status ? status.trim().toUpperCase() : 'ACTIVE',
      entry_date: date || new Date().toISOString().split('T')[0]
    });

    return sendSuccess(res, newSchool, 'School registered successfully', 201);
  } catch (error) {
    return sendError(res, 'Failed to register school', 500, error.message);
  }
});

// Update school profile
router.put('/:id', async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school) {
      return sendError(res, 'School not found', 404);
    }

    const { code, name, address, board_type, curriculum, status } = req.body;

    // Check duplicate code if changed
    if (code && code.trim().toUpperCase() !== school.code) {
      const existing = await School.findOne({ where: { code: code.trim().toUpperCase() } });
      if (existing) {
        return sendError(res, `School with code "${code.trim().toUpperCase()}" already exists`, 409);
      }
    }

    await school.update({
      code: code ? code.trim().toUpperCase() : school.code,
      name: name ? name.trim() : school.name,
      address: address !== undefined ? address : school.address,
      board_type: board_type ? board_type.trim().toUpperCase() : school.board_type,
      curriculum: curriculum ? curriculum.trim() : school.curriculum,
      status: status ? status.trim().toUpperCase() : school.status
    });

    return sendSuccess(res, school, `School "${school.name}" updated successfully`, 200);
  } catch (error) {
    return sendError(res, 'Failed to update school', 500, error.message);
  }
});

// Delete school profile by ID
router.delete('/:id', async (req, res) => {
  try {
    const school = await School.findByPk(req.params.id);
    if (!school) {
      return sendError(res, 'School not found', 404);
    }

    const schoolName = school.name;
    await school.destroy();

    return sendSuccess(res, null, `School "${schoolName}" deleted successfully`, 200);
  } catch (error) {
    return sendError(res, 'Failed to delete school', 500, error.message);
  }
});

module.exports = router;
