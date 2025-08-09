import express from 'express';
import cors from 'cors';
import { BufferHelper } from 'escpos-buffer';
import usb from 'escpos-usb';
import iconv from 'iconv-lite';
import Jimp from 'jimp';

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

// 設定：根據你的印表機 vendorId/productId 做調整 (lsusb 或系統資訊查詢)
// 可以先留空 -> 直接 new usb.USB(); 會嘗試抓第一台

function openPrinter(vendorId, productId) {
  try {
    // escpos-usb 支援直接 new USB(vendorId, productId)
    if (vendorId && productId) return new usb.USB(vendorId, productId)
    return new usb.USB()
  } catch (e) {
    console.error('無法開啟 USB 印表機:', e)
    throw e
  }
}

// 行寬假設 32 半寬字 / 16 全形 (簡化)
const LINE_WIDTH = 32;
function eastAsianWidth(ch) {
  return /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/.test(ch) ? 2 : 1;
}
function measure(str){
  return Array.from(str).reduce((w,c)=>w+eastAsianWidth(c),0);
}
function padLine(left, right){
  const leftWidth = measure(left);
  const rightWidth = measure(right);
  const spaces = LINE_WIDTH - leftWidth - rightWidth;
  return left + ' '.repeat(Math.max(1, spaces)) + right;
}

function buildReceiptLines(payload){
  const {
    restaurantName = '餐廳',
    tableLabel = '',
    orderNumbers = [],
    items = [],
    subtotal = 0,
    tax = 0,
    service = 0,
    total = 0,
    paymentMethod = '',
    received,
    change,
  footer = '謝謝光臨'
  } = payload;
  const lines = [];
  lines.push(centerText(restaurantName));
  lines.push(centerText(tableLabel));
  lines.push('單號: ' + orderNumbers.join(','));
  lines.push('-'.repeat(LINE_WIDTH));
  items.forEach(it=>{
    const qtyPrice = `${it.quantity}x${it.unitPrice}`;
    const nameLine = padLine(it.name.substring(0,18), qtyPrice);
    lines.push(nameLine);
    if(it.combos){
      it.combos.forEach(c=>{
        const add = c.addPrice ? `+${c.addPrice}`:'';
        const comboLine = '  • ' + c.rule + ':' + c.product + add;
        wrap(comboLine, LINE_WIDTH).forEach(wl=>lines.push(wl));
      });
    }
  });
  lines.push('-'.repeat(LINE_WIDTH));
  lines.push(padLine('小計', `NT$${subtotal}`));
  if(tax>0) lines.push(padLine('稅金', `NT$${tax}`));
  if(service>0) lines.push(padLine('服務費', `NT$${service}`));
  lines.push(padLine('總計', `NT$${total}`));
  if(paymentMethod==='cash' && received!=null){
    lines.push(padLine('收現', `NT$${received}`));
    lines.push(padLine('找零', `NT$${change||0}`));
  } else {
    lines.push('付款方式:'+paymentMethod);
  }
  lines.push('-'.repeat(LINE_WIDTH));
  lines.push(centerText(footer));
  lines.push('\n');
  return lines;
}

function centerText(text){
  const w = measure(text);
  if(w>=LINE_WIDTH) return text;
  const pad = Math.floor((LINE_WIDTH - w)/2);
  return ' '.repeat(pad)+text;
}
function wrap(text, width){
  const out=[]; let line=''; let w=0;
  for(const ch of Array.from(text)){
    const cw = eastAsianWidth(ch);
    if(w+cw>width){ out.push(line); line=ch; w=cw; } else { line+=ch; w+=cw; }
  }
  if(line) out.push(line);
  return out;
}

function encodeLines(lines, { charset='GB18030', openCashDrawer=true, cutPaper=true } = {}){
  const cmds = [];
  // iconv-lite: big5 / utf8 / gb18030 (大小寫不敏感)
  const encoding = charset === 'BIG5' ? 'big5' : (charset || 'gb18030');
  function push(txt){
    try {
      cmds.push(iconv.encode(txt + '\n', encoding));
    } catch (e){
      // fallback to GB18030
      cmds.push(iconv.encode(txt + '\n', 'GB18030'));
    }
  }
  cmds.push(Buffer.from('\x1B@','binary')); // init
  // 指定字元集 (簡化: 只對英文/多字節使用 iconv 轉碼)
  lines.forEach(l=>push(l));
  cmds.push(Buffer.from('\n','binary'));
  if (openCashDrawer) cmds.push(Buffer.from([0x1B,0x70,0x00,0x32,0x32]));
  if (cutPaper) cmds.push(Buffer.from([0x1D,0x56,0x01]));
  return Buffer.concat(cmds);
}

