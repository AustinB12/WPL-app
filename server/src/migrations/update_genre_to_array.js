import pico from 'picocolors';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const sqliteVerbose = sqlite3.verbose();
const db_path = './library.db';

async function migrate_genre_to_array() {
  let db = null;

  try {
    db = await open({
      filename: db_path,
      driver: sqliteVerbose.Database,
    });

    console.log(pico.bgBlue(pico.bold(' Starting Genre Migration ')));

    const tables = ['BOOKS', 'AUDIOBOOKS', 'CDS', 'VIDEOS', 'VINYL_ALBUMS'];

    for (const table of tables) {
      console.log(pico.cyan(`\nProcessing table: ${table}`));

      // Get all records with non-null genre
      const records = await db.all(
        `SELECT id, genre FROM ${table} WHERE genre IS NOT NULL AND genre != ''`
      );

      console.log(pico.yellow(`  Found ${records.length} records to update`));

      let updated_count = 0;

      for (const record of records) {
        const current_genre = record.genre;

        // Skip if already in JSON array format
        if (current_genre.startsWith('[') && current_genre.endsWith(']')) {
          console.log(
            pico.gray(`  ID ${record.id}: Already in array format, skipping`)
          );
          continue;
        }

        // Convert string to JSON array
        // Handle comma-separated values if they exist
        let genre_array;
        if (current_genre.includes(',')) {
          genre_array = current_genre.split(',').map((g) => g.trim());
        } else {
          genre_array = [current_genre.trim()];
        }

        const new_genre = JSON.stringify(genre_array);

        // Update the record
        await db.run(`UPDATE ${table} SET genre = ? WHERE id = ?`, [
          new_genre,
          record.id,
        ]);

        updated_count++;
        console.log(
          pico.green(`  ID ${record.id}: "${current_genre}" → ${new_genre}`)
        );
      }

      console.log(
        pico.bgGreen(pico.bold(` ${table}: Updated ${updated_count} records `))
      );
    }

    console.log(
      pico.bgGreen(pico.bold('\n✓ Genre Migration Completed Successfully '))
    );
  } catch (error) {
    console.error(pico.bgRed(pico.bold(' Migration Failed ')));
    console.error(error);
    throw error;
  } finally {
    if (db) {
      await db.close();
      console.log(pico.gray('\nDatabase connection closed'));
    }
  }
}

// Run the migration
migrate_genre_to_array()
  .then(() => {
    console.log(pico.green('\nMigration script finished'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(pico.red('\nMigration script failed:'), error);
    process.exit(1);
  });
