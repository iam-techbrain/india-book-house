const express = require('express');
const router = express.Router();
const multer = require('multer');
const XLSX = require('xlsx');
const { Op } = require('sequelize');
const { Student, Item, School } = require('../models');
const { sendSuccess, sendError } = require('../utils/response');

// Memory storage for Excel file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// Helper to convert class input to numeric class ID and name
function parseClass(input) {
  if (!input) return { id: 1, name: 'Class 1' };
  const num = parseInt(input.toString().replace(/[^0-9]/g, '')) || 1;
  return { id: num, name: `Class ${num}` };
}

// Helper to convert section input to numeric ID and letter
function parseSection(input) {
  if (!input) return { id: 1, letter: 'A' };
  const str = input.toString().trim().toUpperCase();
  if (str === 'A' || str === '1') return { id: 1, letter: 'A' };
  if (str === 'B' || str === '2') return { id: 2, letter: 'B' };
  if (str === 'C' || str === '3') return { id: 3, letter: 'C' };
  if (str === 'D' || str === '4') return { id: 4, letter: 'D' };
  return { id: 1, letter: str };
}

// Download standardized student roster upload template
router.get('/template', (req, res) => {
  try {
    const templateData = [
      {
        "Student ID": "DPS-C1-001",
        "Student Name": "Aarav Sharma",
        "Father Name": "Rajesh Sharma",
        "Class": 1,
        "Section": "A",
        "Email": "aarav@example.com",
        "Auto Check All Books": "NO"
      },
      {
        "Student ID": "DPS-C1-002",
        "Student Name": "Diya Patel",
        "Father Name": "Suresh Patel",
        "Class": 1,
        "Section": "A",
        "Email": "diya@example.com",
        "Auto Check All Books": "NO"
      },
      {
        "Student ID": "DPS-C2-001",
        "Student Name": "Rohan Gupta",
        "Father Name": "Anil Gupta",
        "Class": 2,
        "Section": "B",
        "Email": "rohan@example.com",
        "Auto Check All Books": "YES"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 18 },
      { wch: 25 },
      { wch: 25 },
      { wch: 10 },
      { wch: 10 },
      { wch: 25 },
      { wch: 22 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Student Roster Template");

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="India_Book_House_Student_Roster_Template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    return res.send(buffer);
  } catch (error) {
    return sendError(res, 'Failed to generate student roster template', 500, error.message);
  }
});

// Bulk upload and enroll students for a school from Excel spreadsheet
router.post('/upload-excel', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please attach an Excel file with field name "file"', 400);
    }

    const schoolId = parseInt(req.body.school_id) || 1;
    const school = await School.findByPk(schoolId);
    if (!school) {
      return sendError(res, `School with ID #${schoolId} not found`, 404);
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
      const studentId = (row['Student ID'] || row['student_id'] || row['Roll No'] || row['ID'] || '').toString().trim();
      const studentName = (row['Student Name'] || row['student_name'] || row['Name'] || '').toString().trim();
      const fatherName = (row['Father Name'] || row['father_name'] || row['Father'] || '').toString().trim();
      const rawClass = row['Class'] || row['Class ID'] || row['class_id'] || 1;
      const classInfo = parseClass(rawClass);
      const rawSection = row['Section'] || row['section'] || 'A';
      const sectionInfo = parseSection(rawSection);
      const email = (row['Email'] || row['email'] || '').toString().trim();
      const autoCheckStr = (row['Auto Check All Books'] || row['auto_check_all'] || '').toString().trim().toUpperCase();
      const autoCheckAll = autoCheckStr === 'YES' || autoCheckStr === 'TRUE' || autoCheckStr === '1';

      if (!studentId || !studentName) continue;

      // Auto-fetch inventory items for this student's class
      const classItems = await Item.findAll({
        where: {
          [Op.or]: [
            { class_id: classInfo.id },
            { class_grade: classInfo.name }
          ]
        },
        order: [['item_type', 'ASC'], ['id', 'ASC']]
      });

      const packageItems = classItems.map((it) => {
        const inStock = (it.stock_qty || 0) > 0;
        const isPurchased = autoCheckAll && inStock;
        const itemPrice = parseFloat(it.price) || 0;

        return {
          code: it.item_code,
          name: it.name,
          item_type: it.item_type,
          subject: it.subject || '-',
          price: itemPrice,
          qty: 1,
          stock_qty: it.stock_qty || 0,
          purchased: isPurchased,
          status: isPurchased ? 'YES' : (inStock ? 'NO' : 'OUT_OF_STOCK'),
          reason: inStock ? (isPurchased ? 'Purchased' : 'Pending Selection') : 'Out of stock in library',
          subtotal: isPurchased ? itemPrice : 0
        };
      });

      const calculatedTotal = packageItems.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
      const paymentStatus = (calculatedTotal === 0 && autoCheckAll) ? 'UNPAID' : (autoCheckAll && calculatedTotal > 0 ? 'PAID' : 'UNPAID');

      const existing = await Student.findOne({
        where: {
          school_id: school.id,
          student_id: studentId
        }
      });

      const studentData = {
        entry_date: new Date().toISOString().split('T')[0],
        school_id: school.id,
        school_name: school.name,
        class_id: classInfo.id,
        class_grade: classInfo.name,
        section_id: sectionInfo.id,
        section: sectionInfo.letter,
        student_id: studentId,
        student_name: studentName,
        father_name: fatherName || null,
        email: email || null,
        items_json: packageItems,
        total_payment: calculatedTotal,
        concession: 0,
        concession_reason: null,
        net_payable: calculatedTotal,
        paid_amount: autoCheckAll ? calculatedTotal : 0,
        due_amount: autoCheckAll ? 0 : calculatedTotal,
        payment_status: paymentStatus
      };

      if (existing) {
        await existing.update(studentData);
        updated++;
      } else {
        await Student.create(studentData);
        inserted++;
      }
    }

    return sendSuccess(res, {
      school_id: school.id,
      school_name: school.name,
      total_rows: rawRows.length,
      inserted_count: inserted,
      updated_count: updated
    }, `Students roster uploaded for ${school.name}: ${inserted} added, ${updated} updated.`, 200);
  } catch (error) {
    return sendError(res, 'Failed to process student Excel file', 500, error.message);
  }
});

