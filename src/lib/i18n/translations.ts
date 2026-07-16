// Lightweight translation dictionaries for Taripon.
// Keys are grouped by feature area. Add new keys to BOTH languages —
// `t()` falls back to English if a key is missing in the active language.
export type Lang = "en" | "fil";

export const LANGUAGES: { value: Lang; label: string; flag: string }[] = [
  { value: "en", label: "English", flag: " " },
  { value: "fil", label: "Filipino", flag: " " },
];

export const translations = {
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.calendar": "Calendar",
    "nav.goals": "Goals",
    "nav.stats": "Stats",
    "nav.history": "History",
    "nav.settings": "Settings",
    "nav.more": "More",
    "nav.menu": "Menu",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.send": "Send",
    "common.back": "Back",
    "common.loading": "Loading…",

    // Settings page
    "settings.title": "Settings",
    "settings.profile": "Profile",
    "settings.changePassword": "Change password",
    "settings.preferences": "Preferences",
    "settings.darkTheme": "Dark theme",
    "settings.darkThemeDesc": "Switch between light and dark.",
    "settings.language": "App language",
    "settings.languageDesc": "Choose the language used across Taripon.",
    "settings.currency": "Currency",
    "settings.data": "Data",
    "settings.support": "Help & Support",
    "settings.helpCenter": "Help Center / FAQ",
    "settings.helpCenterDesc": "Answers to common questions about Taripon.",
    "settings.savingsCalculator": "Savings Calculator",
    "settings.savingsCalculatorDesc": "Estimate how long it takes to hit a goal.",
    "settings.moneyTips": "Money Tips",
    "settings.moneyTipsDesc": "Quick habits to help you save more.",
    "settings.feedback": "Send Feedback",
    "settings.feedbackDesc": "Tell us what's working or what to improve.",
    "settings.exportData": "Export all data (Excel)",
    "settings.signOut": "Sign out",
    "settings.deleteAccount": "Delete account data",

    // Help center
    "help.title": "Help Center / FAQ",
    "help.subtitle": "Quick answers to the most common questions about Taripon.",
    "help.searchPlaceholder": "Search the help center…",
    "help.stillNeedHelp": "Still need help?",
    "help.stillNeedHelpDesc":
      "Can't find what you're looking for? Our support team is happy to help.",
    "help.contactUs": "Contact us",

    // Contact & support
    "contact.title": "Contact & Support",
    "contact.subtitle": "We usually reply within 1–2 business days.",
    "contact.name": "Your name",
    "contact.email": "Email address",
    "contact.subject": "Subject",
    "contact.message": "Message",
    "contact.messagePlaceholder": "Tell us what's going on…",
    "contact.send": "Send message",
    "contact.sending": "Sending…",
    "contact.success": "Message sent! We'll get back to you soon.",
    "contact.error": "Couldn't send your message. Please try again.",
    "contact.directEmail": "Prefer email? Reach us directly at",
    "contact.subjectGeneral": "General question",
    "contact.subjectBug": "Report a problem",
    "contact.subjectAccount": "Account & billing",
    "contact.subjectFeature": "Feature request",

    // Quick feedback (settings)
    "feedback.title": "Send Feedback",
    "feedback.subtitle": "Quick thoughts help us improve Taripon. This goes straight to our team.",
    "feedback.ratingLabel": "How's your experience so far?",
    "feedback.messagePlaceholder": "What's working well? What could be better?",
    "feedback.send": "Send feedback",
    "feedback.sending": "Sending…",
    "feedback.success": "Thanks for the feedback!",
    "feedback.error": "Couldn't send your feedback. Please try again.",
    "feedback.messageRequired": "Please write a quick note before sending.",
  },
  fil: {
    // Navigation
    "nav.home": "Home",
    "nav.calendar": "Kalendaryo",
    "nav.goals": "Mga Layunin",
    "nav.stats": "Estadistika",
    "nav.history": "Kasaysayan",
    "nav.settings": "Setting",
    "nav.more": "Iba pa",
    "nav.menu": "Menu",
    "common.save": "I-save",
    "common.cancel": "Kanselahin",
    "common.send": "Ipadala",
    "common.back": "Bumalik",
    "common.loading": "Naglo-load…",

    // Settings page
    "settings.title": "Setting",
    "settings.profile": "Profile",
    "settings.changePassword": "Palitan ang password",
    "settings.preferences": "Kagustuhan",
    "settings.darkTheme": "Dark theme",
    "settings.darkThemeDesc": "Lumipat sa light o dark mode.",
    "settings.language": "Wika ng app",
    "settings.languageDesc": "Piliin ang wikang gagamitin sa Taripon.",
    "settings.currency": "Pera",
    "settings.data": "Datos",
    "settings.support": "Tulong at Suporta",
    "settings.helpCenter": "Help Center / FAQ",
    "settings.helpCenterDesc": "Mga sagot sa madalas itanong tungkol sa Taripon.",
    "settings.savingsCalculator": "Kalkulator ng Ipon",
    "settings.savingsCalculatorDesc": "Tantyahin kung gaano katagal bago marating ang layunin.",
    "settings.moneyTips": "Mga Tip sa Pera",
    "settings.moneyTipsDesc": "Mabibilis na ugali para makatipid ka nang mas marami.",
    "settings.feedback": "Magpadala ng Feedback",
    "settings.feedbackDesc": "Sabihin sa amin kung ano ang maganda o kailangang pagbutihin.",
    "settings.exportData": "I-export lahat ng datos (Excel)",
    "settings.signOut": "Mag-sign out",
    "settings.deleteAccount": "Burahin ang datos ng account",

    // Help center
    "help.title": "Help Center / FAQ",
    "help.subtitle": "Mabilis na sagot sa mga karaniwang tanong tungkol sa Taripon.",
    "help.searchPlaceholder": "Maghanap sa help center…",
    "help.stillNeedHelp": "Kailangan pa ng tulong?",
    "help.stillNeedHelpDesc":
      "Hindi mo mahanap ang sagot? Nandito ang aming support team para tumulong.",
    "help.contactUs": "Makipag-ugnayan sa amin",

    // Contact & support
    "contact.title": "Makipag-ugnayan sa Suporta",
    "contact.subtitle": "Karaniwang sumasagot kami sa loob ng 1–2 araw.",
    "contact.name": "Iyong pangalan",
    "contact.email": "Email address",
    "contact.subject": "Paksa",
    "contact.message": "Mensahe",
    "contact.messagePlaceholder": "Sabihin sa amin ang iyong tanong o problema…",
    "contact.send": "Ipadala ang mensahe",
    "contact.sending": "Ipinapadala…",
    "contact.success": "Naipadala na ang mensahe! Sasagot kami sa lalong madaling panahon.",
    "contact.error": "Hindi naipadala ang mensahe. Pakisubukang muli.",
    "contact.directEmail": "Mas gusto ang email? Makipag-ugnayan sa amin sa",
    "contact.subjectGeneral": "Pangkalahatang tanong",
    "contact.subjectBug": "Mag-report ng problema",
    "contact.subjectAccount": "Account at bayarin",
    "contact.subjectFeature": "Kahilingan sa feature",

    // Quick feedback (settings)
    "feedback.title": "Magpadala ng Feedback",
    "feedback.subtitle":
      "Ang iyong mabilis na saloobin ay tumutulong sa amin. Direktang mapupunta ito sa aming team.",
    "feedback.ratingLabel": "Kumusta ang iyong karanasan sa Taripon?",
    "feedback.messagePlaceholder": "Ano ang maganda? Ano ang pwedeng pagbutihin?",
    "feedback.send": "Ipadala ang feedback",
    "feedback.sending": "Ipinapadala…",
    "feedback.success": "Salamat sa iyong feedback!",
    "feedback.error": "Hindi naipadala ang feedback. Pakisubukang muli.",
    "feedback.messageRequired": "Sumulat muna ng maikling mensahe bago ipadala.",
  },
} as const;

export type TranslationKey = keyof (typeof translations)["en"];
