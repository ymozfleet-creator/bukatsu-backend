let passed=0,failed=0,total=0;
function assert(c,n){total++;if(c){passed++;console.log('  ✅ '+n);}else{failed++;console.log('  ❌ '+n);}}
function sanitize(s,m){m=m||200;if(s===null||s===undefined)return'';var str=String(s).trim().slice(0,m);return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');}
function sanitizeURL(u){if(!u||typeof u!=='string')return'';var t=u.trim().toLowerCase();if(t.startsWith('javascript:')||t.startsWith('data:')||t.startsWith('vbscript:'))return'';if(!t.startsWith('http://')&&!t.startsWith('https://')&&!t.startsWith('mailto:')&&!t.startsWith('/')&&!t.startsWith('#'))return'';return u.trim();}
function isValidEmail(e){return/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);}
function fnvHash(s){var h=0x811c9dc5;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=(h*0x01000193)>>>0;}return h.toString(36);}
function maskEmail(e){if(!e||typeof e!=='string')return'';var p=e.split('@');return p.length!==2?'***':p[0].slice(0,2)+'***@'+p[1];}
var RL={_a:{},check:function(a,m,w){var n=Date.now();if(!this._a[a])this._a[a]=[];this._a[a]=this._a[a].filter(function(t){return n-t<w;});if(this._a[a].length>=m)return false;this._a[a].push(n);return true;}};
console.log('\n── sanitize ──');
assert(sanitize('<script>')==='\&lt;script\&gt;','XSS escaped');
assert(sanitize(null)==='','null safe');
assert(sanitize('a'.repeat(300),100).length===100,'maxLen');
console.log('\n── URL ──');
assert(sanitizeURL('https://ok.com')==='https://ok.com','https ok');
assert(sanitizeURL('javascript:x')==='','js blocked');
assert(sanitizeURL('data:x')==='','data blocked');
console.log('\n── email ──');
assert(isValidEmail('a@b.c'),'valid');
assert(!isValidEmail(''),'empty');
assert(!isValidEmail('noat'),'no @');
console.log('\n── hash ──');
assert(fnvHash('a')===fnvHash('a'),'consistent');
assert(fnvHash('a')!==fnvHash('b'),'different');
console.log('\n── rate limit ──');
assert(RL.check('t',2,60000),'1st ok');
assert(RL.check('t',2,60000),'2nd ok');
assert(!RL.check('t',2,60000),'3rd blocked');
console.log('\n── mask ──');
assert(maskEmail('test@x.com')==='te***@x.com','masked');
assert(maskEmail('')==='','empty safe');
console.log('\n══════════════');
console.log('  '+passed+'/'+total+' passed'+(failed?' ('+failed+' FAILED)':''));
process.exit(failed?1:0);
