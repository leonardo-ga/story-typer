import type { Story } from './types';
import { oneSmallGarden } from './one-small-garden';

export const oneSmallGardenFrench = {
  ...oneSmallGarden,
  id: 'un-petit-jardin',
  language: 'fr',
  title: 'Un petit jardin',
  estimatedMinutes: 7,
  description:
    'Loin de la Terre, un robot de maintenance fait une découverte inattendue dans une serre abandonnée. Une histoire douce sur les petites choses dont on prend soin.',
  caption: "Un peu de vert dans l'immensité de l'espace.",
  setting: 'UNE SERRE ORBITALE',
  ending: 'Quelque chose de nouveau grandit.',
  epilogue:
    'Un petit jardin. Un immense univers. Un endroit où se sentir chez soi.',
  paragraphs: [
    {
      title: 'Une inspection de routine',
      time: '07:00',
      text: "Chaque matin, tu inspectes les mêmes quatre-vingts portes. Tu es un robot de maintenance à bord d'une station inhabitée depuis douze ans. La porte numéro quatre-vingts donne sur la serre. Aujourd'hui, quelque chose frappe de l'autre côté.",
    },
    {
      title: 'Un visiteur inattendu',
      time: '07:12',
      text: "C'est un tuyau d'arrosage mal fixé qui cogne contre la vitre. Juste en dessous, une petite pousse verte a percé une fissure du sol. Tu consultes tes instructions. Il existe une procédure pour les fuites. Pour l'espoir, tu ne trouves rien.",
    },
    {
      title: 'De nouvelles responsabilités',
      time: '08:30',
      text: "Tu répares le tuyau, puis tu le déplaces de trois centimètres vers la gauche pour qu'une goutte atteigne encore la pousse. Tu règles les lampes. Pour la première fois en douze ans, tu arrives en retard à la porte dix-sept. Rien de terrible ne se produit.",
    },
    {
      title: 'Une question de nom',
      time: '09:05',
      text: 'Deux petites feuilles apparaissent. Dans les archives de la station, tu découvres que les humains donnaient des noms aux choses auxquelles ils tenaient. Tu appelles la plante Mardi. Nous sommes jeudi, mais Mardi sonne plus amical quand tu le prononces à voix haute.',
    },
    {
      title: 'De la place pour grandir',
      time: '10:44',
      text: 'Les semaines passent. Mardi donne une fleur jaune. Tu en prélèves le pollen avec le pinceau doux qui servait autrefois à nettoyer les tableaux de bord. Derrière le hublot, la Terre se lève, bleue et lointaine. Dans la serre, tu commences à fabriquer un deuxième pot.',
    },
    {
      title: 'Un autre rapport',
      time: '11:00',
      text: "Ton rapport hebdomadaire contenait toujours la même phrase : Tous les systèmes fonctionnent normalement. Aujourd'hui, tu joins une photo de six jeunes pousses et tu ajoutes une ligne : Visiteurs bienvenus. Puis tu ouvres la porte de la serre et tu la laisses ouverte. Ici, il y a de la place pour quelqu'un d'autre.",
    },
  ],
} satisfies Story;