// 產生簡易 QR Code (ESC/POS GS ( k 指令) - 使用模型2)
function buildQRCode(data){
  const bytes = Buffer.from(data, 'utf8');
  const storeLen = bytes.length + 3;
  const pL = storeLen & 0xFF;
  const pH = (storeLen >> 8) & 0xFF;
  return Buffer.concat([
    // 型號選擇 49 = model 2
    Buffer.from([0x1D,0x28,0x6B,0x04,0x00,0x31,0x41,0x32,0x00]),
    // 誤差等級 49 65 48~51 -> 51 高
    Buffer.from([0x1D,0x28,0x6B,0x03,0x00,0x31,0x45,0x31]),
    // 儲存資料
    Buffer.from([0x1D,0x28,0x6B,pL,pH,0x31,0x50,0x30]),
    bytes,
    // 列印 QR
    Buffer.from([0x1D,0x28,0x6B,0x03,0x00,0x31,0x51,0x30])
  ]);
}

// Code128 條碼 (簡化, 使用 ESC/POS 指令) data ASCII only
function buildCode128(data){
  const bytes = Buffer.from(data, 'ascii');
  return Buffer.concat([
    Buffer.from([0x1D,0x68,0x50]), // height
    Buffer.from([0x1D,0x77,0x02]), // module width
    Buffer.from([0x1D,0x48,0x02]), // print code below
    Buffer.from([0x1D,0x6B,0x49, bytes.length]), // Code128
    bytes
  ]);
}

async function buildLogoBuffer(base64){
  try {
    if(!base64) return null;
    const img = await Jimp.read(Buffer.from(base64.split(',').pop(), 'base64'));
    // Resize width to 384 dots max
    if (img.bitmap.width > 384) img.resize(384, Jimp.AUTO);
    // Convert to monochrome threshold
    img.grayscale().contrast(0.3);
    const width = img.bitmap.width;
    const height = img.bitmap.height;
    const bytesPerLine = Math.ceil(width / 8);
    const imageBuffer = Buffer.alloc(bytesPerLine * height);
    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        const idx = (y * width + x) * 4;
        const pixel = img.bitmap.data[idx]; // after grayscale R=G=B
        if (pixel < 128) {
          imageBuffer[y*bytesPerLine + (x>>3)] |= (0x80 >> (x & 0x7));
        }
      }
    }
    // ESC * m nL nH data  (m=33 for 24-dot double density) -> using raster GS v 0
    const header = Buffer.from([0x1D,0x76,0x30,0x00, bytesPerLine & 0xFF, bytesPerLine >> 8, height & 0xFF, height >> 8]);
    return Buffer.concat([header, imageBuffer]);
  } catch (e){
    console.warn('Logo 轉換失敗', e);
    return null;
  }
}

app.post('/print', async (req,res)=>{
  try {
  const payload = req.body;
    const { charset, openCashDrawer=true, cutPaper=true, vendorId, productId, logoBase64, qrData, barcode } = payload;
  const lines = buildReceiptLines(payload);
  const data = encodeLines(lines, { charset, openCashDrawer, cutPaper });
  const printer = openPrinter(vendorId, productId);
    printer.open(()=>{
      try {
        const chunks = [Buffer.from('\x1B@','binary')];
        if (logoBase64){
          // 列印 LOGO
          buildLogoBuffer(logoBase64).then(buf=>{
            if (buf) printer.write(buf);
            proceed();
          }).catch(()=>proceed());
        } else {
          proceed();
        }
        function proceed(){
          printer.write(data);
          if (qrData) printer.write(buildQRCode(qrData));
          if (barcode) printer.write(buildCode128(barcode));
          printer.write(Buffer.from('\n'));
          printer.close();
        }
      } catch(e){
        console.error('傳輸失敗', e);
      }
    });
    res.json({ ok:true });
  } catch(e){
    console.error(e);
    res.status(500).json({ ok:false, error:String(e) });
  }
});

app.get('/health', (_req,res)=> res.json({ ok:true }));

const PORT = 3333;
app.listen(PORT, ()=> console.log('Print service listening on', PORT));
