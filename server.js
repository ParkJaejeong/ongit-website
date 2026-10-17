'use strict';
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const Database = require('better-sqlite3');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const root = __dirname;
const storagePath = process.env.DATA_DIR || path.join(root, 'storage');
const uploadPath = path.join(storagePath, 'uploads');
fs.mkdirSync(uploadPath, { recursive: true });
fs.mkdirSync(storagePath, { recursive: true });
const db = new Database(path.join(storagePath, 'ongit.sqlite'));
db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  price INTEGER NOT NULL DEFAULT 0,
  image TEXT NOT NULL DEFAULT '', coupang_url TEXT NOT NULL DEFAULT '',
  visible INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
const adminPassword = process.env.ADMIN_PASSWORD;
const sessionSecret = process.env.SESSION_SECRET;
if (!adminPassword || adminPassword.length < 12 || !sessionSecret || sessionSecret.length < 16) {
  console.error('Set ADMIN_PASSWORD (12+ chars) and SESSION_SECRET (16+ chars) before starting. See .env.example.');
  process.exit(1);
}
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : false);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"], imgSrc: ["'self'", 'data:'], objectSrc: ["'none'"], upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null } } }));
app.use(express.json({limit:'80kb'}));
app.use(session({ name:'ongit.sid', secret:sessionSecret, resave:false, saveUninitialized:false, cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:1000*60*60*8} }));
app.use('/uploads', express.static(uploadPath, {maxAge:'1d', index:false}));
app.use(express.static(path.join(root, 'public'), { index:'index.html', maxAge:0 }));
const loginLimiter = rateLimit({windowMs:15*60*1000,limit:15,standardHeaders:'draft-7',legacyHeaders:false});
function requireAdmin(req,res,next){ if(!req.session.admin) return res.status(401).json({error:'관리자 로그인이 필요합니다.'}); next(); }
function cleanUrl(input){
  const value=String(input||'').trim();
  if(!value) return '';
  try { const u=new URL(value); if(u.protocol!=='https:' || !/(^|\.)coupang\.com$/i.test(u.hostname)) return null; return u.toString(); } catch {return null;}
}
function parseProduct(body){
  const name=String(body.name||'').trim().slice(0,100);
  const description=String(body.description||'').trim().slice(0,2000);
  const price=Number(body.price);
  const coupang_url=cleanUrl(body.coupang_url);
  const image=String(body.image||'');
  const visible=body.visible===false || body.visible===0 ? 0 : 1;
  if(!name || !Number.isSafeInteger(price) || price<0 || price>1000000000 || coupang_url===null) return null;
  if(image && !/^\/uploads\/[a-f0-9]{32}\.(jpg|png|webp|gif)$/.test(image)) return null;
  return {name,description,price,coupang_url,image,visible};
}
app.get('/api/products',(req,res)=>res.json(db.prepare('SELECT id,name,description,price,image,coupang_url FROM products WHERE visible=1 ORDER BY sort_order ASC,id ASC').all()));
app.get('/api/admin/me',(req,res)=>res.json({loggedIn:!!req.session.admin}));
app.post('/api/admin/login',loginLimiter,(req,res)=>{
  const supplied=Buffer.from(String(req.body.password||''));
  const expected=Buffer.from(adminPassword);
  if(supplied.length!==expected.length || !crypto.timingSafeEqual(supplied,expected)) return res.status(401).json({error:'비밀번호가 올바르지 않습니다.'});
  req.session.regenerate(err=>{if(err)return res.status(500).json({error:'로그인 실패'});req.session.admin=true;res.json({ok:true});});
});
app.post('/api/admin/logout',requireAdmin,(req,res)=>req.session.destroy(()=>res.json({ok:true})));
app.get('/api/admin/products',requireAdmin,(req,res)=>res.json(db.prepare('SELECT * FROM products ORDER BY sort_order ASC,id ASC').all()));
app.post('/api/admin/products',requireAdmin,(req,res)=>{
  const product=parseProduct(req.body); if(!product)return res.status(400).json({error:'상품명·가격·쿠팡 링크를 확인해 주세요.'});
  const next=(db.prepare('SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM products').get()).n;
  const result=db.prepare('INSERT INTO products(name,description,price,image,coupang_url,visible,sort_order) VALUES (@name,@description,@price,@image,@coupang_url,@visible,@sort_order)').run({...product,sort_order:next});
  res.json({id:result.lastInsertRowid});
});
app.put('/api/admin/products/:id',requireAdmin,(req,res)=>{
  const product=parseProduct(req.body); if(!product)return res.status(400).json({error:'상품 입력값을 확인해 주세요.'});
  const result=db.prepare('UPDATE products SET name=@name,description=@description,price=@price,image=@image,coupang_url=@coupang_url,visible=@visible WHERE id=@id').run({...product,id:Number(req.params.id)});
  if(!result.changes)return res.status(404).json({error:'상품이 없습니다.'});res.json({ok:true});
});
app.delete('/api/admin/products/:id',requireAdmin,(req,res)=>{
  const result=db.prepare('DELETE FROM products WHERE id=?').run(Number(req.params.id));
  if(!result.changes)return res.status(404).json({error:'상품이 없습니다.'});res.json({ok:true});
});
app.put('/api/admin/order',requireAdmin,(req,res)=>{
  const ids=req.body.ids;
  const all=db.prepare('SELECT id FROM products').all().map(r=>r.id);
  if(!Array.isArray(ids)||ids.length!==all.length||new Set(ids).size!==all.length||!ids.every(id=>Number.isInteger(id)&&all.includes(id)))return res.status(400).json({error:'정렬 데이터가 올바르지 않습니다.'});
  const update=db.prepare('UPDATE products SET sort_order=? WHERE id=?');
  db.transaction(()=>ids.forEach((id,i)=>update.run(i,id)))();res.json({ok:true});
});
const accepted={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'};
const upload=multer({storage:multer.diskStorage({destination:uploadPath,filename(req,file,cb){cb(null,crypto.randomBytes(16).toString('hex')+'.'+accepted[file.mimetype]);}}),limits:{fileSize:5*1024*1024,files:1},fileFilter(req,file,cb){cb(null,Boolean(accepted[file.mimetype]));}});
app.post('/api/admin/upload',requireAdmin,(req,res)=>upload.single('image')(req,res,err=>{
  if(err)return res.status(400).json({error:'5MB 이하 JPG, PNG, WebP, GIF 사진만 업로드할 수 있습니다.'});
  if(!req.file)return res.status(400).json({error:'지원되는 이미지 파일을 선택해 주세요.'});
  const data=fs.readFileSync(req.file.path);
  const ok= (req.file.mimetype==='image/jpeg'&&data[0]===0xff&&data[1]===0xd8) || (req.file.mimetype==='image/png'&&data.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))) || (req.file.mimetype==='image/webp'&&data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP') || (req.file.mimetype==='image/gif'&&data.toString('ascii',0,3)==='GIF');
  if(!ok){fs.unlinkSync(req.file.path);return res.status(400).json({error:'올바른 이미지 파일이 아닙니다.'});}
  res.json({url:'/uploads/'+req.file.filename});
}));
app.use('/api',(req,res)=>res.status(404).json({error:'잘못된 요청입니다.'}));
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'서버 오류가 발생했습니다.'});});
const port=process.env.PORT||3000;
app.listen(port,()=>console.log(`ONGIT website: http://localhost:${port}`));
