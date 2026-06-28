// ═══════════════════════════════════════════════════════════════
// Velari Agency — Unified Event Tracking
// Meta Pixel:        2128692711022071
// Google Analytics:  G-KPWQM98LBJ
// Version: 2.0 — June 2026
// ═══════════════════════════════════════════════════════════════
//
//  EVENT MAP:
//  ──────────────────────────────────────────────────────────────
//  Action                    │ Meta Event        │ GA4 Event
//  ──────────────────────────┼───────────────────┼──────────────
//  Discovery questionnaire   │ Lead              │ generate_lead
//  Package WhatsApp CTA      │ InitiateCheckout  │ begin_checkout
//  WhatsApp / Email / Phone  │ Contact           │ contact
//  Homepage Discovery CTA    │ Schedule          │ schedule_discovery
//  Career form submit        │ SubmitApplication │ submit_application
//  Key page view             │ ViewContent       │ view_item
//  Section scroll            │ SectionView       │ section_view
//  Social profile click      │ SocialClick       │ social_click
//  ──────────────────────────────────────────────────────────────
//
//  INSTALL: Add before </body> on every page:
//  <script src="velari-events.js"></script>
//
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ─── Platform availability flags ─────────────────────────────
  var hasMeta   = typeof fbq   !== 'undefined';
  var hasGoogle = typeof gtag  !== 'undefined';

  // Exit if neither platform is loaded
  if (!hasMeta && !hasGoogle) return;


  // ─── Dispatch helpers ────────────────────────────────────────

  /**
   * Fire a Meta standard event
   */
  function fireMeta(eventName, params) {
    if (hasMeta) fbq('track', eventName, params || {});
  }

  /**
   * Fire a Meta custom event
   */
  function fireMetaCustom(eventName, params) {
    if (hasMeta) fbq('trackCustom', eventName, params || {});
  }

  /**
   * Fire a GA4 event
   */
  function fireGA4(eventName, params) {
    if (hasGoogle) gtag('event', eventName, params || {});
  }

  /**
   * Fire both platforms simultaneously
   */
  function fireAll(metaEvent, metaParams, ga4Event, ga4Params) {
    fireMeta(metaEvent, metaParams);
    fireGA4(ga4Event, ga4Params);
  }

  /**
   * Fire both platforms — Meta custom event variant
   */
  function fireAllCustom(metaEvent, metaParams, ga4Event, ga4Params) {
    fireMetaCustom(metaEvent, metaParams);
    fireGA4(ga4Event, ga4Params);
  }


  // ─── Page detection ──────────────────────────────────────────
  var path = window.location.pathname;
  var page = path.split('/').pop() || 'index.html';
  if (page === '' || page === '/') page = 'index.html';
  var pageSlug = page.replace('.html', '');


  // ═══════════════════════════════════════════════════════════════
  // 1. ViewContent — fires on key page loads
  // ═══════════════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', function () {

    var pageMap = {
      'content-engine.html': {
        name: 'Content Engine — Packages',
        category: 'packages',
        id: 'content-engine'
      },
      'contact.html': {
        name: 'Discovery — Contact',
        category: 'contact',
        id: 'discovery-page'
      },
      'work.html': {
        name: 'Portfolio — Our Work',
        category: 'portfolio',
        id: 'work-page'
      },
      'careers.html': {
        name: 'Careers — Open Positions',
        category: 'careers',
        id: 'careers-page'
      }
    };

    if (pageMap[page]) {
      var p = pageMap[page];

      fireMeta('ViewContent', {
        content_name: p.name,
        content_category: p.category
      });

      fireGA4('view_item', {
        item_list_id: p.id,
        item_list_name: p.name,
        items: [{
          item_id: p.id,
          item_name: p.name,
          item_category: p.category
        }]
      });
    }


    // ═══════════════════════════════════════════════════════════
    // 2. Click event delegation — all link-based events
    // ═══════════════════════════════════════════════════════════
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a');
      if (!link) return;

      var href = link.getAttribute('href') || '';
      var text = (link.textContent || '').trim();


      // ─── 2a. WhatsApp clicks ─────────────────────────────────
      if (href.indexOf('wa.me') !== -1 || href.indexOf('whatsapp') !== -1) {

        // Content Engine — Package-specific CTAs
        if (page === 'content-engine.html') {
          var pkg = detectPackage(href, text);

          if (pkg.name && pkg.name !== 'General Inquiry') {
            // ── InitiateCheckout / begin_checkout ──
            fireMeta('InitiateCheckout', {
              content_name: pkg.name + ' Package',
              content_category: 'Content Engine',
              currency: 'AED',
              value: pkg.value,
              num_items: 1
            });

            fireGA4('begin_checkout', {
              currency: 'AED',
              value: pkg.value,
              items: [{
                item_id: 'ce-' + pkg.name.toLowerCase(),
                item_name: 'Content Engine — ' + pkg.name,
                item_category: 'Content Engine',
                price: pkg.value,
                quantity: 1
              }]
            });
            return;
          }

          // General Content Engine inquiry (hero/footer CTA)
          if (pkg.name === 'General Inquiry') {
            fireAll(
              'Contact',
              { content_name: 'WhatsApp — Content Engine Inquiry', content_category: 'content-engine' },
              'contact',
              { method: 'WhatsApp', content_type: 'Content Engine Inquiry', page_location: 'content-engine' }
            );
            return;
          }
        }

        // All other WhatsApp clicks → Contact
        fireAll(
          'Contact',
          { content_name: 'WhatsApp', content_category: pageSlug },
          'contact',
          { method: 'WhatsApp', page_location: pageSlug }
        );
        return;
      }


      // ─── 2b. Email clicks ────────────────────────────────────
      if (href.indexOf('mailto:') === 0) {
        fireAll(
          'Contact',
          { content_name: 'Email', content_category: pageSlug },
          'contact',
          { method: 'Email', page_location: pageSlug }
        );
        return;
      }


      // ─── 2c. Phone clicks ────────────────────────────────────
      if (href.indexOf('tel:') === 0) {
        fireAll(
          'Contact',
          { content_name: 'Phone', content_category: pageSlug },
          'contact',
          { method: 'Phone', page_location: pageSlug }
        );
        return;
      }


      // ─── 2d. Discovery questionnaire → Lead ──────────────────
      if (href.indexOf('velari-agency.netlify.app') !== -1) {
        fireMeta('Lead', {
          content_name: 'Discovery Questionnaire',
          content_category: 'discovery',
          value: 0,
          currency: 'AED'
        });

        fireGA4('generate_lead', {
          currency: 'AED',
          value: 0,
          lead_source: 'Discovery Questionnaire',
          page_location: pageSlug
        });
        return;
      }


      // ─── 2e. Homepage Discovery CTAs → Schedule ──────────────
      if (page === 'index.html' && href.indexOf('contact.html') !== -1) {
        fireMeta('Schedule', {
          content_name: 'Start Discovery CTA',
          content_category: 'homepage'
        });

        fireGA4('schedule_discovery', {
          content_type: 'CTA',
          cta_text: text.substring(0, 50),
          page_location: 'homepage'
        });
        return;
      }


      // ─── 2f. Content Engine link from other pages ────────────
      if (page !== 'content-engine.html' && href.indexOf('content-engine') !== -1) {
        fireGA4('select_content', {
          content_type: 'Navigation',
          content_id: 'content-engine-link',
          page_location: pageSlug
        });
        return;
      }


      // ─── 2g. Social media profile clicks ─────────────────────
      if (href.indexOf('instagram.com') !== -1 ||
          href.indexOf('facebook.com') !== -1 ||
          href.indexOf('linkedin.com') !== -1) {

        var platform = 'Social';
        if (href.indexOf('instagram') !== -1) platform = 'Instagram';
        else if (href.indexOf('facebook') !== -1) platform = 'Facebook';
        else if (href.indexOf('linkedin') !== -1) platform = 'LinkedIn';

        fireAllCustom(
          'SocialClick',
          { content_name: platform, content_category: pageSlug },
          'social_click',
          { social_network: platform, page_location: pageSlug }
        );
        return;
      }
    });


    // ═══════════════════════════════════════════════════════════
    // 3. Career form submission
    // ═══════════════════════════════════════════════════════════
    if (page === 'careers.html') {
      var forms = document.querySelectorAll('form');
      for (var i = 0; i < forms.length; i++) {
        forms[i].addEventListener('submit', function () {
          var roleSelect = this.querySelector('select');
          var role = roleSelect ? (roleSelect.options[roleSelect.selectedIndex] || {}).text || 'Unknown' : 'Unknown';

          fireMeta('SubmitApplication', {
            content_name: 'Career Application — ' + role,
            content_category: 'careers'
          });

          fireGA4('submit_application', {
            application_type: 'Career',
            job_role: role,
            page_location: 'careers'
          });
        });
      }
    }


    // ═══════════════════════════════════════════════════════════
    // 4. Scroll depth — key section visibility tracking
    // ═══════════════════════════════════════════════════════════
    var scrollTracked = {};

    var sectionsToTrack = {
      'services':  'Services Section',
      'packages':  'Packages Section',
      'addons':    'Add-ons Section',
      'compare':   'Comparison Table',
      'faq':       'FAQ Section',
      'why':       'Why Velari Section',
      'markets':   'Markets Section'
    };

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var id = entry.target.id;
          if (entry.isIntersecting && !scrollTracked[id]) {
            scrollTracked[id] = true;
            var name = sectionsToTrack[id] || id;

            fireMetaCustom('SectionView', {
              content_name: name,
              content_category: pageSlug
            });

            fireGA4('section_view', {
              section_id: id,
              section_name: name,
              page_location: pageSlug
            });
          }
        });
      }, { threshold: 0.3 });

      Object.keys(sectionsToTrack).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }


    // ═══════════════════════════════════════════════════════════
    // 5. Language toggle tracking
    // ═══════════════════════════════════════════════════════════
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lang], .lang-toggle, [onclick*="lang"]');
      if (!btn) {
        // Fallback: check if text is a language switch
        var t = (e.target.textContent || '').trim();
        if (t === 'العربية' || t === 'English') {
          btn = e.target;
        }
      }
      if (!btn) return;

      var lang = (btn.textContent || '').trim();
      var switchedTo = (lang === 'العربية') ? 'ar' : 'en';

      fireGA4('language_switch', {
        language: switchedTo,
        page_location: pageSlug
      });
    });


  }); // end DOMContentLoaded


  // ═══════════════════════════════════════════════════════════
  // Helper functions
  // ═══════════════════════════════════════════════════════════

  /**
   * Detect Content Engine package from WhatsApp URL + button text
   */
  function detectPackage(href, buttonText) {
    var decoded = '';
    try { decoded = decodeURIComponent(href); } catch (e) { decoded = href; }

    var combined = (decoded + ' ' + buttonText).toLowerCase();

    if (combined.indexOf('lite') !== -1 || combined.indexOf('لايت') !== -1) {
      return { name: 'Lite', value: 499 };
    }
    if (combined.indexOf('drive') !== -1 || combined.indexOf('درايف') !== -1) {
      return { name: 'Drive', value: 949 };
    }
    if (combined.indexOf('prime') !== -1 || combined.indexOf('برايم') !== -1) {
      return { name: 'Prime', value: 1449 };
    }
    if (combined.indexOf('محرك') !== -1 || combined.indexOf('content engine') !== -1) {
      return { name: 'General Inquiry', value: 0 };
    }

    return { name: null, value: 0 };
  }

})();
