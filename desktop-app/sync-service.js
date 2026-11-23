const axios = require('axios');
const path = require('path');
const fs = require('fs');

/**
 * Enterprise Cloud Synchronization Engine for India Book House
 * Synchronizes the 3 Core Pillars:
 * 1. Master Data (Item Types, Classes, Subjects, Publishers, Boards, Curriculums, Items/Books)
 * 2. Schools (Affiliated school registrations & dispatch tracking)
 * 3. Students (Rosters, Excel bulk uploads, checklists, concessions & fee settlements)
 */
class SyncService {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.defaultCloudUrl = process.env.CLOUD_SERVER_URL || 'http://13.140.202.92:5001';
    this.lastSyncedAt = null;
  }

  // Check if internet connection to cloud server is alive
  async isOnline(cloudUrl = this.defaultCloudUrl) {
    try {
      const res = await axios.get(`${cloudUrl}/api/health`, { timeout: 4000 });
      return res.status === 200;
    } catch {
      return false;
    }
  }

  // Get current synchronization status
  async getStatus(cloudUrl = this.defaultCloudUrl) {
    const online = await this.isOnline(cloudUrl);
    return {
      isOnline: online,
      cloudUrl: cloudUrl,
      lastSyncedAt: this.lastSyncedAt,
      dbPath: this.dbPath
    };
  }

  // Perform full two-way synchronization
  async syncAll(cloudUrl = this.defaultCloudUrl) {
    const online = await this.isOnline(cloudUrl);
    if (!online) {
      return {
        success: false,
        message: 'Cloud server is unreachable. Please check your internet connection.'
      };
    }

    try {
      const modelsPath = (typeof process !== 'undefined' && process.resourcesPath && fs.existsSync(path.join(process.resourcesPath, 'backend', 'models')))
        ? path.join(process.resourcesPath, 'backend', 'models')
        : path.join(__dirname, '../backend/models');
      
      const {
        Student,
        School,
        Item,
        ItemType,
        ClassGrade,
        Subject,
        AuthorPublisher,
        BoardType,
        Curriculum,
        Role
      } = require(modelsPath);

      // ==========================================
      // PILLAR 1: MASTER DATA SYNC (ALL 7 MASTERS + ITEMS)
      // ==========================================
      let masterSyncStats = { masters: 0, items: 0 };
      try {
        const mastersRes = await axios.get(`${cloudUrl}/api/masters/all`, { timeout: 10000 });
        if (mastersRes.data && mastersRes.data.data) {
          const m = mastersRes.data.data;
          if (Array.isArray(m.item_types)) {
            for (const row of m.item_types) await ItemType.upsert(row);
          }
          if (Array.isArray(m.classes)) {
            for (const row of m.classes) await ClassGrade.upsert(row);
          }
          if (Array.isArray(m.subjects)) {
            for (const row of m.subjects) await Subject.upsert(row);
          }
          if (Array.isArray(m.publishers)) {
            for (const row of m.publishers) await AuthorPublisher.upsert(row);
          }
          if (Array.isArray(m.boards)) {
            for (const row of m.boards) await BoardType.upsert(row);
          }
          if (Array.isArray(m.curriculums)) {
            for (const row of m.curriculums) await Curriculum.upsert(row);
          }
          if (Array.isArray(m.roles)) {
            for (const row of m.roles) await Role.upsert(row);
          }
          masterSyncStats.masters = 7;
        }

        // Pull Inventory Items (Books, Copies, Pens)
        const itemsRes = await axios.get(`${cloudUrl}/api/items`, { timeout: 10000 });
        if (itemsRes.data && Array.isArray(itemsRes.data.data)) {
          for (const it of itemsRes.data.data) {
            await Item.upsert(it);
            masterSyncStats.items++;
          }
        }
      } catch (masterErr) {
        console.warn('[Sync Engine] Master data sync warning:', masterErr.message);
      }

      // ==========================================
      // PILLAR 2: SCHOOLS TWO-WAY SYNC
      // ==========================================
      let schoolsSynced = 0;
      try {
        // Push local schools to cloud
        const localSchools = await School.findAll();
        if (localSchools.length > 0) {
          await axios.post(
            `${cloudUrl}/api/sync/schools`,
            { schools: localSchools },
            { timeout: 10000 }
          ).catch(() => {});
        }

        // Pull cloud schools to local
        const cloudSchoolsRes = await axios.get(`${cloudUrl}/api/schools`, { timeout: 10000 });
        if (cloudSchoolsRes.data && Array.isArray(cloudSchoolsRes.data.data)) {
          for (const sc of cloudSchoolsRes.data.data) {
            await School.upsert(sc);
            schoolsSynced++;
          }
        }
      } catch (schoolErr) {
        console.warn('[Sync Engine] School sync warning:', schoolErr.message);
      }

      // ==========================================
      // PILLAR 3: STUDENTS TWO-WAY SYNC
      // ==========================================
      let studentsPushed = 0;
      let studentsPulled = 0;
      try {
        // Push local student records (with checklists, concessions, paid fees) to cloud
        const localStudents = await Student.findAll();
        if (localStudents.length > 0) {
          const pushResponse = await axios.post(
            `${cloudUrl}/api/sync/students`,
            { students: localStudents },
            { timeout: 20000 }
          );
          if (pushResponse.data && pushResponse.data.success) {
            studentsPushed = localStudents.length;
          }
        }

        // Pull any students registered on cloud to local
        const cloudStudentsRes = await axios.get(`${cloudUrl}/api/students`, { timeout: 15000 });
        if (cloudStudentsRes.data && Array.isArray(cloudStudentsRes.data.data)) {
          for (const st of cloudStudentsRes.data.data) {
            await Student.upsert(st);
            studentsPulled++;
          }
        }
      } catch (studentErr) {
        console.warn('[Sync Engine] Student sync warning:', studentErr.message);
      }

      this.lastSyncedAt = new Date().toISOString();

      return {
        success: true,
        message: 'All 3 Core Pillars Synchronized Successfully!',
        stats: {
          masterTablesSynced: masterSyncStats.masters,
          booksInventorySynced: masterSyncStats.items,
          schoolsSynced,
          studentsPushed,
          studentsPulled,
          syncedAt: this.lastSyncedAt
        }
      };

    } catch (err) {
      console.error('[Sync Engine] Critical sync error:', err);
      return {
        success: false,
        message: `Sync failed: ${err.message}`
      };
    }
  }
}

module.exports = SyncService;
