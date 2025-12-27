const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const ajv = new Ajv({ allErrors: true, strict: false });

const schemaPath = path.join(__dirname, '../src/shared/data/schema.json');
const dataPath = path.join(__dirname, '../src/shared/data/blacklist.json');

try {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const validate = ajv.compile(schema);
    const valid = validate(data);

    if (!valid) {
        console.error('❌ Data Validation Failed:');
        validate.errors.forEach(error => {
            console.error(`  - ${error.instancePath} ${error.message}`);
        });
        process.exit(1);
    } else {
        console.log('✅ Data integrity verified!');
    }
} catch (error) {
    console.error('❌ Error running validation:', error.message);
    process.exit(1);
}
