(function(){
  'use strict';
  var tracking=window.LayoraTracking;
  var form=document.getElementById('request-form');
  if(form && tracking){
    var select=document.getElementById('request-service');
    var initialService=window.location.hash.slice(1);
    if(Object.prototype.hasOwnProperty.call(tracking.serviceNames,initialService)) select.value=initialService;
    window.addEventListener('hashchange',function(){var s=window.location.hash.slice(1);if(Object.prototype.hasOwnProperty.call(tracking.serviceNames,s))select.value=s;});
    var dateInput=document.getElementById('request-date');
    var now=new Date();
    dateInput.min=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
    form.addEventListener('submit',function(event){
      event.preventDefault();
      if(!form.reportValidity())return;
      var svc=tracking.service(select.value);
      var url=tracking.whatsappUrl(svc,{date:dateInput.value,budget:document.getElementById('request-budget').value});
      tracking.track('whatsapp',svc);
      // A direct user submission opens a prefilled draft, never sends a message.
      window.open(url,'_blank','noopener,noreferrer');
      // An explicit fallback link remains available if browser popup policies block the window.
      var fallback=document.getElementById('whatsapp-fallback');
      if(!fallback){fallback=document.createElement('a');fallback.id='whatsapp-fallback';fallback.className='text-link full';fallback.target='_blank';fallback.rel='noopener noreferrer';fallback.textContent='إذا لم يفتح واتساب، اضغط هنا لفتح رسالتك';form.appendChild(fallback);}
      fallback.href=url;
    });
  }
  var items=Array.isArray(window.LAYORA_PORTFOLIO)?window.LAYORA_PORTFOLIO:[];
  var section=document.getElementById('portfolio');
  var grid=document.getElementById('gallery-grid');
  var services=['flowers','events','bridal','kosha'];
  // Same-origin image assets only; no HTML, remote tracking pixels, or fabricated examples.
  items=items.filter(function(item){return item && /^assets\/work\/[A-Za-z0-9_./-]+\.(webp|jpg|jpeg|png)$/i.test(item.src||'') && item.src.indexOf('..')<0 && services.indexOf(item.service)>=0 && typeof item.title==='string' && typeof item.alt==='string';});
  if(section && grid && items.length){
    section.hidden=false;
    document.querySelectorAll('[data-gallery-nav]').forEach(function(a){a.hidden=false;});
    items.forEach(function(item){
      var figure=document.createElement('figure');figure.className='work-card';figure.dataset.service=item.service;
      var img=document.createElement('img');img.src=item.src;img.alt=item.alt;img.loading='lazy';img.decoding='async';
      var caption=document.createElement('figcaption');var title=document.createElement('span');title.textContent=item.title;
      var link=document.createElement('a');link.textContent='استفسر عن هذه الخدمة';link.target='_blank';link.rel='noopener noreferrer';link.dataset.action='whatsapp';link.dataset.service=item.service;
      link.href=tracking?tracking.whatsappUrl(item.service):'https://wa.me/966552313250';caption.append(title,link);figure.append(img,caption);grid.appendChild(figure);
    });
    section.querySelectorAll('[data-filter]').forEach(function(button){button.addEventListener('click',function(){
      section.querySelectorAll('[data-filter]').forEach(function(b){var active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
      var visible=0;
      grid.querySelectorAll('.work-card').forEach(function(card){card.hidden=button.dataset.filter!=='all' && card.dataset.service!==button.dataset.filter;if(!card.hidden)visible++;});
      section.querySelector('.gallery-empty').hidden=visible>0;
    });});
  }
})();
