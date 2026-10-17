'use strict';
const grid=document.getElementById('productGrid');
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
const defaultProducts=[{name:'온기잇 304 스텐얼음 8개 세트',description:'음료의 맛을 희석하지 않는 재사용 스테인리스 아이스큐브. 위스키부터 커피까지, 일상의 한 잔을 더욱 특별하게.',price:null,image:'',coupang_url:'',featured:true}];
async function load(){try{const response=await fetch('/api/products');if(!response.ok)throw Error();const saved=await response.json();const products=saved.length?saved:defaultProducts;grid.replaceChildren();
for(const p of products){const card=el('article','product');const visual=el('div','product-image');if(p.image){const img=el('img');img.src=p.image;img.alt=p.name;img.loading='lazy';visual.append(img);}else visual.append(el('div','no-image',p.featured?'❄ 304 STAINLESS ICE':'ONGIT'));const info=el('div','product-info');info.append(el('h3','',p.name),el('p','',p.description));const bottom=el('div','product-bottom');if(Number.isFinite(p.price))bottom.append(el('strong','price',new Intl.NumberFormat('ko-KR').format(p.price)+'원'));if(p.coupang_url){const a=el('a','buy','쿠팡에서 구매 ↗');a.href=p.coupang_url;a.target='_blank';a.rel='noopener noreferrer sponsored';bottom.append(a);}else bottom.append(el('span','not-linked','쿠팡 구매 링크 준비 중'));info.append(bottom);card.append(visual,info);grid.append(card);}}
catch{grid.replaceChildren(el('div','empty','상품 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'));}}
load();
