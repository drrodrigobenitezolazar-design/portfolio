/* =========================================================
   Bilingual support (ES / EN).
   - UI: static interface strings, keyed by data-i18n.
   - localize(): merges content.es over the English base content.
   ========================================================= */

const LANG_KEY = 'rbo_lang';

const UI = {
  es: {
    'nav.about': 'Sobre mí',
    'nav.experience': 'Experiencia',
    'nav.skills': 'Especialidades',
    'nav.portfolio': 'Portafolio',
    'nav.contact': 'Contacto',
    'nav.cta': 'Contacto',
    'hero.portfolio': 'Ver portafolio',
    'hero.contact': 'Contactar',
    'hero.scroll': 'Deslizar',
    'about.eyebrow': 'Sobre mí',
    'exp.eyebrow': 'Trayectoria',
    'exp.title': 'Experiencia<br/>Profesional',
    'exp.desc': 'Más de una década de práctica clínica en Paraguay, Brasil y Emiratos Árabes Unidos.',
    'edu.eyebrow': 'Formación',
    'edu.title': 'Formación<br/>Académica',
    'skills.eyebrow': 'Especialidades',
    'skills.title': 'Áreas<br/>Clínicas',
    'skills.desc': 'Una práctica centrada en prótesis dental, odontología estética y rehabilitación oral completa.',
    'lang.eyebrow': 'Idiomas',
    'lang.title': 'Idiomas',
    'port.eyebrow': 'Trabajos seleccionados',
    'port.title': 'Casos y Tratamientos',
    'port.desc': 'Una selección de casos clínicos. Tocá cualquier imagen para ver el detalle.',
    'port.all': 'Todos los casos',
    'contact.eyebrow': 'Contacto',
    'contact.title': 'Diseñemos<br/>tu próxima sonrisa.',
    'contact.desc': 'Para oportunidades laborales, colaboraciones o consultas profesionales, escribime por cualquiera de estos canales.',
    'contact.email': 'Correo',
    'contact.whatsapp': 'WhatsApp',
    'contact.instagram': 'Instagram',
    'contact.location': 'Ubicación',
    'contact.license': 'Licencia',
    'side.eyebrow': 'Para clínicas',
    'side.title': 'Contacto profesional',
    'side.desc': 'Abierto a nuevas oportunidades en clínicas y grupos odontológicos, en rehabilitación oral, implantes y odontología estética. Referencias de clínicas anteriores y supervisores académicos disponibles a pedido.',
    'side.cv': 'Descargar CV',
    'footer.rights': 'Todos los derechos reservados.',
    'cat.Veneers': 'Carillas',
    'cat.Full mouth': 'Rehabilitación completa',
    'cat.Restorations': 'Restauraciones',
    // CV (PDF)
    'cv.profile': 'Perfil',
    'cv.experience': 'Experiencia profesional',
    'cv.education': 'Formación académica',
    'cv.skills': 'Áreas clínicas',
    'cv.languages': 'Idiomas',
    'cv.highlights': 'En números',
    'cv.portfolio': 'Portafolio de casos clínicos',
    'cv.portfolioDesc': 'Casos antes/después de carillas, rehabilitaciones completas y restauraciones disponibles en',
    'cv.license': 'Licencia',
    'cv.nationality': 'Nacionalidad'
  },
  en: {
    'nav.about': 'About',
    'nav.experience': 'Experience',
    'nav.skills': 'Skills',
    'nav.portfolio': 'Portfolio',
    'nav.contact': 'Contact',
    'nav.cta': 'Get in touch',
    'hero.portfolio': 'View Portfolio',
    'hero.contact': 'Contact me',
    'hero.scroll': 'Scroll',
    'about.eyebrow': 'About',
    'exp.eyebrow': 'Career',
    'exp.title': 'Professional<br/>Experience',
    'exp.desc': 'Over a decade of clinical practice across Paraguay, Brazil and the United Arab Emirates.',
    'edu.eyebrow': 'Education',
    'edu.title': 'Academic<br/>Background',
    'skills.eyebrow': 'Expertise',
    'skills.title': 'Clinical<br/>Skills',
    'skills.desc': 'A focused practice anchored in prosthodontics, aesthetic dentistry and full-mouth rehabilitation.',
    'lang.eyebrow': 'Languages',
    'lang.title': 'Spoken',
    'port.eyebrow': 'Selected Work',
    'port.title': 'Cases &amp; Treatments',
    'port.desc': 'A curated selection of clinical cases. Tap any image to view details.',
    'port.all': 'All cases',
    'contact.eyebrow': 'Get in touch',
    'contact.title': 'Let\'s design<br/>your next smile.',
    'contact.desc': 'For job opportunities, collaborations or professional inquiries, please reach out via any of the channels below.',
    'contact.email': 'Email',
    'contact.whatsapp': 'WhatsApp',
    'contact.instagram': 'Instagram',
    'contact.location': 'Location',
    'contact.license': 'License',
    'side.eyebrow': 'For clinics',
    'side.title': 'Professional contact',
    'side.desc': 'Open to new opportunities with clinics and dental groups in oral rehabilitation, implants and aesthetic dentistry. References from former practices and academic supervisors are available upon request.',
    'side.cv': 'Download CV',
    'footer.rights': 'All rights reserved.',
    'cat.Veneers': 'Veneers',
    'cat.Full mouth': 'Full mouth',
    'cat.Restorations': 'Restorations',
    'cv.profile': 'Profile',
    'cv.experience': 'Professional experience',
    'cv.education': 'Education',
    'cv.skills': 'Clinical skills',
    'cv.languages': 'Languages',
    'cv.highlights': 'Highlights',
    'cv.portfolio': 'Clinical case portfolio',
    'cv.portfolioDesc': 'Before/after cases of veneers, full-mouth rehabilitations and restorations available at',
    'cv.license': 'License',
    'cv.nationality': 'Nationality'
  }
};

const CV_FILES = {
  es: 'assets/cv/CV-Rodrigo-Benitez-Olazar-ES.pdf',
  en: 'assets/cv/CV-Rodrigo-Benitez-Olazar-EN.pdf'
};

function getLang() {
  const q = new URLSearchParams(location.search).get('lang');
  if (q === 'es' || q === 'en') return q;
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'es' || saved === 'en') return saved;
  } catch (e) {}
  return 'es';
}

function saveLang(lang) {
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
}

function t(lang, key) {
  return (UI[lang] && UI[lang][key]) || UI.en[key] || key;
}

/* English is the base; content.es overrides it field by field (arrays item by item). */
function localize(content, lang) {
  const base = JSON.parse(JSON.stringify(content));
  const es = base.es;
  delete base.es;
  if (lang !== 'es' || !es) return base;
  const mergeList = (a = [], b = []) => a.map((item, i) => Object.assign({}, item, b[i] || {}));
  base.profile = Object.assign({}, base.profile, es.profile);
  base.stats = mergeList(base.stats, es.stats);
  base.experience = mergeList(base.experience, es.experience);
  base.education = mergeList(base.education, es.education);
  if (es.skills) base.skills = es.skills;
  if (es.languages) base.languages = es.languages;
  return base;
}

function whatsappUrl(phone) {
  return 'https://wa.me/' + (phone || '').replace(/\D/g, '');
}