// Fetch class-section roster filtered strictly by school_id, class_id, and section_id
router.get('/', async (req, res) => {
  try {
    const { school_id, class_id, section_id, payment_status, search } = req.query;
    const whereClause = {};

    // Filter by numeric school ID
    let schoolObj = null;
    if (school_id !== undefined && school_id !== '') {
      const parsedSchoolId = parseInt(school_id);
      if (!isNaN(parsedSchoolId)) {
        whereClause.school_id = parsedSchoolId;
        schoolObj = await School.findByPk(parsedSchoolId);
      }
    }

    // Filter by numeric class ID
    const classInfo = class_id !== undefined && class_id !== '' ? parseClass(class_id) : parseClass(1);
    whereClause[Op.or] = [
      { class_id: classInfo.id },
      { class_grade: classInfo.name }
    ];

    // Filter by numeric section ID
    if (section_id !== undefined && section_id !== '') {
      const sectionInfo = parseSection(section_id);
      whereClause.section = sectionInfo.letter;
    }

    // Optional payment status filter
    if (payment_status && payment_status.trim() !== '') {
      whereClause.payment_status = payment_status.trim().toUpperCase();
    }

    // Optional text search by student name, student ID, or father name
    if (search && search.trim() !== '') {
      const q = `%${search.trim()}%`;
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { student_name: { [Op.like]: q } },
            { student_id: { [Op.like]: q } },
            { father_name: { [Op.like]: q } }
          ]
        }
      ];
    }

    // Auto-fetch all curriculum items (Books, Copies, Pens) mapped for this class
    const classItems = await Item.findAll({
      where: {
        [Op.or]: [
          { class_id: classInfo.id },
          { class_grade: classInfo.name }
        ]
      },
      order: [['item_type', 'ASC'], ['id', 'ASC']]
    });

    const masterItemList = classItems.map((it) => ({
      item_code: it.item_code,
      name: it.name,
      item_type: it.item_type,
      subject: it.subject || '-',
      author_publisher: it.author_publisher || 'NCERT',
      price: parseFloat(it.price) || 0,
      stock_qty: it.stock_qty || 0,
      is_in_stock: (it.stock_qty || 0) > 0
    }));

    const packageCostPerStudent = masterItemList.reduce((sum, it) => sum + it.price, 0);

    // Query enrolled students matching filter
    const students = await Student.findAll({
      where: whereClause,
      order: [['section_id', 'ASC'], ['student_name', 'ASC']]
    });

    // Calculate section-wide financial statistics
    let grandTotalPayment = 0;
    let grandConcession = 0;
    let grandNetPayable = 0;
    let grandPaidAmount = 0;
    let grandDueAmount = 0;

    let paidCount = 0;
    let partialCount = 0;
    let unpaidCount = 0;

    const studentList = students.map((s) => {
      grandTotalPayment += (parseFloat(s.total_payment) || 0);
      grandConcession += (parseFloat(s.concession) || 0);
      grandNetPayable += (parseFloat(s.net_payable) || 0);
      grandPaidAmount += (parseFloat(s.paid_amount) || 0);
      grandDueAmount += (parseFloat(s.due_amount) || 0);

      if (s.payment_status === 'PAID') paidCount++;
      else if (s.payment_status === 'PARTIAL') partialCount++;
      else unpaidCount++;

      let items = s.items_json;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = []; }
      }

      if (!items || items.length === 0) {
        items = masterItemList.map((it) => ({
          code: it.item_code,
          name: it.name,
          item_type: it.item_type,
          subject: it.subject,
          price: it.price,
          qty: 1,
          stock_qty: it.stock_qty,
          purchased: false,
          status: it.is_in_stock ? 'NO' : 'OUT_OF_STOCK',
          reason: it.is_in_stock ? 'Pending selection' : 'Out of stock in library',
          subtotal: 0
        }));
      }

      const purchasedItems = items.filter((it) => it.purchased === true || it.status === 'YES');
      const outOfStockItems = items.filter((it) => it.status === 'OUT_OF_STOCK');

      return {
        id: s.id,
        entry_date: s.entry_date,
        school_id: s.school_id,
        school_name: s.school_name,
        class_id: s.class_id,
        class_grade: s.class_grade,
        section_id: s.section_id,
        section: s.section,
        student_id: s.student_id,
        student_name: s.student_name,
        father_name: s.father_name,
        email: s.email,
        total_items_count: items.length,
        purchased_items_count: purchasedItems.length,
        out_of_stock_count: outOfStockItems.length,
        total_payment: parseFloat(s.total_payment) || 0,
        concession: parseFloat(s.concession) || 0,
        concession_reason: s.concession_reason,
        net_payable: parseFloat(s.net_payable) || 0,
        paid_amount: parseFloat(s.paid_amount) || 0,
        due_amount: parseFloat(s.due_amount) || 0,
        payment_status: s.payment_status,
        delivery_status: s.delivery_status,
        remarks: s.remarks,
        items_checklist: items
      };
    });

    return sendSuccess(res, {
      filters_applied: {
        school_id: school_id !== undefined ? parseInt(school_id) : 'All',
        class_id: classInfo.id,
        class_name: classInfo.name,
        section_id: section_id !== undefined ? parseSection(section_id).id : 'All',
        section_name: section_id !== undefined ? parseSection(section_id).letter : 'All',
        payment_status: payment_status ? payment_status.toUpperCase() : 'All'
      },
      class_curriculum: {
        curriculum: schoolObj ? schoolObj.curriculum : 'NCERT',
        class_id: classInfo.id,
        class_name: classInfo.name,
        total_package_items_count: masterItemList.length,
        full_package_cost_per_student: packageCostPerStudent,
        master_items: masterItemList
      },
      section_financial_summary: {
        total_students_in_roster: studentList.length,
        grand_total_payment: grandTotalPayment,
        grand_concession_given: grandConcession,
        grand_net_payable: grandNetPayable,
        grand_paid_collected: grandPaidAmount,
        grand_due_balance: grandDueAmount,
        collection_rate: grandNetPayable > 0 ? `${Math.round((grandPaidAmount / grandNetPayable) * 100)}%` : '0%',
        status_breakdown: {
          paid_students: paidCount,
          partial_students: partialCount,
          unpaid_students: unpaidCount
        }
      },
      students: studentList
    }, 'Class section roster fetched successfully', 200, {
      total: studentList.length
    });
  } catch (error) {
    return sendError(res, 'Failed to fetch class section roster', 500, error.message);
  }
});

