const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'images');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// All images referenced in questions.json
const IMAGES = [
  // Регулювання дорожнього руху
  { id: 'q2126', url: 'https://vodiy.ua/media/questions/2126_.jpg' },
  { id: 'q3348', url: 'https://vodiy.ua/media/questions/18879.jpg' },
  { id: 'q284', url: 'https://vodiy.ua/media/questions/284_6_.jpg' },
  { id: 'q282', url: 'https://vodiy.ua/media/questions/282_6_.jpg' },
  { id: 'q281', url: 'https://vodiy.ua/media/questions/281_.jpg' },
  { id: 'q280', url: 'https://vodiy.ua/media/questions/280_.jpg' },
  { id: 'q279', url: 'https://vodiy.ua/media/questions/279_.jpg' },
  { id: 'q278', url: 'https://vodiy.ua/media/questions/278_.jpg' },
  { id: 'q276', url: 'https://vodiy.ua/media/questions/276__.jpg' },
  { id: 'q273', url: 'https://vodiy.ua/media/questions/273__.jpg' },
  { id: 'q268', url: 'https://vodiy.ua/media/questions/268_.jpg' },
  { id: 'q267', url: 'https://vodiy.ua/media/questions/267_.jpg' },
  { id: 'q265', url: 'https://vodiy.ua/media/questions/265_6.jpg' },
  { id: 'q264', url: 'https://vodiy.ua/media/questions/264_6.jpg' },
  { id: 'q256', url: 'https://vodiy.ua/media/questions/256_.jpg' },

  // Початок руху та зміна напрямку
  { id: 'q2828', url: 'https://vodiy.ua/media/questions/2828.jpg' },
  { id: 'q3040', url: 'https://vodiy.ua/media/questions/10-63.jpg' },
  { id: 'q3041', url: 'https://vodiy.ua/media/questions/10-64.jpg' },
  { id: 'q3042', url: 'https://vodiy.ua/media/questions/10-65.jpg' },
  { id: 'q3043', url: 'https://vodiy.ua/media/questions/10-66.jpg' },
  { id: 'q3044', url: 'https://vodiy.ua/media/questions/10-67.jpg' },
  { id: 'q3046', url: 'https://vodiy.ua/media/questions/10-69.jpg' },
  { id: 'q3047', url: 'https://vodiy.ua/media/questions/10-70.jpg' },
  { id: 'q3050', url: 'https://vodiy.ua/media/questions/10-73.jpg' },

  // Обгін
  { id: 'q647', url: 'https://vodiy.ua/media/questions/647_.jpg' },
  { id: 'q3059', url: 'https://vodiy.ua/media/questions/14-47.jpg' },
  { id: 'q3060', url: 'https://vodiy.ua/media/questions/14-48.jpg' },
  { id: 'q3061', url: 'https://vodiy.ua/media/questions/14-49.jpg' },
  { id: 'q3063', url: 'https://vodiy.ua/media/questions/14-51.jpg' },
  { id: 'q3064', url: 'https://vodiy.ua/media/questions/14-52.jpg' },
  { id: 'q620', url: 'https://vodiy.ua/media/questions/620_.jpg' },
  { id: 'q623', url: 'https://vodiy.ua/media/questions/623_.jpg' },
  { id: 'q625', url: 'https://vodiy.ua/media/questions/625_.jpg' },
  { id: 'q626', url: 'https://vodiy.ua/media/questions/626_.jpg' },
  { id: 'q629', url: 'https://vodiy.ua/media/questions/629_.jpg' },
  { id: 'q630', url: 'https://vodiy.ua/media/questions/630_.jpg' },
  { id: 'q631', url: 'https://vodiy.ua/media/questions/631_.jpg' },
  { id: 'q635', url: 'https://vodiy.ua/media/questions/635_.jpg' },
  { id: 'q3068', url: 'https://vodiy.ua/media/questions/14-56.jpg' },

  // Швидкість руху
  { id: 'q580', url: 'https://vodiy.ua/media/questions/15742.jpg' },
  { id: 'q3056', url: 'https://vodiy.ua/media/questions/12-39.jpg' },
  { id: 'q3058', url: 'https://vodiy.ua/media/questions/12-41.jpg' },
  { id: 'q531', url: 'https://vodiy.ua/media/questions/531_.jpg' },
  { id: 'q512', url: 'https://vodiy.ua/media/questions/15713.jpg' },
  { id: 'q547', url: 'https://vodiy.ua/media/questions/15723.jpg' },
  { id: 'q521', url: 'https://vodiy.ua/media/questions/521_.jpg' },
  { id: 'q519', url: 'https://vodiy.ua/media/questions/15718.jpg' },
  { id: 'q561', url: 'https://vodiy.ua/media/questions/561_.jpg' },

  // Зупинка і стоянка
  { id: 'q752', url: 'https://vodiy.ua/media/questions/15889.jpg' },
  { id: 'q3069', url: 'https://vodiy.ua/media/questions/15-90.jpg' },
  { id: 'q3070', url: 'https://vodiy.ua/media/questions/15-91.jpg' },
  { id: 'q3071', url: 'https://vodiy.ua/media/questions/15-92.jpg' },
  { id: 'q3072', url: 'https://vodiy.ua/media/questions/15-93.jpg' },
  { id: 'q3073', url: 'https://vodiy.ua/media/questions/15-94.jpg' },
  { id: 'q3074', url: 'https://vodiy.ua/media/questions/15-95.jpg' },
  { id: 'q711', url: 'https://vodiy.ua/media/questions/711_.jpg' },
  { id: 'q710', url: 'https://vodiy.ua/media/questions/710_.jpg' },
  { id: 'q707', url: 'https://vodiy.ua/media/questions/707_.jpg' },
  { id: 'q697', url: 'https://vodiy.ua/media/questions/697_.jpg' },

  // Проїзд перехресть
  { id: 'q802', url: 'https://vodiy.ua/media/questions/802_.jpg' },
  { id: 'q806', url: 'https://vodiy.ua/media/questions/806_.jpg' },
  { id: 'q2042', url: 'https://vodiy.ua/media/questions/2042_.jpg' },
  { id: 'q2043', url: 'https://vodiy.ua/media/questions/2043_.jpg' },
  { id: 'q2054', url: 'https://vodiy.ua/media/questions/2054_.jpg' },
  { id: 'q3079', url: 'https://vodiy.ua/media/questions/16-1-34.jpg' },
  { id: 'q3080', url: 'https://vodiy.ua/media/questions/16-128.jpg' },
  { id: 'q3082', url: 'https://vodiy.ua/media/questions/16-2-104.jpg' },
  { id: 'q3083', url: 'https://vodiy.ua/media/questions/16-2-105.jpg' },
  { id: 'q3084', url: 'https://vodiy.ua/media/questions/16-2-106.jpg' },
  { id: 'q3085', url: 'https://vodiy.ua/media/questions/16-107.jpg' },
  { id: 'q785', url: 'https://vodiy.ua/media/questions/785_.jpg' },

  // Користування зовнішніми світловими приладами
  { id: 'q1100', url: 'https://vodiy.ua/media/questions/1100_.jpg' },
  { id: 'q3092', url: 'https://vodiy.ua/media/questions/19-29.jpg' },
  { id: 'q3095', url: 'https://vodiy.ua/media/questions/18-32_f0Afwah.png' },
  { id: 'q3096', url: 'https://vodiy.ua/media/questions/45-34.png' },

  // Рух через залізничні переїзди
  { id: 'q895', url: 'https://vodiy.ua/media/questions/895_.jpg' },
  { id: 'q3097', url: 'https://vodiy.ua/media/questions/20-24.jpg' },
  { id: 'q3104', url: 'https://vodiy.ua/media/questions/20-31.jpg' },
  { id: 'q3278', url: 'https://vodiy.ua/media/questions/3278_.jpg' },
  { id: 'q901', url: 'https://vodiy.ua/media/questions/901_.jpg' },
  { id: 'q906', url: 'https://vodiy.ua/media/questions/906_.jpg' },
  { id: 'q889', url: 'https://vodiy.ua/media/questions/889_.jpg' },
  { id: 'q056', url: 'https://vodiy.ua/media/questions/056_.jpg' },

  // Загальні положення
  { id: 'q1070', url: 'https://vodiy.ua/media/questions/1070_6.jpg' },
  { id: 'q3014', url: 'https://vodiy.ua/media/questions/1-34.jpg' },
  { id: 'q3015', url: 'https://vodiy.ua/media/questions/1-35.jpg' },
  { id: 'q3017', url: 'https://vodiy.ua/media/questions/1-37.jpg' },
  { id: 'q3018', url: 'https://vodiy.ua/media/questions/1-38.jpg' },
  { id: 'q3282', url: 'https://vodiy.ua/media/questions/3282_.jpg' },
  { id: 'q3284', url: 'https://vodiy.ua/media/questions/18814.jpg' },

  // Обов'язки і права водіїв
  { id: 'q1220', url: 'https://vodiy.ua/media/questions/1220_6.jpg' },
  { id: 'q1241', url: 'https://vodiy.ua/media/questions/1241_6.jpg' },
  { id: 'q1211', url: 'https://vodiy.ua/media/questions/1211_6.jpg' },

  // Розташування ТЗ на дорозі
  { id: 'q2968', url: 'https://vodiy.ua/media/questions/2968_.jpg' },

  // Рух ТЗ зі спеціальними сигналами
  { id: 'q113', url: 'https://vodiy.ua/media/questions/113_6.jpg' },
  { id: 'q3022', url: 'https://vodiy.ua/media/questions/3-15.jpg' },
  { id: 'q3023', url: 'https://vodiy.ua/media/questions/3-16.jpg' },
  { id: 'q69', url: 'https://vodiy.ua/media/questions/69_6.jpg' },
  { id: 'q118', url: 'https://vodiy.ua/media/questions/118_6.jpg' },
  { id: 'q117', url: 'https://vodiy.ua/media/questions/117_6.jpg' },
  { id: 'q116', url: 'https://vodiy.ua/media/questions/116_6.jpg' },
  { id: 'q109', url: 'https://vodiy.ua/media/questions/109_6.jpg' },
  { id: 'q112', url: 'https://vodiy.ua/media/questions/112_6.jpg' },

  // Попереджувальні сигнали
  { id: 'q370', url: 'https://vodiy.ua/media/questions/370_.jpg' },
  { id: 'q348', url: 'https://vodiy.ua/media/questions/348_.jpg' },

  // Дистанція, інтервал, зустрічний роз'їзд
  { id: 'q275', url: 'https://vodiy.ua/media/questions/275_.jpg' },
  { id: 'q586', url: 'https://vodiy.ua/media/questions/586_.jpg' },
  { id: 'q588', url: 'https://vodiy.ua/media/questions/588_.jpg' },
  { id: 'q587', url: 'https://vodiy.ua/media/questions/587_.jpg' },
  { id: 'q589', url: 'https://vodiy.ua/media/questions/589__.jpg' },
  { id: 'q584', url: 'https://vodiy.ua/media/questions/584_.jpg' },
  { id: 'q535', url: 'https://vodiy.ua/media/questions/535_.jpg' },
  { id: 'q592', url: 'https://vodiy.ua/media/questions/15755.jpg' },

  // Переваги маршрутних ТЗ
  { id: 'q818', url: 'https://vodiy.ua/media/questions/818_.jpg' },
  { id: 'q819', url: 'https://vodiy.ua/media/questions/819_.jpg' },
  { id: 'q820', url: 'https://vodiy.ua/media/questions/820_.jpg' },
  { id: 'q821', url: 'https://vodiy.ua/media/questions/821_.jpg' },
  { id: 'q822', url: 'https://vodiy.ua/media/questions/822_.jpg' },
  { id: 'q824', url: 'https://vodiy.ua/media/questions/824_.jpg' },
  { id: 'q827', url: 'https://vodiy.ua/media/questions/827_.jpg' },
  { id: 'q828', url: 'https://vodiy.ua/media/questions/828_.jpg' },
  { id: 'q2018', url: 'https://vodiy.ua/media/questions/18370.jpg' },

  // Проїзд пішохідних переходів
  { id: 'q051', url: 'https://vodiy.ua/media/questions/051_.jpg' },
  { id: 'q3088', url: 'https://vodiy.ua/media/questions/18-18.jpg' },
  { id: 'q849', url: 'https://vodiy.ua/media/questions/849__.jpg' },
  { id: 'q846', url: 'https://vodiy.ua/media/questions/846_.jpg' },
  { id: 'q3089', url: 'https://vodiy.ua/media/questions/18-19.jpg' },
  { id: 'q837', url: 'https://vodiy.ua/media/questions/837_.jpg' },
  { id: 'q838', url: 'https://vodiy.ua/media/questions/838_.jpg' },
  { id: 'q842', url: 'https://vodiy.ua/media/questions/842_.jpg' },

  // Обов'язки і права пішоходів
  { id: 'q041', url: 'https://vodiy.ua/media/questions/041_6.jpg' },
  { id: 'q3025', url: 'https://vodiy.ua/media/questions/4-23.jpg' },

  // Обов'язки і права пасажирів
  { id: 'q3029', url: 'https://vodiy.ua/media/questions/35-16.jpg' },

  // Вимоги до велосипедистів
  { id: 'q3031', url: 'https://vodiy.ua/media/questions/18547_40IONZ1.jpg' },
  { id: 'q3032', url: 'https://vodiy.ua/media/questions/18548_TM2VH8R.jpg' },
  { id: 'q3033', url: 'https://vodiy.ua/media/questions/AD_1821.10_FD.jpg' },
  { id: 'q3034', url: 'https://vodiy.ua/media/questions/6-22.jpg' },
  { id: 'q3010', url: 'https://vodiy.ua/media/questions/202109.jpg' },
  { id: 'q3011', url: 'https://vodiy.ua/media/questions/18500.jpg' },
  { id: 'q3012', url: 'https://vodiy.ua/media/questions/3012_.jpg' },
  { id: 'q044', url: 'https://vodiy.ua/media/questions/044_6.jpg' },

  // Перевезення пасажирів
  { id: 'q3106', url: 'https://vodiy.ua/media/questions/21-7.jpg' },
  { id: 'q3107', url: 'https://vodiy.ua/media/questions/21-8.jpg' },
  { id: 'q3109', url: 'https://vodiy.ua/media/questions/21-12_JFRWdbb.jpg' },
  { id: 'q3110', url: 'https://vodiy.ua/media/questions/21-10.jpg' },
  { id: 'q3111', url: 'https://vodiy.ua/media/questions/21-9_9CMMzV8.jpg' },
  { id: 'q3112', url: 'https://vodiy.ua/media/questions/21-12.jpg' },
  { id: 'q3351', url: 'https://vodiy.ua/media/questions/19751.jpg' },

  // Буксирування та експлуатація ТЗ
  { id: 'q938', url: 'https://vodiy.ua/media/questions/938_6.jpg' },

  // Нові питання з білетів 17-30
  { id: 'q242', url: 'https://vodiy.ua/media/questions/242_.jpg' },
  { id: 'q701', url: 'https://vodiy.ua/media/questions/701_.jpg' },
  { id: 'q714', url: 'https://vodiy.ua/media/questions/714_.jpg' },
  { id: 'q1741', url: 'https://vodiy.ua/media/questions/1741_.jpg' },
  { id: 'q442', url: 'https://vodiy.ua/media/questions/442_.jpg' },
  { id: 'q692', url: 'https://vodiy.ua/media/questions/692_.jpg' },
  { id: 'q780', url: 'https://vodiy.ua/media/questions/780_.jpg' },
  { id: 'q1019', url: 'https://vodiy.ua/media/questions/1019_.jpg' },
  { id: 'q465', url: 'https://vodiy.ua/media/questions/465_.jpg' },
  { id: 'q761', url: 'https://vodiy.ua/media/questions/761_.jpg' },
  { id: 'q1058', url: 'https://vodiy.ua/media/questions/1058_.jpg' },
  { id: 'q606', url: 'https://vodiy.ua/media/questions/606_.jpg' },
  { id: 'q16178', url: 'https://vodiy.ua/media/questions/16178_Hogu21B.jpg' },
  { id: 'q056', url: 'https://vodiy.ua/media/questions/056_.jpg' },
  { id: 'q113', url: 'https://vodiy.ua/media/questions/113_6.jpg' },
  { id: 'q646', url: 'https://vodiy.ua/media/questions/646_.jpg' },
  { id: 'q769', url: 'https://vodiy.ua/media/questions/769_.jpg' },
  { id: 'q906', url: 'https://vodiy.ua/media/questions/906_.jpg' },
  { id: 'q461', url: 'https://vodiy.ua/media/questions/461_.jpg' },

  // Нові питання з pdrtest.com
  { id: 'q08101', url: 'https://bucket.pdrtest.com/pics/08101.webp' },
  { id: 'q08103', url: 'https://bucket.pdrtest.com/pics/08103.webp' },
  { id: 'q08104', url: 'https://bucket.pdrtest.com/pics/08104.webp' },
  { id: 'q08106', url: 'https://bucket.pdrtest.com/pics/08106.webp' },
  { id: 'q08201', url: 'https://bucket.pdrtest.com/pics/08201.webp' },
  { id: 'q08202', url: 'https://bucket.pdrtest.com/pics/08202.webp' },
  { id: 'q08203', url: 'https://bucket.pdrtest.com/pics/08203.webp' },
  { id: 'q09001', url: 'https://bucket.pdrtest.com/pics/09001.webp' },
  { id: 'q09002', url: 'https://bucket.pdrtest.com/pics/09002.webp' },
  { id: 'q09004', url: 'https://bucket.pdrtest.com/pics/09004.webp' },
  { id: 'q09005', url: 'https://bucket.pdrtest.com/pics/09005.webp' },
  { id: 'q10001', url: 'https://bucket.pdrtest.com/pics/10001.webp' },
  { id: 'q10002', url: 'https://bucket.pdrtest.com/pics/10002.webp' },
  { id: 'q10003', url: 'https://bucket.pdrtest.com/pics/10003.webp' },
  { id: 'q11001', url: 'https://bucket.pdrtest.com/pics/11001.webp' },
  { id: 'q11002', url: 'https://bucket.pdrtest.com/pics/11002.webp' },
  { id: 'q11003', url: 'https://bucket.pdrtest.com/pics/11003.webp' },
  { id: 'q11004', url: 'https://bucket.pdrtest.com/pics/11004.webp' },
  { id: 'q11006', url: 'https://bucket.pdrtest.com/pics/11006.webp' },
  { id: 'q11007', url: 'https://bucket.pdrtest.com/pics/11007.webp' },
  { id: 'q11008', url: 'https://bucket.pdrtest.com/pics/11008.webp' },
  { id: 'q11011', url: 'https://bucket.pdrtest.com/pics/11011.webp' },
  { id: 'q11012', url: 'https://bucket.pdrtest.com/pics/11012.webp' },
  { id: 'q12002', url: 'https://bucket.pdrtest.com/pics/12002.webp' },
  { id: 'q12014', url: 'https://bucket.pdrtest.com/pics/12014.webp' },
  { id: 'q12015', url: 'https://bucket.pdrtest.com/pics/12015.webp' },
  { id: 'q13002', url: 'https://bucket.pdrtest.com/pics/13002.webp' },
  { id: 'q13003', url: 'https://bucket.pdrtest.com/pics/13003.webp' },
  { id: 'q14001', url: 'https://bucket.pdrtest.com/pics/14001.webp' },
  { id: 'q14002', url: 'https://bucket.pdrtest.com/pics/14002.webp' },
  { id: 'q14003', url: 'https://bucket.pdrtest.com/pics/14003.webp' },
  { id: 'q14004', url: 'https://bucket.pdrtest.com/pics/14004.webp' },
  { id: 'q14005', url: 'https://bucket.pdrtest.com/pics/14005.webp' },
  { id: 'q15001', url: 'https://bucket.pdrtest.com/pics/15001.webp' },
  { id: 'q15002', url: 'https://bucket.pdrtest.com/pics/15002.webp' },
  { id: 'q15003', url: 'https://bucket.pdrtest.com/pics/15003.webp' },
  { id: 'q15004', url: 'https://bucket.pdrtest.com/pics/15004.webp' },
  { id: 'q15005', url: 'https://bucket.pdrtest.com/pics/15005.webp' },
  { id: 'q16102', url: 'https://bucket.pdrtest.com/pics/16102.webp' },
  { id: 'q16103', url: 'https://bucket.pdrtest.com/pics/16103.webp' },
  { id: 'q16104', url: 'https://bucket.pdrtest.com/pics/16104.webp' },
  { id: 'q16108', url: 'https://bucket.pdrtest.com/pics/16108.webp' },
  { id: 'q16110', url: 'https://bucket.pdrtest.com/pics/16110.webp' },
  { id: 'q16111', url: 'https://bucket.pdrtest.com/pics/16111.webp' },
  { id: 'q16114', url: 'https://bucket.pdrtest.com/pics/16114.webp' },
  { id: 'q16116', url: 'https://bucket.pdrtest.com/pics/16116.webp' },
  { id: 'q16118', url: 'https://bucket.pdrtest.com/pics/16118.webp' },
  { id: 'q16120', url: 'https://bucket.pdrtest.com/pics/16120.webp' },
  { id: 'q16121', url: 'https://bucket.pdrtest.com/pics/16121.webp' },
  { id: 'q16122', url: 'https://bucket.pdrtest.com/pics/16122.webp' },
  { id: 'q16124', url: 'https://bucket.pdrtest.com/pics/16124.webp' },
  { id: 'q16125', url: 'https://bucket.pdrtest.com/pics/16125.webp' },
  { id: 'q16126', url: 'https://bucket.pdrtest.com/pics/16126.webp' },
  { id: 'q16127', url: 'https://bucket.pdrtest.com/pics/16127.webp' },
];

