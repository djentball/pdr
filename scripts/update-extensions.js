const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '..', 'src', 'data', 'questions.json');
const mappingPath = path.join(__dirname, 'image-mapping.json');
const imagesDir = path.join(__dirname, '..', 'public', 'images');

const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

let updated = 0;
const oldFiles = [];

for (const q of questions) {
  if (!q.image) continue;

  const match = q.image.match(/q(\w+)\.(jpg|webp|png)/);
  if (!match) continue;

  const imageId = match[1];
  const ext = match[2];

  if (mapping[imageId] && ext !== 'jpg') {
    // Track old file for deletion
    const oldPath = path.join(imagesDir, `q${imageId}.${ext}`);
    if (fs.existsSync(oldPath)) {
      oldFiles.push(oldPath);
    }

    q.image = `/images/q${imageId}.jpg`;
    updated++;
  }
}

// Save updated questions
fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));
console.log(`Updated ${updated} image references to .jpg`);

// Delete old webp files
let deleted = 0;
for (const oldPath of oldFiles) {
  try {
    fs.unlinkSync(oldPath);
    deleted++;
    console.log(`Deleted: ${path.basename(oldPath)}`);
  } catch (err) {
    console.log(`Failed to delete: ${path.basename(oldPath)}`);
  }
}

console.log(`\nDeleted ${deleted} old files`);
