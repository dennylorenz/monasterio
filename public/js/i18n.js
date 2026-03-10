const SUPPORTED = ['es', 'en', 'de', 'fr'];
let currentLang = 'es';
let strings = {};

function detectLang() {
  // Spanish is always the default — only switch if user has explicitly chosen a language
  const stored = localStorage.getItem('mono_lang');
  if (stored && SUPPORTED.includes(stored)) return stored;
  return 'es';
}

async function loadLocale(lang) {
  const res = await fetch(`/locales/${lang}.json`);
  if (!res.ok) throw new Error(`Failed to load locale: ${lang}`);
  return res.json();
}

function applyStrings() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (strings[key] !== undefined) el.innerHTML = strings[key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (strings[key] !== undefined) el.setAttribute('placeholder', strings[key]);
  });
  document.querySelectorAll('[data-i18n-value]').forEach((el) => {
    const key = el.getAttribute('data-i18n-value');
    if (strings[key] !== undefined && el.tagName === 'OPTION' && el.value === '') {
      el.textContent = strings[key];
    }
  });
  document.documentElement.lang = currentLang;
}

function updateSwitcher() {
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

async function setLang(lang) {
  if (!SUPPORTED.includes(lang)) lang = 'es';
  currentLang = lang;
  localStorage.setItem('mono_lang', lang);
  strings = await loadLocale(lang);
  window.__i18nStrings = strings; // expose for main.js
  applyStrings();
  updateSwitcher();
  // Update hidden lang input in form
  const langInput = document.getElementById('form-lang');
  if (langInput) langInput.value = lang;
}

function initI18n() {
  const lang = detectLang();
  document.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.dataset.lang));
  });
  setLang(lang);
}

document.addEventListener('DOMContentLoaded', initI18n);
