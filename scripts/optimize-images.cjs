const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimize() {
  console.log('Optimizing images with sharp...');

  if (fs.existsSync('public/logo.png')) {
    await sharp('public/logo.png')
      .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true })
      .toFile('public/logo_opt.png');
    fs.renameSync('public/logo_opt.png', 'public/logo.png');
    console.log('public/logo.png optimized');
  }

  if (fs.existsSync('public/favicon.png')) {
    await sharp('public/favicon.png')
      .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true })
      .toFile('public/favicon_opt.png');
    fs.renameSync('public/favicon_opt.png', 'public/favicon.png');
    console.log('public/favicon.png optimized');
  }

  if (fs.existsSync('public/logo192.png')) {
    await sharp('public/logo192.png')
      .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true })
      .toFile('public/logo192_opt.png');
    fs.renameSync('public/logo192_opt.png', 'public/logo192.png');
    console.log('public/logo192.png optimized');
  }

  if (fs.existsSync('public/logo512.png')) {
    await sharp('public/logo512.png')
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true })
      .toFile('public/logo512_opt.png');
    fs.renameSync('public/logo512_opt.png', 'public/logo512.png');
    console.log('public/logo512.png optimized');
  }

  if (fs.existsSync('public/og-image.png')) {
    await sharp('public/og-image.png')
      .resize(1200, 630, { fit: 'cover' })
      .png({ compressionLevel: 9, palette: true })
      .toFile('public/og-image_opt.png');
    fs.renameSync('public/og-image_opt.png', 'public/og-image.png');
    console.log('public/og-image.png optimized');
  }

  if (fs.existsSync('src/assets/logo.png')) {
    await sharp('src/assets/logo.png')
      .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: true })
      .toFile('src/assets/logo_opt.png');
    fs.renameSync('src/assets/logo_opt.png', 'src/assets/logo.png');
    console.log('src/assets/logo.png optimized');
  }

  const extraLogos = ['src/assets/chargepush-brand-mark.png', 'src/assets/chargepush-logo.png'];
  for (const f of extraLogos) {
    if (fs.existsSync(f)) {
      const out = f.replace('.png', '_opt.png');
      await sharp(f)
        .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9, palette: true })
        .toFile(out);
      fs.renameSync(out, f);
      console.log(`${f} optimized`);
    }
  }

  const jpgs = [
    { file: 'src/assets/rider-app.jpg', width: 800, quality: 80 },
    { file: 'src/assets/spots-map.jpg', width: 1000, quality: 75 },
    { file: 'src/assets/host-homeowner.jpg', width: 800, quality: 80 },
    { file: 'src/assets/about-community.jpg', width: 1000, quality: 75 },
    { file: 'src/assets/hero-charging.jpg', width: 1000, quality: 75 },
  ];

  for (const item of jpgs) {
    if (fs.existsSync(item.file)) {
      const out = item.file.replace('.jpg', '_opt.jpg');
      await sharp(item.file)
        .resize({ width: item.width, withoutEnlargement: true })
        .jpeg({ quality: item.quality, progressive: true, mozjpeg: true })
        .toFile(out);
      fs.renameSync(out, item.file);
      console.log(`${item.file} optimized`);
    }
  }

  console.log('Image optimization finished successfully.');
}

optimize().catch(console.error);
