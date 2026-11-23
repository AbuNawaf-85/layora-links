(function () {
  'use strict';
  var STORE_KEY = 'layora-attribution-v1';
  var SERVICES = {flowers:'الورد والهدايا',events:'المناسبات والحفلات',bridal:'شبكات العرايس',kosha:'كوشات العرايس',general:'خدمات لايورا'};
  var CONVERSION_TARGETS = {whatsapp:'AW-18571837789/9NwQCMz6o7cdEN2C35dF',directions:'AW-18571837789/Pk6ACMCYpbsdEN2C35dF'};
  var allowedSources = ['google','instagram','tiktok','snapchat','facebook','direct'];
  var fields = ['gclid','gbraid','wbraid','utm_source','utm_medium','utm_campaign','utm_id','utm_term','utm_content','adgroupid','campaignid','keyword'];
  var memory = {};
  function get(key) { try { return sessionStorage.getItem(key); } catch (_) { return memory[key] || null; } }
  function set(key, value) { memory[key] = value; try { sessionStorage.setItem(key,value); } catch (_) {} }
  function text(value, max) { return String(value || '').replace(/[\u0000-\u001f\u007f<>]/g,'').slice(0,max || 120); }
  function service(value) { return Object.prototype.hasOwnProperty.call(SERVICES,value) ? value : 'general'; }
  function newReference() {
    var bytes = new Uint8Array(4);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for(var i=0;i<bytes.length;i++) bytes[i]=Math.floor(Math.random()*256);
    return 'LY-' + Array.from(bytes).map(function(x){return x.toString(16).padStart(2,'0');}).join('').toUpperCase();
  }
  var attribution = {};
  try { attribution=JSON.parse(get(STORE_KEY)||'{}'); } catch (_) {}
  if (!attribution || typeof attribution!=='object' || Array.isArray(attribution)) attribution={};
  var query = new URLSearchParams(window.location.search);
  var hasCampaign = fields.some(function(k){return query.has(k);});
  if (hasCampaign) {
    attribution={};
    fields.forEach(function(key){ if(query.has(key)) attribution[key]=text(query.get(key),key==='gclid'?256:120); });
  }
  var storedRef = get('layora-request-reference');
  var reference = /^LY-[A-F0-9]{8}$/.test(storedRef || '') ? storedRef : newReference();
  set('layora-request-reference',reference);
  attribution.reference=reference;
  set(STORE_KEY,JSON.stringify(attribution));
  var rawSource=text(attribution.utm_source,30).toLowerCase();
  var source=allowedSources.indexOf(rawSource)>=0 ? rawSource : (attribution.gclid?'google':rawSource?'other':'direct');
  function whatsappUrl(svc, details) {
    svc=service(svc);details=details||{};
    var lines=['مرحبًا لايورا، أرغب بالاستفسار عن '+SERVICES[svc]+'.'];
    if (/^\d{4}-\d{2}-\d{2}$/.test(details.date||'')) lines.push('تاريخ المناسبة: '+details.date);
    var allowedBudgets=['أقل من 250 ريال','250–500 ريال','500–1000 ريال','أكثر من 1000 ريال'];
    if(allowedBudgets.indexOf(details.budget)>=0) lines.push('الميزانية التقريبية: '+details.budget);
    lines.push('مرجع الاستفسار: '+reference+' | '+source+' | '+svc);
    // Never put gclid, raw keyword/search parameters, personal details, or a full URL in the message.
    return 'https://wa.me/966552313250?text='+encodeURIComponent(lines.join('\n'));
  }
  function track(action, svc) {
    svc=service(svc);
    if(['whatsapp','directions','call'].indexOf(action)<0)return;
    var key='layora-tracked-v2-'+action+'-'+svc;
    if(get(key)) return;
    if(typeof window.gtag !== 'function') return;
    var params={event_category:'engagement',service:svc,request_ref:reference,source:source};
    if (CONVERSION_TARGETS[action]) window.gtag('event','conversion',Object.assign({send_to:CONVERSION_TARGETS[action]},params));
    window.gtag('event','layora_'+action+'_click',params);
    set(key,'1');
  }
  function enhanceLinks(root) {
    (root||document).querySelectorAll('a[data-action="whatsapp"]').forEach(function(a){a.href=whatsappUrl(a.dataset.service);});
  }
  enhanceLinks();
  document.addEventListener('click',function(event){
    var link=event.target.closest && event.target.closest('a[data-action]');
    if(!link)return;
    var action=link.dataset.action,svc=service(link.dataset.service);
    if(action==='whatsapp') link.href=whatsappUrl(svc);
    track(action,svc);
  });
  window.LayoraTracking={whatsappUrl:whatsappUrl,track:track,enhanceLinks:enhanceLinks,service:service,serviceNames:SERVICES};
})();
