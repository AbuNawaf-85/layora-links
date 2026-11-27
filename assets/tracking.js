(function () {
  'use strict';
  var SERVICES = {flowers:'الورد والهدايا',events:'المناسبات والحفلات',bridal:'شبكات العرايس',kosha:'كوشات العرايس',general:'خدمات لايورا'};
  var CONVERSION_TARGETS = {whatsapp:'AW-18571837789/9NwQCMz6o7cdEN2C35dF',directions:'AW-18571837789/Pk6ACMCYpbsdEN2C35dF'};
  var memory = {};
  function get(key) { try { return sessionStorage.getItem(key); } catch (_) { return memory[key] || null; } }
  function set(key, value) { memory[key] = value; try { sessionStorage.setItem(key,value); } catch (_) {} }
  function service(value) { return Object.prototype.hasOwnProperty.call(SERVICES,value) ? value : 'general'; }
  function newReference() {
    var bytes = new Uint8Array(4);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for(var i=0;i<bytes.length;i++) bytes[i]=Math.floor(Math.random()*256);
    return 'LY-' + Array.from(bytes).map(function(x){return x.toString(16).padStart(2,'0');}).join('').toUpperCase();
  }
  var query = new URLSearchParams(window.location.search);
  // QA can suppress this script's events; it never enables or installs Google tags.
  var measurementQa = query.get('layora_measurement_qa') === '1';
  var storedRef = get('layora-request-reference');
  var reference = /^LY-[A-F0-9]{8,16}$/.test(storedRef || '') ? storedRef : newReference();
  set('layora-request-reference',reference);
  // BEGIN SHARED ATTRIBUTION V1.0.2
  var SOURCE_LABELS = {
    google: 'Google', google_ads: 'إعلان Google', google_search: 'بحث Google', google_maps: 'خرائط Google',
    qr: 'رمز QR', instagram: 'إنستغرام', instagram_ads: 'إعلان إنستغرام',
    facebook: 'فيسبوك', facebook_ads: 'إعلان فيسبوك',
    tiktok: 'تيك توك', tiktok_ads: 'إعلان تيك توك',
    snapchat: 'سناب شات', snapchat_ads: 'إعلان سناب شات', unknown: 'غير معروف'
  };
  var SERVICE_LABELS = {
    flowers: 'الورد والهدايا', events: 'المناسبات والحفلات', bridal: 'شبكات العرايس',
    kosha: 'كوشات العرايس', 'custom-gift': 'توفير هدية وتنسيقها',
    'secret-gift': 'هدية مع إخفاء اسم المرسل', general: 'استفسار عام'
  };
  function knownSource(value) {
    return typeof value === 'string' && Object.prototype.hasOwnProperty.call(SOURCE_LABELS, value);
  }
  function tagValue(value) {
    return typeof value === 'string' ? value.trim().toLowerCase().replace(/[ -]+/g, '_') : '';
  }
  function paidMedium(value) {
    return ['cpc', 'ppc', 'paid', 'paid_search', 'paidsearch', 'sem', 'paid_social', 'paidsocial', 'display'].indexOf(value) >= 0;
  }
  function plausibleClickId(value) {
    // A source hint only, not cryptographic verification of a Google ad click.
    return typeof value === 'string' && /^[A-Za-z0-9_-]{10,512}$/.test(value) &&
      ['undefined', 'null', 'none'].indexOf(value.toLowerCase()) < 0;
  }
  function sourceFromQuery(params) {
    if (['gclid', 'gbraid', 'wbraid'].some(function (key) { return plausibleClickId(params.get(key)); })) return 'google_ads';
    var src = tagValue(params.get('utm_source'));
    var medium = tagValue(params.get('utm_medium'));
    if (src === 'qr' || medium === 'qr') return 'qr';
    if (['google_maps', 'googlemaps'].indexOf(src) >= 0) return 'google_maps';
    if (src === 'google' && medium === 'organic' && tagValue(params.get('utm_campaign')) === 'google_business_profile') return 'google_maps';
    if (['google', 'google_ads', 'adwords'].indexOf(src) >= 0) {
      if (paidMedium(medium) || src === 'google_ads' || src === 'adwords') return 'google_ads';
      return ['organic', 'organic_search', 'search'].indexOf(medium) >= 0 ? 'google_search' : 'google';
    }
    if (['instagram', 'facebook', 'tiktok', 'snapchat'].indexOf(src) >= 0) return src + (paidMedium(medium) ? '_ads' : '');
    // Campaign names, raw/unrecognized sources and explicit direct tags prove no channel.
    return null;
  }
  function sourceFromReferrer(referrer, currentUrl) {
    var ref, current;
    try { ref = new URL(referrer); current = new URL(currentUrl); } catch (_) { return null; }
    if (['http:', 'https:'].indexOf(ref.protocol) < 0 || ref.username || ref.password || ref.origin === current.origin) return null;
    var host = ref.hostname.toLowerCase().replace(/\.$/, '');
    function onDomain(domain) { return host === domain || host.slice(-(domain.length + 1)) === '.' + domain; }
    var platforms = {instagram: ['instagram.com'], facebook: ['facebook.com', 'fb.com', 'fb.me'], tiktok: ['tiktok.com'], snapchat: ['snapchat.com']};
    var names = Object.keys(platforms);
    for (var i = 0; i < names.length; i++) if (platforms[names[i]].some(onDomain)) return names[i];
    // Deliberately bounded: unknown Google country domains remain unknown rather than guessed.
    var googleDomains = ['google.com', 'google.com.sa', 'google.ae', 'google.co.uk', 'google.co.in', 'google.com.eg', 'google.com.tr'];
    if (googleDomains.some(function (domain) { return host === 'maps.' + domain; })) return 'google_maps';
    if (/^\/maps(?:\/|$)/.test(ref.pathname) && googleDomains.some(function (domain) { return host === domain || host === 'www.' + domain; })) return 'google_maps';
    if (googleDomains.some(function (domain) { return host === domain || host === 'www.' + domain; })) return 'google_search';
    return null;
  }
  function legacySource(legacy) {
    if (!legacy || typeof legacy !== 'object' || Array.isArray(legacy)) return null;
    var params = new URLSearchParams();
    ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign'].forEach(function (key) {
      if (typeof legacy[key] === 'string') params.set(key, legacy[key]);
    });
    var inferred = sourceFromQuery(params);
    if (inferred) return inferred;
    if (legacy.source === 'google_organic') return 'google_search';
    return knownSource(legacy.source) ? legacy.source : null;
  }
  function resolveSource(params, referrer, currentUrl, saved, legacy) {
    var latest = sourceFromQuery(params) || sourceFromReferrer(referrer, currentUrl);
    if (latest) return latest;
    if (saved && saved.version === 2 && knownSource(saved.source)) return saved.source;
    return legacySource(legacy) || 'unknown';
  }
  function formatWhatsAppAttribution(message, ref, sourceCode, serviceCode) {
    var sourceLabel = SOURCE_LABELS[sourceCode] || SOURCE_LABELS.unknown;
    var serviceLabel = SERVICE_LABELS[serviceCode] || SERVICE_LABELS.general;
    var lines = String(message || '').split(/\r?\n/);
    // Remove only the exact legacy machine format, never arbitrary customer text.
    var oldRef = /^\s*مرجع الاستفسار:\s*LY-[A-Fa-f0-9]{8,16}\s*\|\s*(?:google|direct|other|google_ads|google_search|google_organic|google_maps|qr|instagram(?:_ads)?|facebook(?:_ads)?|tiktok(?:_ads)?|snapchat(?:_ads)?|unknown)\s*\|\s*(?:flowers|events|bridal|kosha|custom-gift|secret-gift|general)\s*$/;
    lines = lines.filter(function (line) { return !oldRef.test(line); });
    // Recognize only exact managed 3-line blocks, preserving surrounding text.
    function managedFooter(at) {
      return at >= 0 && /^مصدر الوصول: /.test(lines[at]) && /^الخدمة: /.test(lines[at + 1]) &&
        /^مرجع الاستفسار: LY-[A-Fa-f0-9]{8,16}$/.test(lines[at + 2]) &&
        Object.keys(SOURCE_LABELS).some(function (key) { return lines[at] === 'مصدر الوصول: ' + SOURCE_LABELS[key]; }) &&
        Object.keys(SERVICE_LABELS).some(function (key) { return lines[at + 1] === 'الخدمة: ' + SERVICE_LABELS[key]; });
    }
    for (var i = 0; i <= lines.length - 3; i++) {
      if (!managedFooter(i)) continue;
      var start = i > 0 && lines[i - 1] === '' ? i - 1 : i;
      lines.splice(start, 3 + (start < i ? 1 : 0));
      i = Math.max(-1, start - 1);
    }
    var body = lines.join('\n');
    return body + (body ? '\n\n' : '') + 'مصدر الوصول: ' + sourceLabel + '\nالخدمة: ' + serviceLabel + '\nمرجع الاستفسار: ' + ref;
  }
  // END SHARED ATTRIBUTION V1.0.2
  function storedObject(key) {
    try { var value = JSON.parse(get(key) || '{}'); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
    catch (_) { return {}; }
  }
  var source = resolveSource(query, document.referrer || '', window.location.href,
    storedObject('layora-attribution-v2'), storedObject('layora-attribution-v1'));
  // Store the resolved channel only. Existing v1 data remains readable for migration.
  set('layora-attribution-v2',JSON.stringify({version:2,source:source}));
  function whatsappUrl(svc, details) {
    svc=service(svc);details=details||{};
    var lines=['مرحبًا لايورا، أرغب بالاستفسار عن '+SERVICES[svc]+'.'];
    if (/^\d{4}-\d{2}-\d{2}$/.test(details.date||'')) lines.push('تاريخ المناسبة: '+details.date);
    var allowedBudgets=['أقل من 250 ريال','250–500 ريال','500–1000 ريال','أكثر من 1000 ريال'];
    if(allowedBudgets.indexOf(details.budget)>=0) lines.push('الميزانية التقريبية: '+details.budget);
    // Never put gclid, raw keyword/search parameters, personal details, or a full URL in the message.
    return 'https://wa.me/966552313250?text='+encodeURIComponent(formatWhatsAppAttribution(lines.join('\n'),reference,source,svc));
  }
  function track(action, svc) {
    if(measurementQa)return;
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
    if(event.defaultPrevented || event.isTrusted !== true || (typeof event.button === 'number' && event.button !== 0))return;
    var link=event.target.closest && event.target.closest('a[data-action]');
    if(!link)return;
    var action=link.dataset.action,svc=service(link.dataset.service);
    if(action==='whatsapp') link.href=whatsappUrl(svc);
    track(action,svc);
  });
  window.LayoraTracking={whatsappUrl:whatsappUrl,track:track,enhanceLinks:enhanceLinks,service:service,serviceNames:SERVICES};
})();

