import type { Story } from './types';

export const lastFrequency = {
  id: 'last-frequency',
  title: 'The Last Frequency',
  genre: 'Mystery',
  duration: '~5 min',
  description:
    'A quiet coast. An impossible signal. On your first night at a remote radio station, a voice calls from somewhere that no longer exists.',
  caption: 'Some signals never fade.',
  setting: 'A COASTAL RADIO STATION',
  effect: 'Rain',
  theme: 'coast',
  ending: 'You brought them home.',
  epilogue: 'The night is over. Thank you for listening.',
  paragraphs: [
    {
      title: 'The quiet hour',
      time: '23:41',
      text: 'Rain taps against the window of the coastal radio station. Your coffee has gone cold. Outside, the lighthouse turns its pale eye across an empty sea. It is your first night alone on the late shift.',
    },
    {
      title: 'An unfamiliar voice',
      time: '23:48',
      text: 'A voice breaks through the static. "Station Nine, do you read me?" You reach for the logbook. There is no Station Nine on the chart. Someone has written a note in the margin: closed, November 1986.',
    },
    {
      title: 'Across the water',
      time: '23:52',
      text: 'You turn the dial. Beneath the hiss, a woman is counting the seconds between waves. "The light has gone out," she says. "We cannot find the shore." You look up. The lighthouse is still turning.',
    },
    {
      title: 'The old logbook',
      time: '00:03',
      text: 'In a drawer, you find a photograph of the station as it used to be. Three people stand beside the radio tower. On the back is a message: If we ever call again, tell us to follow the bells.',
    },
    {
      title: 'A signal in the dark',
      time: '00:07',
      text: 'You open the microphone and ring the small brass bell on your desk. Once. Twice. Three times. Across the water, another bell answers. The woman laughs softly. "There you are," she says. "We can see you now."',
    },
    {
      title: 'The morning watch',
      time: '06:12',
      text: 'By morning, the sea is clear. The old frequency is silent. You leave a fresh cup of coffee beside the radio and open the logbook. Under the last transmission, in handwriting you do not recognize, are two words: Made it.',
    },
  ],
} satisfies Story;
