import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/lib/i18n";
import {
  faMagnifyingGlass,
  faSeedling,
  faBullseye,
  faCoins,
  faShieldHeart,
  faFileExcel,
  faMoon,
  faHeadset,
} from "@fortawesome/free-solid-svg-icons";

type Faq = { question: string; answer: string };
type FaqGroup = {
  icon: typeof faSeedling;
  title: { en: string; fil: string };
  items: { en: Faq; fil: Faq }[];
};

const FAQ_GROUPS: FaqGroup[] = [
  {
    icon: faSeedling,
    title: { en: "Getting started", fil: "Pagsisimula" },
    items: [
      {
        en: {
          question: "What is Taripon?",
          answer:
            "Taripon is a simple savings tracker that helps you log money you save — from a piggy bank, a bank account, or both — and see your progress build over time.",
        },
        fil: {
          question: "Ano ang Taripon?",
          answer:
            "Ang Taripon ay isang simpleng savings tracker na tumutulong sa iyong i-log ang pera na iyong naiipon — mula sa alkansya, bank account, o pareho — at makita ang paglago nito sa paglipas ng panahon.",
        },
      },
      {
        en: {
          question: "How do I log a new savings entry?",
          answer:
            'Press the "Add savings" button on your dashboard or sidebar (or just tap the N key), enter the amount, category and date, then save. It shows up instantly in your history and stats.',
        },
        fil: {
          question: "Paano mag-log ng bagong savings entry?",
          answer:
            'Pindutin ang "Add savings" na buton sa dashboard o sidebar (o pindutin ang N key), ilagay ang halaga, kategorya at petsa, pagkatapos i-save. Agad itong lalabas sa iyong history at stats.',
        },
      },
    ],
  },
  {
    icon: faBullseye,
    title: { en: "Goals", fil: "Mga Layunin" },
    items: [
      {
        en: {
          question: "How do savings goals work?",
          answer:
            "Create a goal with a target amount and an optional deadline. As you log savings entries, you can allocate them toward a goal to watch its progress bar fill up.",
        },
        fil: {
          question: "Paano gumagana ang savings goals?",
          answer:
            "Gumawa ng goal na may target amount at opsyonal na deadline. Habang nagla-log ka ng savings entries, maaari mong ilaan ang mga ito sa isang goal para makita ang progreso nito.",
        },
      },
      {
        en: {
          question: "Can I archive or delete a goal?",
          answer:
            "Yes — open a goal and mark it completed or archived once you're done, or delete it entirely if you created it by mistake.",
        },
        fil: {
          question: "Pwede ko bang i-archive o burahin ang goal?",
          answer:
            "Oo — buksan ang goal at markahan itong completed o archived kapag tapos na, o burahin ito kung nagkamali ka sa paggawa.",
        },
      },
    ],
  },
  {
    icon: faCoins,
    title: { en: "Currency & data", fil: "Pera at Datos" },
    items: [
      {
        en: {
          question: "Can I change my currency?",
          answer:
            "Yes. Go to Settings → Preferences → Currency and pick from PHP, USD, EUR, GBP, JPY, SGD, AUD or CAD. This only changes how amounts are displayed.",
        },
        fil: {
          question: "Pwede ko bang palitan ang currency?",
          answer:
            "Oo. Pumunta sa Setting → Kagustuhan → Pera at pumili mula sa PHP, USD, EUR, GBP, JPY, SGD, AUD o CAD. Ito ay nagbabago lamang kung paano ipinapakita ang mga halaga.",
        },
      },
      {
        en: {
          question: "How do I export my data?",
          answer:
            'Head to Settings → Data → "Export all data (Excel)" to download every entry and goal as a spreadsheet you can keep or share.',
        },
        fil: {
          question: "Paano i-export ang aking datos?",
          answer:
            'Pumunta sa Setting → Datos → "I-export lahat ng datos (Excel)" para i-download ang lahat ng entries at goals bilang spreadsheet.',
        },
      },
    ],
  },
  {
    icon: faMoon,
    title: { en: "Appearance & language", fil: "Itsura at Wika" },
    items: [
      {
        en: {
          question: "How do I switch between light and dark mode?",
          answer:
            'Tap the sun/moon icon in the sidebar or top bar, or toggle "Dark theme" from Settings → Preferences.',
        },
        fil: {
          question: "Paano lumipat sa light o dark mode?",
          answer:
            'Pindutin ang sun/moon icon sa sidebar o top bar, o i-toggle ang "Dark theme" mula sa Setting → Kagustuhan.',
        },
      },
      {
        en: {
          question: "How do I change the app language?",
          answer:
            "Go to Settings → Preferences → App language and choose English or Filipino. Your choice is saved to your account.",
        },
        fil: {
          question: "Paano palitan ang wika ng app?",
          answer:
            "Pumunta sa Setting → Kagustuhan → Wika ng app at piliin ang English o Filipino. Ang iyong napili ay naka-save sa iyong account.",
        },
      },
    ],
  },
  {
    icon: faShieldHeart,
    title: { en: "Account & security", fil: "Account at Seguridad" },
    items: [
      {
        en: {
          question: "Is my data private?",
          answer:
            "Yes. Every account only has access to its own entries, goals and settings — enforced at the database level, not just in the app.",
        },
        fil: {
          question: "Pribado ba ang aking datos?",
          answer:
            "Oo. Bawat account ay may access lamang sa sariling entries, goals at settings — ipinapatupad ito sa antas ng database, hindi lang sa app.",
        },
      },
      {
        en: {
          question: "How do I delete my account?",
          answer:
            'Go to Settings → Data → "Delete account data". This permanently removes your savings, goals, profile and settings, and cannot be undone.',
        },
        fil: {
          question: "Paano burahin ang aking account?",
          answer:
            'Pumunta sa Setting → Datos → "Burahin ang datos ng account". Permanenteng aalisin nito ang iyong savings, goals, profile at settings, at hindi na maibabalik pa.',
        },
      },
    ],
  },
];

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({ meta: [{ title: "Help Center — TARIPON" }] }),
  component: HelpPage,
});

