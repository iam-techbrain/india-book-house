const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { Op } = require('sequelize');
const { Item } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// Memory storage for Excel file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper to normalize class input to numeric classId and string classGrade
function parseClassInfo(input) {
  if (!input) return { classId: 1, classGrade: 'Class 1' };
  const num = parseInt(input.toString().replace(/[^0-9]/g, '')) || 1;
  return {
    classId: num,
    classGrade: `Class ${num}`
  };
}

// Fetch inventory items with class, item_type and text filters
router.get('/', async (req, res) => {
  try {
    const { class_id, item_type, curriculum, search } = req.query;
    const whereClause = {};

    if (class_id !== undefined && class_id !== '') {
      const parsed = parseClassInfo(class_id);
      whereClause[Op.or] = [
        { class_id: parsed.classId },
        { class_grade: parsed.classGrade }
      ];
    }

    if (item_type && item_type.trim() !== '') {
      whereClause.item_type = item_type.trim().toUpperCase();
    }

    if (curriculum && curriculum.trim() !== '') {
      whereClause.curriculum = curriculum.trim();
    }

    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      whereClause[Op.or] = [
        { item_code: { [Op.like]: q } },
        { name: { [Op.like]: q } },
        { subject: { [Op.like]: q } },
        { author_publisher: { [Op.like]: q } },
        { curriculum: { [Op.like]: q } }
      ];
    }

    const items = await Item.findAll({
      where: whereClause,
      order: [['class_id', 'ASC'], ['item_type', 'ASC'], ['id', 'ASC']]
    });

    const totalStock = items.reduce((acc, it) => acc + (parseInt(it.stock_qty) || 0), 0);
    const totalValuation = items.reduce((acc, it) => acc + ((parseInt(it.stock_qty) || 0) * (parseFloat(it.price) || 0)), 0);

    return sendSuccess(res, items, 'Inventory items fetched successfully', 200, {
      total: items.length,
      total_stock_units: totalStock,
      total_inventory_valuation: totalValuation
    });
  } catch (error) {
    return sendError(res, 'Failed to fetch items', 500, error.message);
  }
});

// Download standardized Excel upload template
router.get('/template', (req, res) => {
  try {
    const templateData = [
      {
        "Item Code": "BK-C1-01",
        "Item Name": "Marigold (English)",
        "Item Type": "BOOK",
        "Class ID": 1,
        "Subject": "English",
        "Author / Publisher": "NCERT",
        "Price": 65,
        "Stock Qty": 30
      },
      {
        "Item Code": "COPY-C1-01",
        "Item Name": "4-Line English Notebook (120 Pgs)",
        "Item Type": "COPY",
        "Class ID": 1,
        "Subject": "",
        "Author / Publisher": "Classmate",
        "Price": 40,
        "Stock Qty": 100
      },
      {
        "Item Code": "PEN-01",
        "Item Name": "Tri-Grip Blue Ball Pen Box (10 Pcs)",
        "Item Type": "PEN",
        "Class ID": 1,
        "Subject": "",
        "Author / Publisher": "Reynolds",
        "Price": 60,
        "Stock Qty": 80
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 15 },
      { wch: 32 },
      { wch: 14 },
      { wch: 12 },
      { wch: 18 },
      { wch: 20 },
      { wch: 12 },
      { wch: 14 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Items Template");

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="India_Book_House_Items_Template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) {
    return sendError(res, 'Failed to generate template', 500, error.message);
  }
});

// Fetch single inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return sendError(res, 'Item not found', 404);
    }
    return sendSuccess(res, item, 'Item details fetched successfully', 200);
  } catch (error) {
    return sendError(res, 'Failed to fetch item details', 500, error.message);
  }
});

// Add new inventory item (Book, Copy, Pen or Kit)
router.post('/', async (req, res) => {
  try {
    const {
      item_code,
      name,
      title,
      item_type,
      class_id,
      class_grade,
      subject,
      curriculum,
      author_publisher,
      price,
      stock_qty,
      status
    } = req.body;

    const actualCode = (item_code || '').trim().toUpperCase();
    const actualName = (name || title || '').trim();

    if (!actualCode || !actualName) {
      return sendError(res, 'item_code and name (item title) are required', 400);
    }

    const classInfo = parseClassInfo(class_id || class_grade);

    // Check duplicate item code
    const existing = await Item.findOne({ where: { item_code: actualCode } });
    if (existing) {
      return sendError(res, `Item with code "${actualCode}" already exists (${existing.name})`, 409);
    }

    const newItem = await Item.create({
      item_code: actualCode,
      name: actualName,
      item_type: item_type ? item_type.trim().toUpperCase() : 'BOOK',
      class_id: classInfo.classId,
      class_grade: classInfo.classGrade,
      subject: subject ? subject.trim() : null,
      curriculum: curriculum ? curriculum.trim() : 'NCERT',
      author_publisher: author_publisher ? author_publisher.trim() : null,
      price: parseFloat(price) >= 0 ? parseFloat(price) : 0,
      stock_qty: parseInt(stock_qty) >= 0 ? parseInt(stock_qty) : 0,
      status: status ? status.trim().toUpperCase() : 'ACTIVE'
    });

    return sendSuccess(res, newItem, `${newItem.item_type} "${newItem.name}" added successfully to inventory`, 201);
  } catch (error) {
    return sendError(res, 'Failed to add item', 500, error.message);
  }
});