function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const filepath = path.join(OUTPUT_DIR, filename);

    // Check if file already exists
    if (fs.existsSync(filepath)) {
      console.log(`Already exists: ${filename}`);
      return resolve(filepath);
    }

    const file = fs.createWriteStream(filepath);

    const makeRequest = (requestUrl) => {
      https.get(requestUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Referer': 'https://vodiy.ua/'
        }
      }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Follow redirect
          makeRequest(response.headers.location);
        } else if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`Downloaded: ${filename}`);
            resolve(filepath);
          });
        } else {
          console.log(`Failed (${response.statusCode}): ${filename}`);
          fs.unlink(filepath, () => {});
          resolve(null);
        }
      }).on('error', (err) => {
        fs.unlink(filepath, () => {});
        console.log(`Error: ${filename} - ${err.message}`);
        resolve(null);
      });
    };

    makeRequest(url);
  });
}

async function main() {
  console.log(`Downloading ${IMAGES.length} images to ${OUTPUT_DIR}\n`);

  let downloaded = 0;
  let failed = 0;

  for (const img of IMAGES) {
    const ext = img.url.split('.').pop().split('?')[0];
    const result = await downloadImage(img.url, `${img.id}.${ext}`);
    if (result) {
      downloaded++;
    } else {
      failed++;
    }
    // Small delay between requests
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Failed: ${failed}`);
}

main();
