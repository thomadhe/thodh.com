import { toast } from "sonner";
import { languages, type Language } from "@/features/otsjoba/lib/learning";
export function speak(text: string, language: Language) {
  if (!("speechSynthesis" in window)) {
    toast.info(
      "Denne nettleseren støtter ikke opplesning. Du kan fortsatt lese og skrive.",
    );
    return;
  }
  const voice = speechSynthesis
    .getVoices()
    .find((v) => v.lang.toLowerCase().startsWith(language));
  if (!voice) {
    toast.info(
      `Ingen ${languages[language].name.toLowerCase()} stemme er installert. Legg til en stemme i nettleseren eller Windows.`,
    );
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = languages[language].locale;
  u.voice = voice;
  u.rate = 0.9;
  u.onerror = (event) => {
    if (event.error !== "canceled" && event.error !== "interrupted") {
      toast.error("Kunne ikke spille av stemmen.");
    }
  };
  speechSynthesis.speak(u);
}
