import type { Landmark } from './landmarks'

// --- История места в кинорежиме ---
// Главы как в сторис: «Знакомство», главы из данных места и «Сейчас рядом».
// У каждой свой ракурс: камера перелетает на другую сторону здания, меняет наклон и приближение

export type ChapterKind = 'intro' | 'story' | 'now'

/** Ракурс относительно вида при подлёте: поворот, наклон, добавка к зуму. */
export interface Shot {
  bearing: number
  pitch: number
  zoom: number
}

export interface StoryChapter {
  kind: ChapterKind
  title: string
  text: string
  shot: Shot
}

const INTRO_SHOT: Shot = { bearing: 0, pitch: 62, zoom: 0 }
/** История — сбоку издали, архитектура — ближе и снизу вверх, интересное — с третьей стороны. */
const STORY_SHOTS: Shot[] = [
  { bearing: 100, pitch: 48, zoom: -0.4 },
  { bearing: 190, pitch: 70, zoom: 0.7 },
  { bearing: 280, pitch: 58, zoom: 0.2 },
]
/** «Сейчас рядом» — отъезд, чтобы было видно окрестности и метки вокруг. */
const NOW_SHOT: Shot = { bearing: 360, pitch: 42, zoom: -1.2 }

export function storyOf(landmark: Landmark): StoryChapter[] {
  return [
    { kind: 'intro', title: 'Знакомство', text: landmark.description ?? '', shot: INTRO_SHOT },
    ...(landmark.chapters ?? []).map((chapter, index) => ({
      kind: 'story' as const,
      ...chapter,
      shot: STORY_SHOTS[index % STORY_SHOTS.length]!,
    })),
    { kind: 'now', title: 'Сейчас рядом', text: '', shot: NOW_SHOT },
  ]
}
