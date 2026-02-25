/**
 * Dynamically imports all translation files from subdirectories.
 * 
 * @description Uses Vite's glob import to load all TypeScript files from
 * language-specific subdirectories (e.g., ./en/messages.ts).
 * 
 * @type {Record<string, any>}
 */
const modules = import.meta.glob('./*/*.ts', { eager: true });

/**
 * Compiled messages object for i18next.
 * 
 * @description Structure: { [language]: { translation: { [key]: value } } }
 * Contains all translation messages organized by language code.
 * 
 * @type {Record<string, { translation: Record<string, string> }>}
 */
const messages: Record<string, { translation: Record<string, string> }> = {};

/**
 * Processes imported translation modules and organizes them by language.
 * 
 * @description Extracts language codes from file paths and merges translation
 * objects into the messages structure. Supports multiple translation files per language.
 */
Object.keys(modules).forEach((path) => {
  const match = path.match(/\.\/([^/]+)\/([^/]+)\.ts$/);
  if (match) {
    const [, lang] = match;
    const module = modules[path] as { default?: Record<string, string> };
    
    if (!messages[lang]) {
      messages[lang] = { translation: {} };
    }
    
    if (module.default) {
      messages[lang].translation = {
        ...messages[lang].translation,
        ...module.default
      };
    }
  }
});

/**
 * Ensures at least English translations exist.
 * 
 * @description If no translation files are found, creates an empty English
 * translation object to prevent i18next initialization errors.
 */
if (Object.keys(messages).length === 0) {
  messages.en = { translation: {} };
}

export default messages; 