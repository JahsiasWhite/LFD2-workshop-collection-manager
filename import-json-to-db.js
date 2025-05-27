const fs = require('fs').promises;
const { connectDB, client } = require('./db/config');

async function importJsonToDb() {
  try {
    const db = await connectDB();

    // Read JSON files
    const data1 = JSON.parse(
      await fs.readFile('./website/public/workshop_items1.json', 'utf8')
    );
    const data2 = JSON.parse(
      await fs.readFile('./website/public/workshop_items2.json', 'utf8')
    );

    console.error('Combining Data...');

    // Combine and deduplicate data
    const combinedData = [...data1, ...data2];
    const uniqueData = Array.from(
      new Map(combinedData.map((item) => [item.id, item])).values()
    );
    // const uniqueData = [combinedData[0]];

    console.error(
      'Combined Data. Total number of records: ',
      uniqueData.length
    );

    // Insert data into MongoDB
    // Using bulkWrite for better performance
    const operations = uniqueData.map((mod) => ({
      updateOne: {
        filter: { id: mod.id },
        update: { $set: mod },
        upsert: true,
      },
    }));

    console.error('Writing to db...');

    const result = await db.collection('mods').bulkWrite(operations);
    console.log('Data import completed successfully:', result);
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await client.close();
  }
}

importJsonToDb();
