'use strict';
const grid=document.getElementById('productGrid');
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
async function load(){try{const response=await fetch('/api/products');if(!response.ok)throw Error();const products=await response.json();grid.replaceChildren();if(!products.length){grid.append(el('div','empty','등록된 상품이 없습니다. 새로운 상품을 준비 중입니다.'));return;}
for(const p of products){const card=el('article','product');const visual=el('div','product-image');if(p.image){const img=el('img');img.src=p.image;img.alt=p.name;img.loading='lazy';visual.append(img);}else visual.append(el('div','no-image','ONGIT'));const info=el('div','product-info');info.append(el('h3','',p.name),el('p','',p.description));const bottom=el('div','product-bottom');bottom.append(el('strong','price',new Intl.NumberFormat('ko-KR').format(p.price)+'원'));if(p.coupang_url){const a=el('a','buy','쿠팡에서 구매 ↗');a.href=p.coupang_url;a.target='_blank';a.rel='noopener noreferrer sponsored';bottom.append(a);}else bottom.append(el('span','not-linked','판매 준비 중'));info.append(bottom);card.append(visual,info);grid.append(card);}}
catch{grid.replaceChildren(el('div','empty','상품 정보를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'));}}
load();