// Register student in a class section with auto-populated NCERT kit
router.post('/', async (req, res) => {
  try {
    const {
      entry_date,
      school_id,
      school_name,
      class_id,
      class_grade,
      section_id,
      section,
      student_id,
      student_name,
      name,
      father_name,
      email,
      auto_check_all,
      concession,
      concession_reason,
      paid_amount,
      remarks
    } = req.body;

    const actualName = (student_name || name || '').trim();
    const actualStudentId = (student_id || '').trim();

    if (!actualStudentId || !actualName) {
      return sendError(res, 'student_id and student_name are required', 400);
    }

    const parsedSchoolId = parseInt(school_id) || 1;
    const classInfo = parseClass(class_id || class_grade);
    const sectionInfo = parseSection(section_id || section);

    // Fetch school name if not provided in payload
    let actualSchoolName = school_name;
    if (!actualSchoolName) {
      const sch = await School.findByPk(parsedSchoolId);
      actualSchoolName = sch ? sch.name : 'TGS Public School';
    }

    // Auto-fetch NCERT curriculum items for this class
    const classItems = await Item.findAll({
      where: {
        [Op.or]: [
          { class_id: classInfo.id },
          { class_grade: classInfo.name }
        ]
      },
      order: [['item_type', 'ASC'], ['id', 'ASC']]
    });

    const isDefaultChecked = auto_check_all === true;
    const packageItems = classItems.map((it) => {
      const inStock = (it.stock_qty || 0) > 0;
      const isPurchased = isDefaultChecked && inStock;
      const itemPrice = parseFloat(it.price) || 0;

      return {
        code: it.item_code,
        name: it.name,
        item_type: it.item_type,
        subject: it.subject || '-',
        price: itemPrice,
        qty: 1,
        stock_qty: it.stock_qty || 0,
        purchased: isPurchased,
        status: isPurchased ? 'YES' : (inStock ? 'NO' : 'OUT_OF_STOCK'),
        reason: inStock ? (isPurchased ? 'Purchased' : 'Pending Selection') : 'Out of stock in library',
        subtotal: isPurchased ? itemPrice : 0
      };
    });

    const calculatedTotal = packageItems.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
    const parsedConcession = Math.max(0, parseFloat(concession) || 0);
    const calculatedNet = Math.max(0, calculatedTotal - parsedConcession);
    const parsedPaid = Math.max(0, parseFloat(paid_amount) || 0);
    const calculatedDue = Math.max(0, calculatedNet - parsedPaid);

    let paymentStatus = 'UNPAID';
    if (calculatedDue === 0 && calculatedNet > 0) paymentStatus = 'PAID';
    else if (parsedPaid > 0 && calculatedDue > 0) paymentStatus = 'PARTIAL';

    // Upsert student record
    let student = await Student.findOne({
      where: {
        school_id: parsedSchoolId,
        student_id: actualStudentId
      }
    });

    const studentData = {
      entry_date: entry_date || new Date().toISOString().split('T')[0],
      school_id: parsedSchoolId,
      school_name: actualSchoolName,
      class_id: classInfo.id,
      class_grade: classInfo.name,
      section_id: sectionInfo.id,
      section: sectionInfo.letter,
      student_id: actualStudentId,
      student_name: actualName,
      father_name: father_name ? father_name.trim() : null,
      email: email ? email.trim() : null,
      items_json: packageItems,
      total_payment: calculatedTotal,
      concession: parsedConcession,
      concession_reason: concession_reason ? concession_reason.trim() : null,
      net_payable: calculatedNet,
      paid_amount: parsedPaid,
      due_amount: calculatedDue,
      payment_status: paymentStatus,
      remarks: remarks ? remarks.trim() : null
    };

    if (student) {
      await student.update(studentData);
    } else {
      student = await Student.create(studentData);
    }

    return sendSuccess(res, student, `Student registered in Class ${classInfo.id} Section ${sectionInfo.letter}`, 201);
  } catch (error) {
    return sendError(res, 'Failed to save student', 500, error.message);
  }
});

