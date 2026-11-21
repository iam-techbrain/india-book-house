const bcrypt = require('bcryptjs');
const {
  sequelize,
  User,
  School,
  Item,
  Student,
  ItemType,
  ClassGrade,
  Subject,
  AuthorPublisher,
  BoardType,
  Curriculum,
  Role
} = require('./models');

// Seed exactly 2 records per table for clean structure demonstration
async function seedDatabase() {
  try {
    // Reset and synchronize all tables fresh
    await sequelize.sync({ force: true });
    console.log('🔄 Database tables reset successfully.');

    // 1. User table (2 rows)
    const adminPassword = await bcrypt.hash('admin123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);
    await User.bulkCreate([
      { name: 'Administrator', email: 'admin@indiabookhouse.com', password: adminPassword, role: 'admin' },
      { name: 'Staff Operator', email: 'staff@indiabookhouse.com', password: staffPassword, role: 'staff' }
    ]);
    console.log('✅ Users seeded: 2 rows');

    // 2. ItemType master (2 rows)
    await ItemType.bulkCreate([
      { name: 'BOOK', description: 'Textbooks and academic books' },
      { name: 'COPY', description: 'Notebooks and writing copies' }
    ]);
    console.log('✅ Item Types seeded: 2 rows');

    // 3. ClassGrade master (2 rows)
    await ClassGrade.bulkCreate([
      { name: 'Class 1', class_number: 1 },
      { name: 'Class 2', class_number: 2 }
    ]);
    console.log('✅ Classes seeded: 2 rows');

    // 4. Subject master (2 rows)
    await Subject.bulkCreate([
      { name: 'Hindi', code: 'HIN' },
      { name: 'English', code: 'ENG' }
    ]);
    console.log('✅ Subjects seeded: 2 rows');

    // 5. AuthorPublisher master (2 rows)
    await AuthorPublisher.bulkCreate([
      { name: 'NCERT', type: 'PUBLISHER' },
      { name: 'Classmate', type: 'STATIONERY_BRAND' }
    ]);
    console.log('✅ Publishers seeded: 2 rows');

    // 6. BoardType master (2 rows)
    await BoardType.bulkCreate([
      { name: 'CBSE', code: 'CBSE' },
      { name: 'ICSE', code: 'ICSE' }
    ]);
    console.log('✅ Board Types seeded: 2 rows');

    // 7. Curriculum master (2 rows)
    await Curriculum.bulkCreate([
      { name: 'NCERT', description: 'National Curriculum Framework' },
      { name: 'Private Publisher', description: 'Private Independent Publishers' }
    ]);
    console.log('✅ Curriculums seeded: 2 rows');

    // 8. Role master (2 rows)
    await Role.bulkCreate([
      { name: 'admin', description: 'System Administrator with full access' },
      { name: 'staff', description: 'Operational staff for inventory and rosters' }
    ]);
    console.log('✅ User Roles seeded: 2 rows');

    // 9. School table (2 rows)
    const schools = await School.bulkCreate([
      { code: 'DPS-01', name: 'Delhi Public School', address: 'Sector 4, Bokaro / New Delhi', board_type: 'CBSE', curriculum: 'NCERT', status: 'ACTIVE' },
      { code: 'SXS-01', name: 'St. Xavier School', address: 'Civil Lines, Delhi', board_type: 'ICSE', curriculum: 'NCERT', status: 'ACTIVE' }
    ]);
    console.log('✅ Schools seeded: 2 rows');

    // 10. Item inventory table (2 rows)
    const items = await Item.bulkCreate([
      { item_code: 'BK-C1-01', name: 'Rimjhim (Hindi)', item_type: 'BOOK', class_id: 1, class_grade: 'Class 1', subject: 'Hindi', author_publisher: 'NCERT', price: 65.00, stock_qty: 50 },
      { item_code: 'COPY-C1-01', name: '4-Line English Notebook', item_type: 'COPY', class_id: 1, class_grade: 'Class 1', subject: null, author_publisher: 'Classmate', price: 40.00, stock_qty: 100 }
    ]);
    console.log('✅ Items seeded: 2 rows');

    // Standard syllabus kit items for Class 1
    const sampleKit = [
      { id: items[0].id, code: items[0].item_code, name: items[0].name, item_type: items[0].item_type, subject: items[0].subject, price: 65, qty: 1, subtotal: 65, purchased: true, status: 'YES', reason: 'Purchased' },
      { id: items[1].id, code: items[1].item_code, name: items[1].name, item_type: items[1].item_type, subject: null, price: 40, qty: 1, subtotal: 40, purchased: true, status: 'YES', reason: 'Purchased' }
    ];

    const partialKit = [
      { id: items[0].id, code: items[0].item_code, name: items[0].name, item_type: items[0].item_type, subject: items[0].subject, price: 65, qty: 1, subtotal: 0, purchased: false, status: 'NO', reason: 'Pending Selection' },
      { id: items[1].id, code: items[1].item_code, name: items[1].name, item_type: items[1].item_type, subject: null, price: 40, qty: 1, subtotal: 40, purchased: true, status: 'YES', reason: 'Purchased' }
    ];

    // 11. Student table (2 rows)
    await Student.bulkCreate([
      {
        entry_date: '2026-11-21',
        school_id: schools[0].id,
        school_name: schools[0].name,
        class_id: 1,
        class_grade: 'Class 1',
        section_id: 1,
        section: 'A',
        student_id: 'IBH-2026-001',
        student_name: 'Aarav Sharma',
        father_name: 'Rajesh Sharma',
        email: 'aarav@example.com',
        items_json: sampleKit,
        total_payment: 105,
        concession: 0,
        concession_reason: null,
        net_payable: 105,
        paid_amount: 105,
        due_amount: 0,
        payment_status: 'PAID'
      },
      {
        entry_date: '2026-11-21',
        school_id: schools[0].id,
        school_name: schools[0].name,
        class_id: 1,
        class_grade: 'Class 1',
        section_id: 1,
        section: 'A',
        student_id: 'IBH-2026-002',
        student_name: 'Diya Patel',
        father_name: 'Suresh Patel',
        email: 'diya@example.com',
        items_json: partialKit,
        total_payment: 40,
        concession: 0,
        concession_reason: null,
        net_payable: 40,
        paid_amount: 20,
        due_amount: 20,
        payment_status: 'PARTIAL'
      }
    ]);
    console.log('✅ Students seeded: 2 rows');

    console.log('\n🎉 Finished! Exactly 2 records seeded per table.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();