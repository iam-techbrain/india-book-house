const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  ItemType,
  ClassGrade,
  Subject,
  AuthorPublisher,
  BoardType,
  Curriculum,
  Role,
  Item,
  School,
  Student,
  User
} = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// Fetch all 7 master lookup tables in one call for dropdowns
router.get('/all', async (req, res) => {
  try {
    const [itemTypes, classes, subjects, publishers, boards, curriculums, roles] = await Promise.all([
      ItemType.findAll({ order: [['id', 'ASC']] }),
      ClassGrade.findAll({ order: [['id', 'ASC']] }),
      Subject.findAll({ order: [['name', 'ASC']] }),
      AuthorPublisher.findAll({ order: [['name', 'ASC']] }),
      BoardType.findAll({ order: [['id', 'ASC']] }),
      Curriculum.findAll({ order: [['id', 'ASC']] }),
      Role.findAll({ order: [['id', 'ASC']] })
    ]);

    return sendSuccess(res, {
      item_types: itemTypes,
      classes,
      subjects,
      authors_publishers: publishers,
      board_types: boards,
      curriculums,
      roles
    }, 'All master tables fetched successfully', 200);
  } catch (error) {
    return sendError(res, 'Failed to fetch master lookup tables', 500, error.message);
  }
});

// 1. Item Types: Fetch all
router.get('/item-types', async (req, res) => {
  try {
    const data = await ItemType.findAll({ order: [['id', 'ASC']] });
    return sendSuccess(res, data, 'Item Types fetched successfully', 200, { total: data.length });
  } catch (err) {
    return sendError(res, 'Failed to fetch Item Types', 500, err.message);
  }
});

// 1. Item Types: Create new
router.post('/item-types', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return sendError(res, 'name is required', 400);

    const cleanName = name.trim().toUpperCase();
    const existing = await ItemType.findOne({ where: { name: cleanName } });
    if (existing) return sendError(res, `Item Type "${cleanName}" already exists`, 409);

    const created = await ItemType.create({ name: cleanName, description: description ? description.trim() : null });
    return sendSuccess(res, created, 'Item Type created successfully', 201);
  } catch (err) {
    return sendError(res, 'Failed to create Item Type', 500, err.message);
  }
});