// Update inventory item details or stock
router.put('/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return sendError(res, 'Item not found', 404);
    }

    const {
      item_code,
      name,
      item_type,
      class_id,
      class_grade,
      subject,
      curriculum,
      author_publisher,
      price,
      stock_qty,
      status
    } = req.body;

    // Check duplicate code if changed
    if (item_code && item_code.trim().toUpperCase() !== item.item_code) {
      const codeCheck = await Item.findOne({ where: { item_code: item_code.trim().toUpperCase() } });
      if (codeCheck) {
        return sendError(res, `Item code "${item_code}" is already in use`, 409);
      }
    }

    const classInfo = (class_id || class_grade) ? parseClassInfo(class_id || class_grade) : null;

    await item.update({
      item_code: item_code ? item_code.trim().toUpperCase() : item.item_code,
      name: name ? name.trim() : item.name,
      item_type: item_type ? item_type.trim().toUpperCase() : item.item_type,
      class_id: classInfo ? classInfo.classId : item.class_id,
      class_grade: classInfo ? classInfo.classGrade : item.class_grade,
      subject: subject !== undefined ? (subject ? subject.trim() : null) : item.subject,
      curriculum: curriculum !== undefined ? (curriculum ? curriculum.trim() : null) : item.curriculum,
      author_publisher: author_publisher !== undefined ? author_publisher.trim() : item.author_publisher,
      price: price !== undefined ? parseFloat(price) : item.price,
      stock_qty: stock_qty !== undefined ? parseInt(stock_qty) : item.stock_qty,
      status: status ? status.trim().toUpperCase() : item.status
    });

    return sendSuccess(res, item, `Item "${item.name}" updated successfully`, 200);
  } catch (error) {
    return sendError(res, 'Failed to update item', 500, error.message);
  }
});

// Delete inventory item by ID
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return sendError(res, 'Item not found', 404);
    }

    const itemName = item.name;
    await item.destroy();

    return sendSuccess(res, null, `Item "${itemName}" deleted successfully`, 200);
  } catch (error) {
    return sendError(res, 'Failed to delete item', 500, error.message);
  }
});

// Bulk upload and synchronize inventory items from Excel spreadsheet
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please attach an Excel file with field name "file"', 400);
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return sendError(res, 'The uploaded Excel sheet is empty', 400);
    }

    let inserted = 0;
    let updated = 0;

    for (const row of rawRows) {
      const code = (row['Item Code'] || row['Book Code'] || row['item_code'] || '').toString().trim().toUpperCase();
      const name = (row['Item Name'] || row['Book Title'] || row['name'] || row['Title'] || '').toString().trim();
      const type = (row['Item Type'] || row['Type'] || row['item_type'] || 'BOOK').toString().trim().toUpperCase();
      const rawClass = row['Class ID'] || row['Class'] || row['class_id'] || 1;
      const classInfo = parseClassInfo(rawClass);
      const subject = (row['Subject'] || row['subject'] || '').toString().trim();
      const curriculum = (row['Curriculum'] || row['curriculum'] || '').toString().trim();
      const authorPub = (row['Author / Publisher'] || row['author/publisher'] || row['Author'] || '').toString().trim();
      const price = parseFloat(row['Price'] || row['price'] || 0) || 0;
      const stock = parseInt(row['Stock Qty'] || row['stock-qty'] || row['stock_qty'] || 0) || 0;

      if (!code || !name) continue;

      const existing = await Item.findOne({ where: { item_code: code } });
      if (existing) {
        await existing.update({
          name,
          item_type: type,
          class_id: classInfo.classId,
          class_grade: classInfo.classGrade,
          subject: subject || existing.subject,
          curriculum: curriculum || existing.curriculum || 'NCERT',
          author_publisher: authorPub || existing.author_publisher,
          price,
          stock_qty: stock
        });
        updated++;
      } else {
        await Item.create({
          item_code: code,
          name,
          item_type: type,
          class_id: classInfo.classId,
          class_grade: classInfo.classGrade,
          subject: subject || null,
          curriculum: curriculum || 'NCERT',
          author_publisher: authorPub || null,
          price,
          stock_qty: stock
        });
        inserted++;
      }
    }

    return sendSuccess(res, {
      total_rows: rawRows.length,
      inserted_count: inserted,
      updated_count: updated
    }, `Items Excel processed: ${inserted} added, ${updated} updated.`, 200);
  } catch (error) {
    return sendError(res, 'Failed to process Excel file', 500, error.message);
  }
});

module.exports = router;
