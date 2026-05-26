const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');

// Watermark is in top-left corner, approximately 130x45 pixels
const WATERMARK_WIDTH = 130;
const WATERMARK_HEIGHT = 45;

// Images from vodiy.ua that have watermarks (not from pdrtest.com)
const VODIY_IMAGES = fs.readdirSync(IMAGES_DIR)
  .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
  .filter(f => !f.startsWith('q08') && !f.startsWith('q09') && !f.startsWith('q10') &&
               !f.startsWith('q11') && !f.startsWith('q12') && !f.startsWith('q13') &&
               !f.startsWith('q14') && !f.startsWith('q15') && !f.startsWith('q16'));

async function removeWatermark(filename) {
  const filepath = path.join(IMAGES_DIR, filename);
  const tempPath = path.join(IMAGES_DIR, `temp_${filename}`);

  try {
    const image = sharp(filepath);
    const metadata = await image.metadata();

    // Skip if image is too small
    if (metadata.width < WATERMARK_WIDTH * 2 || metadata.height < WATERMARK_HEIGHT * 2) {
      console.log(`Skipping (too small): ${filename}`);
      return;
    }

    // Extract the area to the right of watermark to use as patch
    const patchBuffer = await sharp(filepath)
      .extract({
        left: WATERMARK_WIDTH,
        top: 0,
        width: WATERMARK_WIDTH,
        height: WATERMARK_HEIGHT
      })
      .toBuffer();

    // Composite the patch over the watermark area
    await image
      .composite([{
        input: patchBuffer,
        left: 0,
        top: 0
      }])
      .toFile(tempPath);

    // Replace original with processed image
    fs.renameSync(tempPath, filepath);
    console.log(`Processed: ${filename}`);

  } catch (err) {
    console.error(`Error processing ${filename}:`, err.message);
    // Clean up temp file if exists
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

async function main() {
  console.log(`Processing ${VODIY_IMAGES.length} images from vodiy.ua...\n`);

  let processed = 0;
  let failed = 0;

  for (const filename of VODIY_IMAGES) {
    try {
      await removeWatermark(filename);
      processed++;
    } catch (err) {
      console.error(`Failed: ${filename}`);
      failed++;
    }
  }

  console.log(`\nDone! Processed: ${processed}, Failed: ${failed}`);
}

main();
