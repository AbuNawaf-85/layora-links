# LAYORA Links

Official LAYORA social links page for `links.layora.sa`.

## Deployment

The live site is served through GitHub Pages from the main branch root.
The CNAME file preserves links.layora.sa. No build command is required.
Keep the existing DNS and domain settings unchanged.


## Services showcase

`services.html` is the public Arabic services landing page. Existing fragment links
`#flowers`, `#events`, `#bridal`, and `#kosha` remain available for ads and sitelinks.
No cart, online payment, customer account, or order-processing backend is provided.
Requests open a draft in WhatsApp; the visitor reviews and sends it themselves.

### Approved portfolio photographs

Only add photographs of LAYORA's actual work after approval. Place compressed
images under `assets/work/` using ASCII filenames, then add records to
`assets/portfolio.js`:

```js
window.LAYORA_PORTFOLIO = [
  // {src:'assets/work/approved-photo.webp', alt:'وصف الصورة', title:'اسم العمل', service:'flowers'}
];
```

Valid service identifiers are `flowers`, `events`, `bridal`, and `kosha`.
The empty gallery and its navigation are hidden until approved photographs exist.
The hero flower graphic is decorative artwork, not a photograph of completed work.

### Attribution and measurement

- `assets/tracking.js` preserves campaign attribution in **sessionStorage only**.
- `utm_id` is the Google campaign ID, `adgroupid` the ad group ID, and
  `utm_content` the creative ID. Existing ad platform click IDs are retained only
  in the session; they are **never included in the WhatsApp message**.
- WhatsApp drafts contain a random `LY-XXXXXXXX` reference, a source label from a
  fixed allowlist, and a service identifier. Optional event date and budget are
  inserted only into the visitor-reviewed draft, not stored or sent to analytics.
- Existing Google Ads labels are retained. The `conversion` event includes a
  `service` parameter. Events `layora_whatsapp_click`, `layora_directions_click`,
  and `layora_call_click` describe clicks only. Deduplication is per action/service
  per session. Separate service-specific Google Ads conversion actions must be
  configured in the Ads account before reporting them as independent conversions.
- A WhatsApp click is **not** a verified inquiry, a sale, or a visit. Staff should
  reconcile the request reference with actual inquiries and completed orders;
  no `purchase`, `generate_lead`, or store-visit event is fabricated here.
