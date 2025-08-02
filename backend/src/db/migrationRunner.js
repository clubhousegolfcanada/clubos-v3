const fs = require('fs').promises;
const path = require('path');
const { pool } = require('./pool');

/**
 * Migration runner with rollback support
 */
class MigrationRunner {
  constructor() {
    this.migrationsDir = path.join(__dirname, 'migrations');
  }

  async init() {
    // Create migrations tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW(),
        rollback_at TIMESTAMP,
        checksum VARCHAR(64) NOT NULL
      )
    `);
  }

  async getExecutedMigrations() {
    const result = await pool.query(
      'SELECT filename, checksum FROM migrations WHERE rollback_at IS NULL ORDER BY filename'
    );
    return result.rows;
  }

  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsDir);
      return files
        .filter(f => f.endsWith('.sql'))
        .sort();
    } catch (error) {
      // Create migrations directory if it doesn't exist
      await fs.mkdir(this.migrationsDir, { recursive: true });
      return [];
    }
  }

  async calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async runMigrations() {
    await this.init();
    
    const executed = await this.getExecutedMigrations();
    const executedMap = new Map(executed.map(m => [m.filename, m.checksum]));
    
    const files = await this.getMigrationFiles();
    let migrationsRun = 0;
    
    for (const file of files) {
      const filePath = path.join(this.migrationsDir, file);
      const content = await fs.readFile(filePath, 'utf8');
      const checksum = await this.calculateChecksum(content);
      
      // Check if already executed
      if (executedMap.has(file)) {
        // Verify checksum
        if (executedMap.get(file) !== checksum) {
          throw new Error(
            `Migration ${file} has been modified after execution! ` +
            `This is dangerous. Please create a new migration file instead.`
          );
        }
        continue;
      }
      
      console.log(`Running migration: ${file}`);
      
      try {
        // Start transaction
        await pool.query('BEGIN');
        
        // Run migration
        await pool.query(content);
        
        // Record migration
        await pool.query(
          'INSERT INTO migrations (filename, checksum) VALUES ($1, $2)',
          [file, checksum]
        );
        
        // Commit transaction
        await pool.query('COMMIT');
        
        console.log(`✅ Migration completed: ${file}`);
        migrationsRun++;
      } catch (error) {
        // Rollback transaction
        await pool.query('ROLLBACK');
        
        console.error(`❌ Migration failed: ${file}`);
        console.error(error.message);
        throw error;
      }
    }
    
    if (migrationsRun === 0) {
      console.log('✅ All migrations are up to date');
    } else {
      console.log(`✅ Ran ${migrationsRun} migration(s)`);
    }
  }

  async rollback(steps = 1) {
    await this.init();
    
    const result = await pool.query(
      `SELECT filename FROM migrations 
       WHERE rollback_at IS NULL 
       ORDER BY executed_at DESC 
       LIMIT $1`,
      [steps]
    );
    
    if (result.rows.length === 0) {
      console.log('No migrations to rollback');
      return;
    }
    
    for (const row of result.rows) {
      const { filename } = row;
      const rollbackFile = filename.replace('.sql', '.down.sql');
      const rollbackPath = path.join(this.migrationsDir, rollbackFile);
      
      try {
        const content = await fs.readFile(rollbackPath, 'utf8');
        
        console.log(`Rolling back: ${filename}`);
        
        await pool.query('BEGIN');
        await pool.query(content);
        await pool.query(
          'UPDATE migrations SET rollback_at = NOW() WHERE filename = $1',
          [filename]
        );
        await pool.query('COMMIT');
        
        console.log(`✅ Rolled back: ${filename}`);
      } catch (error) {
        await pool.query('ROLLBACK');
        
        if (error.code === 'ENOENT') {
          console.error(`❌ Rollback file not found: ${rollbackFile}`);
          console.error('Please create a .down.sql file for this migration');
        } else {
          console.error(`❌ Rollback failed: ${filename}`);
          console.error(error.message);
        }
        throw error;
      }
    }
  }

  async status() {
    await this.init();
    
    const executed = await this.getExecutedMigrations();
    const files = await this.getMigrationFiles();
    
    console.log('Migration Status:');
    console.log('=================');
    
    for (const file of files) {
      const migration = executed.find(m => m.filename === file);
      if (migration) {
        console.log(`✅ ${file} - Executed`);
      } else {
        console.log(`⏳ ${file} - Pending`);
      }
    }
    
    // Check for executed migrations with missing files
    for (const migration of executed) {
      if (!files.includes(migration.filename)) {
        console.log(`⚠️  ${migration.filename} - Executed but file missing!`);
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const runner = new MigrationRunner();
  
  (async () => {
    try {
      switch (command) {
        case 'up':
          await runner.runMigrations();
          break;
        case 'down':
          const steps = parseInt(process.argv[3]) || 1;
          await runner.rollback(steps);
          break;
        case 'status':
          await runner.status();
          break;
        default:
          console.log('Usage:');
          console.log('  node migrationRunner.js up      - Run pending migrations');
          console.log('  node migrationRunner.js down [n] - Rollback n migrations (default: 1)');
          console.log('  node migrationRunner.js status  - Show migration status');
      }
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  })();
}

module.exports = MigrationRunner;