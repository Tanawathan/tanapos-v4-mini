import express from 'express';
import cors from 'cors';
import { BufferHelper } from 'escpos-buffer';
import usb from 'escpos-usb';
import iconv from 'iconv-lite';

const app = express();
app.use(cors());
app.use(express.json({ limit: '256kb' }));

// 設定：根據你的印表機 vendorId/productId 做調整 (lsusb 或系統資訊查詢)
// 可以先留空 -> 直接 new usb.USB(); 會嘗試抓第一台

function openPrinter() {
  try {
    const device = new usb.USB();
    return device;
  } catch (e) {
    console.error('無法開啟 USB 印表機:', e);
    throw e;
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

function encodeLines(lines){
  // ESC/POS 指令: 初始化 -> 一般字體 -> 每行 -> 切紙
  const cmds = [];
  function push(txt){
    cmds.push(iconv.encode(txt + '\n', 'GB18030'));
  }
  cmds.push(Buffer.from('\x1B@','binary'));// init
  lines.forEach(l=>push(l));
  cmds.push(Buffer.from('\n\n','binary'));
  // 開錢箱 (常見序列) ESC p m t1 t2
  cmds.push(Buffer.from([0x1B,0x70,0x00,0x32,0x32]));
  // 切紙 (部分切) GS V 1
  cmds.push(Buffer.from([0x1D,0x56,0x01]));
  return Buffer.concat(cmds);
}

app.post('/print', async (req,res)=>{
  try {
    const payload = req.body;
    const lines = buildReceiptLines(payload);
    const data = encodeLines(lines);
    const printer = openPrinter();
    printer.open(()=>{
      try {
        printer.write(data, ()=>{
          printer.close();
        });
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
