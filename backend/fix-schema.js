const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// Fix id fields - add @default(cuid()) if missing
content = content.replace(/^(\s+id\s+String\s+@id)$/gm, '$1 @default(cuid())');

// Fix updatedAt fields - add @updatedAt if missing
content = content.replace(/^(\s+updatedAt\s+DateTime)$/gm, '$1 @updatedAt');

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Schema fixed successfully!');
