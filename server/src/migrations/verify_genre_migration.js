import pico from 'picocolors';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const sqliteVerbose = sqlite3.verbose();
const db_path = './library.db';

async function verify_migration() {
  let db = null;

  try {
    db = await open({
      filename: db_path,
      driver: sqliteVerbose.Database,
    });

    console.log(pico.bgBlue(pico.bold(' Verifying Genre Migration ')));

    const tables = ['BOOKS', 'AUDIOBOOKS', 'CDS', 'VIDEOS', 'VINYL_ALBUMS'];

    for (const table of tables) {
      console.log(pico.cyan(`\n${table}:`));

      // Get first 3 records with genre
      const records = await db.all(
        `SELECT id, genre FROM ${table} WHERE genre IS NOT NULL LIMIT 3`
      );

      records.forEach((record) => {
        console.log(pico.green(`  ID ${record.id}: ${record.genre}`));
      });
    }

    console.log(pico.bgGreen(pico.bold('\n✓ Verification Complete ')));
  } catch (error) {
    console.error(pico.bgRed(pico.bold(' Verification Failed ')));
    console.error(error);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

verify_migration();
