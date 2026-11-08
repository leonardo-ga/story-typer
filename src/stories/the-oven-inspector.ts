import type { Story } from './types';

export const theOvenInspector = {
  id: 'the-oven-inspector',
  title: 'The Oven Inspector',
  genre: 'Comic fantasy',
  duration: '~9 min',
  description:
    'Your bakery inspection is at eight. There is a dragon in the oven, and it has strong opinions about your bread.',
  caption: 'Proof, heat, and a little negotiation.',
  setting: 'A BAKERY ON BRAMBLE STREET',
  effect: null,
  theme: 'bakery',
  ending: 'Approved, with conditions.',
  epilogue:
    'Tomorrow: two hundred rolls, one apprentice, and a larger breakfast.',
  paragraphs: [
    {
      title: 'An occupied oven',
      time: '05:10',
      text: 'The oven sneezes just as you slide in the first tray. Twelve rolls come back wearing little hats of soot. From behind the firebricks, a voice says, "Too much yeast." You fetch the poker. A small copper dragon takes it from you and hangs it neatly on its hook.',
    },
    {
      title: 'Terms of employment',
      time: '05:14',
      text: '"Out," you say. "Inspection at eight." The dragon unfolds a notice declaring this bakery condemned unless its unreliable furnace is repaired. You were hoping to hide that behind a sack of flour. "I can read upside down," it says. "Also, your chimney leaks."',
    },
    {
      title: 'A reference',
      time: '05:30',
      text: 'Its name is Clove. Its last employer was a prince who wanted a village burned down. Clove had warmed the village bathhouse instead. "He called it insubordination." You look at the cold dough, then at the dragon. "Can you hold a steady heat?" Clove asks whether breakfast is included.',
    },
    {
      title: 'A difficult batch',
      time: '06:20',
      text: 'The first batch burns underneath. The second stays pale on top. You move the trays; Clove shifts its tail. Neither of you speaks for a while. Then a loaf rises evenly, splits along its scored back, and fills the room with a smell that brings the milkman through the door.',
    },
    {
      title: 'The inspection',
      time: '08:00',
      text: 'The inspector arrives carrying a thermometer and an expression reserved for discovering mice. Clove is behind the coal bin, trying to resemble a shovel. The inspector checks the chimney, tastes a roll, and pauses beside the oven. "Your furnace," she says, "appears to have eaten the coal bucket."',
    },
    {
      title: 'A declaration',
      time: '08:04',
      text: 'You could blame the missing bucket on rust. Clove has already tucked its wings tighter, ready to be sent away. Instead, you pull out the spare stool. "This is my new baker." The inspector sets down her thermometer. Clove climbs onto the stool and leaves four careful claw marks in the wood.',
    },
    {
      title: 'The proper form',
      time: '08:16',
      text: '"Apprentices require a contract," the inspector says. "And somewhere to wash their hands." Clove raises its claws. "These count?" She measures them with her ruler. You find paper. Clove negotiates three meals, chimney access, and every Wednesday afternoon off. Nobody asks about the prince.',
    },
    {
      title: 'Opening time',
      time: '08:45',
      text: 'By opening time, the notice has been replaced with a provisional certificate. Under special conditions, the inspector has written: No sleeping in the flour. Clove reads it twice, then starts a list for tomorrow. You put a second cup beside yours. Outside, the queue reaches the corner. Inside, the next tray is ready.',
    },
  ],
} satisfies Story;
