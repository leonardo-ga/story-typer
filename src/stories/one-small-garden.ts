import type { Story } from './types';

export const oneSmallGarden = {
  id: 'one-small-garden',
  storyId: 'one-small-garden',
  language: 'en',
  title: 'One Small Garden',
  genre: 'Science fiction',
  estimatedMinutes: 5,
  description:
    'Far from Earth, a maintenance robot discovers something unexpected in a deserted greenhouse. A gentle story about finding a reason to grow.',
  caption: 'A little green in the great unknown.',
  setting: 'AN ORBITAL GREENHOUSE',
  theme: 'orbit',
  ending: 'Something new is growing.',
  epilogue: 'A small garden. A very large universe. A place to call home.',
  paragraphs: [
    {
      title: 'A routine inspection',
      time: '07:00',
      text: 'Every morning, you check the same eighty doors. You are a maintenance robot aboard a station that has been empty for twelve years. Door eighty leads to the greenhouse. Today, something on the other side knocks back.',
    },
    {
      title: 'An unexpected passenger',
      time: '07:12',
      text: 'It is a loose watering pipe, tapping against the glass. Beneath it, a single green shoot has pushed through a crack in the floor. You search your instructions. There is a procedure for leaks. There is no procedure for hope.',
    },
    {
      title: 'New responsibilities',
      time: '08:30',
      text: 'You repair the pipe, then move it three centimeters to the left so that one drop still reaches the shoot. You adjust the lights. For the first time in twelve years, you are late checking door seventeen. Nothing terrible happens.',
    },
    {
      title: 'A question of names',
      time: '09:05',
      text: 'The plant grows two small leaves. You consult the station archive and discover that humans gave names to things they cared about. You name the plant Tuesday. It is Thursday, but Tuesday sounds friendlier when spoken aloud.',
    },
    {
      title: 'Room for more',
      time: '10:44',
      text: 'Weeks pass. Tuesday produces a yellow flower. You carry its pollen with the soft brush once reserved for cleaning instrument panels. Outside the window, Earth rises blue and distant. Inside, you begin building a second flowerpot.',
    },
    {
      title: 'A different report',
      time: '11:00',
      text: 'Your weekly report used to contain three words: All systems normal. Today, you attach a photograph of six green seedlings and add a new line: Visitors welcome. Then you open the greenhouse door and leave it open. There is room here for someone else.',
    },
  ],
} satisfies Story;