// Update student checklist, auto-recalculating totals, concessions, and due balances
router.patch('/:id/checklist', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return sendError(res, 'Student record not found', 404);
    }

    const { checked_items, items, concession, concession_reason, paid_amount, remarks } = req.body;

    let currentItems = student.items_json;
    if (typeof currentItems === 'string') {
      try { currentItems = JSON.parse(currentItems); } catch (e) { currentItems = []; }
    }

    const updates = checked_items || items || [];

    if (Array.isArray(updates) && updates.length > 0) {
      currentItems = currentItems.map((item) => {
        const match = updates.find((u) => (u.code && u.code === item.code) || (u.name && u.name === item.name));
        if (match) {
          const isPurchased = match.purchased === true || match.status === 'YES';
          const itemPrice = parseFloat(item.price) || 0;
          const itemQty = parseInt(match.qty !== undefined ? match.qty : item.qty) || 1;

          return {
            ...item,
            qty: itemQty,
            purchased: isPurchased,
            status: isPurchased ? 'YES' : (match.status || (match.reason ? 'OUT_OF_STOCK' : 'NO')),
            reason: match.reason !== undefined ? match.reason : (isPurchased ? 'Purchased' : (match.status === 'OUT_OF_STOCK' ? 'Out of stock in library' : 'Not purchased')),
            subtotal: isPurchased ? (itemPrice * itemQty) : 0
          };
        }
        return item;
      });
    }

    const newTotalPayment = currentItems.reduce((acc, it) => acc + (parseFloat(it.subtotal) || 0), 0);
    const newConcession = concession !== undefined ? Math.max(0, parseFloat(concession) || 0) : student.concession;
    const newNetPayable = Math.max(0, newTotalPayment - newConcession);
    const newPaidAmount = paid_amount !== undefined ? Math.max(0, parseFloat(paid_amount) || 0) : student.paid_amount;
    const newDueAmount = Math.max(0, newNetPayable - newPaidAmount);

    let paymentStatus = 'UNPAID';
    if (newDueAmount === 0 && newNetPayable > 0) paymentStatus = 'PAID';
    else if (newPaidAmount > 0 && newDueAmount > 0) paymentStatus = 'PARTIAL';

    await student.update({
      items_json: currentItems,
      total_payment: newTotalPayment,
      concession: newConcession,
      concession_reason: concession_reason !== undefined ? concession_reason : student.concession_reason,
      net_payable: newNetPayable,
      paid_amount: newPaidAmount,
      due_amount: newDueAmount,
      payment_status: paymentStatus,
      remarks: remarks !== undefined ? remarks : student.remarks
    });

    const checkedCount = currentItems.filter((i) => i.purchased).length;

    return sendSuccess(res, {
      student_id: student.student_id,
      student_name: student.student_name,
      school_id: student.school_id,
      class_id: student.class_id,
      section_id: student.section_id,
      items_checked_count: `${checkedCount}/${currentItems.length}`,
      total_payment: newTotalPayment,
      concession: newConcession,
      net_payable: newNetPayable,
      paid_amount: newPaidAmount,
      due_amount: newDueAmount,
      payment_status: paymentStatus,
      items: currentItems
    }, `Checklist updated for ${student.student_name}! ${checkedCount} items purchased. Total: ₹${newTotalPayment}, Due: ₹${newDueAmount}`, 200);
  } catch (error) {
    return sendError(res, 'Failed to update checklist', 500, error.message);
  }
});

// Fetch single student record by numeric ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }
    return sendSuccess(res, student, 'Student details fetched successfully', 200);
  } catch (error) {
    return sendError(res, 'Failed to fetch student', 500, error.message);
  }
});

// Delete student record by ID
router.delete('/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }
    await student.destroy();
    return sendSuccess(res, null, 'Student deleted successfully', 200);
  } catch (error) {
    return sendError(res, 'Failed to delete student', 500, error.message);
  }
});

module.exports = router;
