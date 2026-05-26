const https = require('https');
const fs = require('fs');
const path = require('path');

// Load mapping
const mappingPath = path.join(__dirname, 'image-mapping.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

// Images directory
const imagesDir = path.join(__dirname, '..', 'public', 'images');

// Download a single image
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': 'https://pdr.infotech.gov.ua/'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        downloadImage(response.headers.location, outputPath)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(outputPath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
      }
      reject(err);
    });
  });
}

// Check if image file exists with any extension
function findExistingImage(imageId) {
  const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
  for (const ext of extensions) {
    const filePath = path.join(imagesDir, `q${imageId}${ext}`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

async function main() {
  const entries = Object.entries(mapping);
  console.log(`Found ${entries.length} mappings to download\n`);

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const [imageId, data] of entries) {
    const existingPath = findExistingImage(imageId);
    if (!existingPath) {
      console.log(`⊘ Skipping q${imageId} - no existing image to replace`);
      skipped++;
      continue;
    }

    // Get extension from existing file
    const ext = path.extname(existingPath);
    const outputPath = path.join(imagesDir, `q${imageId}.jpg`);

    try {
      process.stdout.write(`↓ Downloading q${imageId}...`);
      await downloadImage(data.imageUrl, outputPath);

      // Remove old file if extension is different
      if (ext !== '.jpg' && existingPath !== outputPath) {
        fs.unlinkSync(existingPath);
      }

      console.log(` ✓`);
      downloaded++;

      // Small delay to be nice to the server
      await new Promise(r => setTimeout(r, 100));
    } catch (err) {
      console.log(` ✗ ${err.message}`);
      failed++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