// 1. Item Types: Update
router.put('/item-types/:id', async (req, res) => {
  try {
    const record = await ItemType.findByPk(req.params.id);
    if (!record) return sendError(res, 'Item Type not found', 404);

    const { name, description } = req.body;
    const oldName = record.name;
    const cleanName = name ? name.trim().toUpperCase() : record.name;

    if (cleanName !== oldName) {
      const existing = await ItemType.findOne({ where: { name: cleanName } });
      if (existing) return sendError(res, `Item Type "${cleanName}" already exists`, 409);
      await Item.update({ item_type: cleanName }, { where: { item_type: oldName } });
    }

    await record.update({
      name: cleanName,
      description: description !== undefined ? (description ? description.trim() : null) : record.description
    });
    return sendSuccess(res, record, `Item Type "${record.name}" updated successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to update Item Type', 500, err.message);
  }
});

// 1. Item Types: Delete with dependency check
router.delete('/item-types/:id', async (req, res) => {
  try {
    const record = await ItemType.findByPk(req.params.id);
    if (!record) return sendError(res, 'Item Type not found', 404);

    // Verify if any inventory items use this item type
    const itemsCount = await Item.count({ where: { item_type: record.name } });
    if (itemsCount > 0) {
      return sendError(
        res,
        `DELETION BLOCKED: Cannot delete Item Type "${record.name}" because ${itemsCount} inventory items are currently using it.`,
        400,
        `Dependent records exist (${itemsCount} items)`,
        null,
        { blocked: true, dependentCount: itemsCount }
      );
    }

    await record.destroy();
    return sendSuccess(res, null, `Item Type "${record.name}" deleted successfully (0 dependencies found)`, 200);
  } catch (err) {
    return sendError(res, 'Failed to delete Item Type', 500, err.message);
  }
});

// 2. Classes: Fetch all
router.get('/classes', async (req, res) => {
  try {
    const data = await ClassGrade.findAll({ order: [['id', 'ASC']] });
    return sendSuccess(res, data, 'Classes fetched successfully', 200, { total: data.length });
  } catch (err) {
    return sendError(res, 'Failed to fetch classes', 500, err.message);
  }
});

// 2. Classes: Create new
router.post('/classes', async (req, res) => {
  try {
    const { name, class_number } = req.body;
    if (!name) return sendError(res, 'name is required (e.g. Class 1)', 400);

    const cleanName = name.trim();
    const existing = await ClassGrade.findOne({ where: { name: cleanName } });
    if (existing) return sendError(res, `Class "${cleanName}" already exists`, 409);

    const num = class_number || parseInt(cleanName.replace(/[^0-9]/g, '')) || null;
    const created = await ClassGrade.create({ name: cleanName, class_number: num });
    return sendSuccess(res, created, 'Class created successfully', 201);
  } catch (err) {
    return sendError(res, 'Failed to create Class', 500, err.message);
  }
});

// 2. Classes: Update
router.put('/classes/:id', async (req, res) => {
  try {
    const record = await ClassGrade.findByPk(req.params.id);
    if (!record) return sendError(res, 'Class not found', 404);

    const { name, class_number } = req.body;
    const oldName = record.name;
    const cleanName = name ? name.trim() : record.name;

    if (cleanName !== oldName) {
      const existing = await ClassGrade.findOne({ where: { name: cleanName } });
      if (existing) return sendError(res, `Class "${cleanName}" already exists`, 409);
      await Item.update({ class_grade: cleanName }, { where: { class_grade: oldName } });
      await Student.update({ class_grade: cleanName }, { where: { class_grade: oldName } });
    }

    const num = class_number !== undefined ? (parseInt(class_number) || record.class_number) : record.class_number;
    await record.update({ name: cleanName, class_number: num });
    return sendSuccess(res, record, `Class "${record.name}" updated successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to update Class', 500, err.message);
  }
});

// 2. Classes: Delete with dependency check
router.delete('/classes/:id', async (req, res) => {
  try {
    const record = await ClassGrade.findByPk(req.params.id);
    if (!record) return sendError(res, 'Class not found', 404);

    // Verify if any items or students reference this class
    const [itemsCount, studentsCount] = await Promise.all([
      Item.count({ where: { [Op.or]: [{ class_id: record.id }, { class_grade: record.name }] } }),
      Student.count({ where: { [Op.or]: [{ class_id: record.id }, { class_grade: record.name }] } })
    ]);

    if (itemsCount > 0 || studentsCount > 0) {
      return sendError(
        res,
        `DELETION BLOCKED: Cannot delete Class "${record.name}" because ${itemsCount} inventory items and ${studentsCount} students are currently associated with it.`,
        400,
        `Dependent records exist (${itemsCount} items, ${studentsCount} students)`,
        null,
        { blocked: true, itemsCount, studentsCount }
      );
    }

    await record.destroy();
    return sendSuccess(res, null, `Class "${record.name}" deleted successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to delete Class', 500, err.message);
  }
});

// 3. Subjects: Fetch all
router.get('/subjects', async (req, res) => {
  try {
    const data = await Subject.findAll({ order: [['name', 'ASC']] });
    return sendSuccess(res, data, 'Subjects fetched successfully', 200, { total: data.length });
  } catch (err) {
    return sendError(res, 'Failed to fetch subjects', 500, err.message);
  }
});

// 3. Subjects: Create new
router.post('/subjects', async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name) return sendError(res, 'name is required', 400);

    const cleanName = name.trim();
    const existing = await Subject.findOne({ where: { name: cleanName } });
    if (existing) return sendError(res, `Subject "${cleanName}" already exists`, 409);

    const created = await Subject.create({ name: cleanName, code: code ? code.trim().toUpperCase() : null });
    return sendSuccess(res, created, 'Subject created successfully', 201);
  } catch (err) {
    return sendError(res, 'Failed to create Subject', 500, err.message);
  }
});

// 3. Subjects: Update
router.put('/subjects/:id', async (req, res) => {
  try {
    const record = await Subject.findByPk(req.params.id);
    if (!record) return sendError(res, 'Subject not found', 404);

    const { name, code } = req.body;
    const oldName = record.name;
    const cleanName = name ? name.trim() : record.name;

    if (cleanName !== oldName) {
      const existing = await Subject.findOne({ where: { name: cleanName } });
      if (existing) return sendError(res, `Subject "${cleanName}" already exists`, 409);
      await Item.update({ subject: cleanName }, { where: { subject: oldName } });
    }

    await record.update({
      name: cleanName,
      code: code !== undefined ? (code ? code.trim().toUpperCase() : null) : record.code
    });
    return sendSuccess(res, record, `Subject "${record.name}" updated successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to update Subject', 500, err.message);
  }
});

// 3. Subjects: Delete with dependency check
router.delete('/subjects/:id', async (req, res) => {
  try {
    const record = await Subject.findByPk(req.params.id);
    if (!record) return sendError(res, 'Subject not found', 404);

    // Verify if any inventory items use this subject
    const itemsCount = await Item.count({ where: { subject: record.name } });
    if (itemsCount > 0) {
      return sendError(
        res,
        `DELETION BLOCKED: Cannot delete Subject "${record.name}" because ${itemsCount} items are currently using it.`,
        400,
        `Dependent items exist (${itemsCount} items)`,
        null,
        { blocked: true, dependentCount: itemsCount }
      );
    }

    await record.destroy();
    return sendSuccess(res, null, `Subject "${record.name}" deleted successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to delete Subject', 500, err.message);
  }
});

// 4. Authors and Publishers: Fetch all
router.get('/publishers', async (req, res) => {
  try {
    const data = await AuthorPublisher.findAll({ order: [['name', 'ASC']] });
    return sendSuccess(res, data, 'Publishers and Authors fetched successfully', 200, { total: data.length });
  } catch (err) {
    return sendError(res, 'Failed to fetch publishers', 500, err.message);
  }
});

// 4. Authors and Publishers: Create new
router.post('/publishers', async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name) return sendError(res, 'name is required', 400);

    const cleanName = name.trim();
    const existing = await AuthorPublisher.findOne({ where: { name: cleanName } });
    if (existing) return sendError(res, `Publisher/Author "${cleanName}" already exists`, 409);

    const created = await AuthorPublisher.create({ name: cleanName, type: type ? type.trim().toUpperCase() : 'PUBLISHER' });
    return sendSuccess(res, created, 'Publisher created successfully', 201);
  } catch (err) {
    return sendError(res, 'Failed to create Publisher', 500, err.message);
  }
});

// 4. Authors and Publishers: Update
router.put('/publishers/:id', async (req, res) => {
  try {
    const record = await AuthorPublisher.findByPk(req.params.id);
    if (!record) return sendError(res, 'Author/Publisher not found', 404);

    const { name, type } = req.body;
    const oldName = record.name;
    const cleanName = name ? name.trim() : record.name;

    if (cleanName !== oldName) {
      const existing = await AuthorPublisher.findOne({ where: { name: cleanName } });
      if (existing) return sendError(res, `Publisher/Author "${cleanName}" already exists`, 409);
      await Item.update({ author_publisher: cleanName }, { where: { author_publisher: oldName } });
    }

    await record.update({
      name: cleanName,
      type: type ? type.trim().toUpperCase() : record.type
    });
    return sendSuccess(res, record, `Publisher "${record.name}" updated successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to update Publisher', 500, err.message);
  }
});

// 4. Authors and Publishers: Delete with dependency check
router.delete('/publishers/:id', async (req, res) => {
  try {
    const record = await AuthorPublisher.findByPk(req.params.id);
    if (!record) return sendError(res, 'Author/Publisher not found', 404);

    // Verify if any inventory items map to this publisher
    const itemsCount = await Item.count({ where: { author_publisher: record.name } });
    if (itemsCount > 0) {
      return sendError(
        res,
        `DELETION BLOCKED: Cannot delete Author/Publisher "${record.name}" because ${itemsCount} items are currently mapped to it.`,
        400,
        `Dependent items exist (${itemsCount} items)`,
        null,
        { blocked: true, dependentCount: itemsCount }
      );
    }

    await record.destroy();
    return sendSuccess(res, null, `Publisher "${record.name}" deleted successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to delete Publisher', 500, err.message);
  }
});

// 5. Board Types: Fetch all
router.get('/boards', async (req, res) => {
  try {
    const data = await BoardType.findAll({ order: [['id', 'ASC']] });
    return sendSuccess(res, data, 'Board Types fetched successfully', 200, { total: data.length });
  } catch (err) {
    return sendError(res, 'Failed to fetch boards', 500, err.message);
  }
});

// 5. Board Types: Create new
router.post('/boards', async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name) return sendError(res, 'name is required', 400);

    const cleanName = name.trim().toUpperCase();
    const existing = await BoardType.findOne({ where: { name: cleanName } });
    if (existing) return sendError(res, `Board Type "${cleanName}" already exists`, 409);

    const created = await BoardType.create({ name: cleanName, code: code ? code.trim().toUpperCase() : cleanName });
    return sendSuccess(res, created, 'Board Type created successfully', 201);
  } catch (err) {
    return sendError(res, 'Failed to create Board Type', 500, err.message);
  }
});

// 5. Board Types: Update
router.put('/boards/:id', async (req, res) => {
  try {
    const record = await BoardType.findByPk(req.params.id);
    if (!record) return sendError(res, 'Board Type not found', 404);

    const { name, code } = req.body;
    const oldName = record.name;
    const cleanName = name ? name.trim().toUpperCase() : record.name;

    if (cleanName !== oldName) {
      const existing = await BoardType.findOne({ where: { name: cleanName } });
      if (existing) return sendError(res, `Board Type "${cleanName}" already exists`, 409);
      await School.update({ board_type: cleanName }, { where: { board_type: oldName } });
    }

    await record.update({
      name: cleanName,
      code: code ? code.trim().toUpperCase() : record.code
    });
    return sendSuccess(res, record, `Board Type "${record.name}" updated successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to update Board Type', 500, err.message);
  }
});

// 5. Board Types: Delete with dependency check
router.delete('/boards/:id', async (req, res) => {
  try {
    const record = await BoardType.findByPk(req.params.id);
    if (!record) return sendError(res, 'Board Type not found', 404);

    // Verify if any schools are affiliated with this board
    const schoolsCount = await School.count({ where: { board_type: record.name } });
    if (schoolsCount > 0) {
      return sendError(
        res,
        `DELETION BLOCKED: Cannot delete Board "${record.name}" because ${schoolsCount} schools are currently affiliated with it.`,
        400,
        `Dependent schools exist (${schoolsCount} schools)`,
        null,
        { blocked: true, dependentCount: schoolsCount }
      );
    }

    await record.destroy();
    return sendSuccess(res, null, `Board "${record.name}" deleted successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to delete Board Type', 500, err.message);
  }
});

// 6. Curriculums: Fetch all
router.get('/curriculums', async (req, res) => {
  try {
    const data = await Curriculum.findAll({ order: [['id', 'ASC']] });
    return sendSuccess(res, data, 'Curriculums fetched successfully', 200, { total: data.length });
  } catch (err) {
    return sendError(res, 'Failed to fetch curriculums', 500, err.message);
  }
});

// 6. Curriculums: Create new
router.post('/curriculums', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return sendError(res, 'name is required', 400);

    const cleanName = name.trim();
    const existing = await Curriculum.findOne({ where: { name: cleanName } });
    if (existing) return sendError(res, `Curriculum "${cleanName}" already exists`, 409);

    const created = await Curriculum.create({ name: cleanName, description: description ? description.trim() : null });
    return sendSuccess(res, created, 'Curriculum created successfully', 201);
  } catch (err) {
    return sendError(res, 'Failed to create Curriculum', 500, err.message);
  }
});

// 6. Curriculums: Update
router.put('/curriculums/:id', async (req, res) => {
  try {
    const record = await Curriculum.findByPk(req.params.id);
    if (!record) return sendError(res, 'Curriculum not found', 404);

    const { name, description } = req.body;
    const oldName = record.name;
    const cleanName = name ? name.trim() : record.name;

    if (cleanName !== oldName) {
      const existing = await Curriculum.findOne({ where: { name: cleanName } });
      if (existing) return sendError(res, `Curriculum "${cleanName}" already exists`, 409);
      await School.update({ curriculum: cleanName }, { where: { curriculum: oldName } });
    }

    await record.update({
      name: cleanName,
      description: description !== undefined ? (description ? description.trim() : null) : record.description
    });
    return sendSuccess(res, record, `Curriculum "${record.name}" updated successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to update Curriculum', 500, err.message);
  }
});

// 6. Curriculums: Delete with dependency check
router.delete('/curriculums/:id', async (req, res) => {
  try {
    const record = await Curriculum.findByPk(req.params.id);
    if (!record) return sendError(res, 'Curriculum not found', 404);

    // Verify if any schools use this curriculum
    const schoolsCount = await School.count({ where: { curriculum: record.name } });
    if (schoolsCount > 0) {
      return sendError(
        res,
        `DELETION BLOCKED: Cannot delete Curriculum "${record.name}" because ${schoolsCount} schools are currently using it.`,
        400,
        `Dependent schools exist (${schoolsCount} schools)`,
        null,
        { blocked: true, dependentCount: schoolsCount }
      );
    }

    await record.destroy();
    return sendSuccess(res, null, `Curriculum "${record.name}" deleted successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to delete Curriculum', 500, err.message);
  }
});

// 7. Roles: Fetch all
router.get('/roles', async (req, res) => {
  try {
    const data = await Role.findAll({ order: [['id', 'ASC']] });
    return sendSuccess(res, data, 'Roles fetched successfully', 200, { total: data.length });
  } catch (err) {
    return sendError(res, 'Failed to fetch roles', 500, err.message);
  }
});

// 7. Roles: Create new
router.post('/roles', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return sendError(res, 'name is required', 400);

    const cleanName = name.trim().toLowerCase();
    const existing = await Role.findOne({ where: { name: cleanName } });
    if (existing) return sendError(res, `Role "${cleanName}" already exists`, 409);

    const created = await Role.create({ name: cleanName, description: description ? description.trim() : null });
    return sendSuccess(res, created, 'Role created successfully', 201);
  } catch (err) {
    return sendError(res, 'Failed to create Role', 500, err.message);
  }
});

// 7. Roles: Update
router.put('/roles/:id', async (req, res) => {
  try {
    const record = await Role.findByPk(req.params.id);
    if (!record) return sendError(res, 'Role not found', 404);

    const { name, description } = req.body;
    const oldName = record.name;
    const cleanName = name ? name.trim().toLowerCase() : record.name;

    if (cleanName !== oldName) {
      const existing = await Role.findOne({ where: { name: cleanName } });
      if (existing) return sendError(res, `Role "${cleanName}" already exists`, 409);
      await User.update({ role: cleanName }, { where: { role: oldName } });
    }

    await record.update({
      name: cleanName,
      description: description !== undefined ? (description ? description.trim() : null) : record.description
    });
    return sendSuccess(res, record, `Role "${record.name}" updated successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to update Role', 500, err.message);
  }
});

// 7. Roles: Delete with dependency check
router.delete('/roles/:id', async (req, res) => {
  try {
    const record = await Role.findByPk(req.params.id);
    if (!record) return sendError(res, 'Role not found', 404);

    // Verify if any users are assigned to this role
    const usersCount = await User.count({ where: { role: record.name } });
    if (usersCount > 0) {
      return sendError(
        res,
        `DELETION BLOCKED: Cannot delete Role "${record.name}" because ${usersCount} users are currently assigned this role.`,
        400,
        `Dependent users exist (${usersCount} users)`,
        null,
        { blocked: true, dependentCount: usersCount }
      );
    }

    await record.destroy();
    return sendSuccess(res, null, `Role "${record.name}" deleted successfully`, 200);
  } catch (err) {
    return sendError(res, 'Failed to delete Role', 500, err.message);
  }
});

module.exports = router;
