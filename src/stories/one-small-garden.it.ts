import type { Story } from './types';
import { oneSmallGarden } from './one-small-garden';

export const oneSmallGardenItalian = {
  ...oneSmallGarden,
  id: 'un-piccolo-giardino',
  language: 'it',
  title: 'Un piccolo giardino',
  estimatedMinutes: 6,
  description:
    'Lontano dalla Terra, un robot addetto alla manutenzione scopre qualcosa di inatteso in una serra abbandonata. Una storia delicata su ciò di cui vale la pena prendersi cura.',
  caption: "Un po' di verde nell'immensità dello spazio.",
  setting: 'UNA SERRA ORBITALE',
  ending: 'Sta crescendo qualcosa di nuovo.',
  epilogue:
    'Un piccolo giardino. Un universo immenso. Un posto da chiamare casa.',
  paragraphs: [
    {
      title: 'Un controllo di routine',
      time: '07:00',
      text: "Ogni mattina controlli le stesse ottanta porte. Sei un robot addetto alla manutenzione di una stazione spaziale disabitata da dodici anni. La porta numero ottanta dà sulla serra. Oggi, dall'altra parte, qualcosa risponde bussando.",
    },
    {
      title: 'Un ospite inatteso',
      time: '07:12',
      text: "È un tubo dell'impianto di irrigazione: si è allentato e batte contro il vetro. Sotto, un germoglio verde è spuntato da una crepa nel pavimento. Consulti le istruzioni. C'è una procedura per le perdite d'acqua. Per la speranza, invece, non trovi nulla.",
    },
    {
      title: 'Nuove responsabilità',
      time: '08:30',
      text: 'Ripari il tubo, poi lo sposti di tre centimetri verso sinistra, in modo che una goccia raggiunga ancora il germoglio. Regoli le luci. Per la prima volta in dodici anni, arrivi in ritardo al controllo della porta diciassette. Non succede niente di terribile.',
    },
    {
      title: 'Questione di nomi',
      time: '09:05',
      text: "Alla piantina crescono due foglioline. Consultando l'archivio della stazione, scopri che gli esseri umani davano un nome alle cose a cui tenevano. La chiami Martedì. È giovedì, ma quando lo pronunci ad alta voce, Martedì suona più amichevole.",
    },
    {
      title: 'Spazio per crescere',
      time: '10:44',
      text: 'Passano le settimane. Martedì produce un fiore giallo. Ne raccogli il polline con il pennello morbido che un tempo serviva a pulire i pannelli degli strumenti. Oltre il finestrino sorge la Terra, azzurra e lontana. Dentro la serra, cominci a costruire un secondo vaso.',
    },
    {
      title: 'Un rapporto diverso',
      time: '11:00',
      text: "Il tuo rapporto settimanale conteneva sempre le stesse parole: Tutti i sistemi funzionano regolarmente. Oggi alleghi la fotografia di sei piantine verdi e aggiungi una riga: Le visite sono benvenute. Poi apri la porta della serra e la lasci aperta. Qui c'è posto anche per qualcun altro.",
    },
  ],
} satisfies Story;