function HelpPage() {
  const { lang, t } = useLanguage();
  const [query, setQuery] = useState("");

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_GROUPS;
    return FAQ_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          item[lang].question.toLowerCase().includes(q) ||
          item[lang].answer.toLowerCase().includes(q),
      ),
    })).filter((group) => group.items.length > 0);
  }, [query, lang]);

  return (
    <AppShell title={t("help.title")}>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-secondary/60 to-blush/40 p-5 sm:p-8">
          <p className="text-sm text-gradient-primary dark:text-white sm:text-base">{t("help.subtitle")}</p>
          <div className="relative mt-4">
            <Icon
              icon={faMagnifyingGlass}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("help.searchPlaceholder")}
              className="pl-10"
            />
          </div>
        </div>

        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            {lang === "fil" ? "Walang nahanap na resulta." : "No results found."}
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.title.en}
              className="rounded-2xl border border-border bg-card p-4 sm:p-6"
            >
              <div className="mb-1 flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary text-primary-dark">
                  <Icon icon={group.icon} className="text-sm" />
                </span>
                <h2 className="text-sm font-bold text-foreground sm:text-base">
                  {group.title[lang]}
                </h2>
              </div>
              <Accordion type="single" collapsible className="mt-2">
                {group.items.map((item, i) => (
                  <AccordionItem key={i} value={`${group.title.en}-${i}`}>
                    <AccordionTrigger className="text-sm font-semibold text-foreground">
                      {item[lang].question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item[lang].answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))
        )}

        <div className="rounded-2xl border border-dashed border-primary/30 bg-card p-5 text-center sm:p-6">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Icon icon={faHeadset} />
          </div>
          <h3 className="mt-3 text-sm font-bold text-foreground">{t("help.stillNeedHelp")}</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {t("help.stillNeedHelpDesc")}
          </p>
          <Link
            to="/contact"
            className="hover-bounce mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-dark"
          >
            <Icon icon={faHeadset} /> {t("help.contactUs")}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
