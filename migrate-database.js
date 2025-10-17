#!/usr/bin/env node

/**
 * Database Migration Script
 * Adds new fields to existing Firestore documents
 * 
 * Usage: node migrate-database.js
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccount.json'); // Update this path
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const collectionName = process.env.COLLECTION_NAME || 'blacklist';

/**
 * Generate random season (1-10) and episode (1-23)
 */
function generateRandomAppearance() {
  const season = Math.floor(Math.random() * 10) + 1; // 1-10
  const episode = Math.floor(Math.random() * 23) + 1; // 1-23
  return { season, episode };
}

/**
 * Generate multiple appearances for a character (1-5 appearances)
 */
function generateAppearances() {
  const numAppearances = Math.floor(Math.random() * 5) + 1; // 1-5 appearances
  const appearances = [];
  
  for (let i = 0; i < numAppearances; i++) {
    appearances.push(generateRandomAppearance());
  }
  
  return appearances;
}

/**
 * Update a single document with new fields
 */
async function updateDocument(doc) {
  const docData = doc.data();
  
  // Skip if already migrated
  if (docData.image && docData.link && docData.bio && docData.appearance) {
    console.log(`Document ${doc.id} already migrated, skipping...`);
    return;
  }
  
  const updateData = {
    // Keep existing v1 and v2 for backward compatibility
    v1: docData.v1 || 0,
    v2: docData.v2 || 0,
    
    // Add new version object
    version: {
      v1: docData.v1 || 0,
      v2: docData.v2 || 0
    },
    
    // Add new fields
    image: "https://static.wikia.nocookie.net/blacklist/images/3/36/Red_FBI.png",
    link: "https://the-blacklist.fandom.com/wiki/Raymond_Reddington",
    bio: "He is a criminal mastermind, making it to #4 and later to #1 on the FBI's Ten Most Wanted Fugitives, who suddenly turns himself in after 20+ years of evading the FBI.",
    appearance: generateAppearances()
  };
  
  try {
    await doc.ref.update(updateData);
    console.log(`✅ Updated document ${doc.id}`);
  } catch (error) {
    console.error(`❌ Error updating document ${doc.id}:`, error);
  }
}

/**
 * Main migration function
 */
async function migrateDatabase() {
  console.log('🚀 Starting database migration...');
  console.log(`📁 Collection: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    console.log(`📊 Found ${snapshot.size} documents to process`);
    
    let processed = 0;
    let errors = 0;
    
    for (const doc of snapshot.docs) {
      try {
        await updateDocument(doc);
        processed++;
        
        // Add small delay to avoid rate limiting
        if (processed % 10 === 0) {
          console.log(`📈 Processed ${processed}/${snapshot.size} documents...`);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`❌ Error processing document ${doc.id}:`, error);
        errors++;
      }
    }
    
    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successfully processed: ${processed} documents`);
    console.log(`❌ Errors: ${errors} documents`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  }
}

/**
 * Generate sample data for testing
 */
function generateSampleData() {
  console.log('📝 Sample data structure:');
  console.log(JSON.stringify({
    id: "sample_001",
    name: "Sample Character",
    v1: 1,
    v2: 101,
    version: {
      v1: 1,
      v2: 101
    },
    status: "active",
    category: "Male",
    image: "https://static.wikia.nocookie.net/blacklist/images/3/36/Red_FBI.png",
    link: "https://the-blacklist.fandom.com/wiki/Raymond_Reddington",
    bio: "He is a criminal mastermind, making it to #4 and later to #1 on the FBI's Ten Most Wanted Fugitives, who suddenly turns himself in after 20+ years of evading the FBI.",
    appearance: generateAppearances()
  }, null, 2));
}

// Run migration
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--sample')) {
    generateSampleData();
  } else {
    migrateDatabase();
  }
}

module.exports = {
  generateRandomAppearance,
  generateAppearances,
  updateDocument,
  migrateDatabase
};
