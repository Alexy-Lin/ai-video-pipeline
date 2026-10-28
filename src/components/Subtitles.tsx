import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import captionsData from '../generated/captions.json';

type Word = { text: string; startMs: number; endMs: number };
type Line = { durationSeconds: number; text: string; words: Word[] };
type Char = { ch: string; startMs: number; endMs: number };

const CAPTIONS = captionsData as { lines: Record<string, Line> };

/** Punctuation that ends a spoken clause — pages must break here, never mid-phrase. */
const CLAUSE_END = new Set([...'，。、；：！？,.;:!?…']);
/** Trailing punctuation that sticks to the previous page rather than starting a new one. */
const TRAILING = new Set(['”', '』', '」', '）', ')', '》']);

const MAX_CHARS = 18;

/** Explode the word list to per-character timings so pagination can cut anywhere. */
const toChars = (words: Word[]): Char[] => {
  const chars: Char[] = [];
  for (const word of words) {
    const text = word.text;
    const span = Math.max(1, word.endMs - word.startMs);
    for (let i = 0; i < text.length; i += 1) {
      chars.push({
        ch: text[i],
        startMs: word.startMs + (span * i) / text.length,
        endMs: word.startMs + (span * (i + 1)) / text.length,
      });
    }
  }
  return chars;
};

/** Split chars into clauses that end on punctuation (punctuation stays with its clause). */
const toClauses = (chars: Char[]): Char[][] => {
  const clauses: Char[][] = [];
  let current: Char[] = [];
  for (const char of chars) {
    current.push(char);
    if (CLAUSE_END.has(char.ch)) {
      clauses.push(current);
      current = [];
    }
  }
  if (current.length) clauses.push(current);
  return clauses;
};

/** Cut an over-long clause without leaving a 1–2 character orphan on the next page. */
const splitLong = (clause: Char[], limit: number): Char[][] => {
  const parts: Char[][] = [];
  let rest = clause;
  while (rest.length > limit) {
    let cut = limit;
    // do not end a page on a comma-like char; keep it with the following text
    while (cut > 1 && CLAUSE_END.has(rest[cut - 1].ch)) cut -= 1;
    parts.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest.length) {
    const last = parts[parts.length - 1];
    // rebalance a stub tail (<=2 chars) backwards so no page shows a lone character
    if (last && rest.length <= 2 && last.length > rest.length) {
      const moved = last.splice(last.length - rest.length, rest.length);
      rest = [...moved, ...rest];
    }
    parts.push(rest);
  }
  return parts;
};

/** Group clauses into on-screen pages of at most MAX_CHARS. */
const toPages = (chars: Char[]): Char[][] => {
  const pages: Char[][] = [];
  let page: Char[] = [];
  for (const clause of toClauses(chars)) {
    const pieces = clause.length > MAX_CHARS ? splitLong(clause, MAX_CHARS) : [clause];
    for (const piece of pieces) {
      if (page.length && page.length + piece.length > MAX_CHARS) {
        pages.push(page);
        page = [];
      }
      page.push(...piece);
    }
  }
  if (page.length) pages.push(page);
  // fold a page that is only punctuation/trailing marks into the previous one
  const merged: Char[][] = [];
  for (const candidate of pages) {
    const meaningful = candidate.filter((c) => !CLAUSE_END.has(c.ch) && !TRAILING.has(c.ch)).length;
    if (merged.length && meaningful <= 1) {
      merged[merged.length - 1] = [...merged[merged.length - 1], ...candidate];
    } else {
      merged.push(candidate);
    }
  }
  return merged;
};

const pageCache = new Map<string, Char[][]>();
const getPages = (key: string, words: Word[]) => {
  let pages = pageCache.get(key);
  if (!pages) {
    pages = toPages(toChars(words));
    pageCache.set(key, pages);
  }
  return pages;
};

type Props = {
  /** Caption line key from src/generated/captions.json. */
  name: string;
  hideBefore?: number;
  hideAfter?: number;
};

/**
 * Burned-in subtitles: bold heiti, deep yellow with a dark outline, no per-word
 * highlight. Pages break on punctuation so a phrase is never split across pages.
 */
export const Subtitles: React.FC<Props> = ({ name, hideBefore = 0, hideAfter = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const line = CAPTIONS.lines[name];
  if (!line || !line.words.length) return null;
  if (frame < hideBefore || frame > durationInFrames - hideAfter) return null;

  const ms = (frame / fps) * 1000;
  const pages = getPages(name, line.words);
  const page = pages.find(
    (items) => ms >= items[0].startMs - 140 && ms <= items[items.length - 1].endMs + 320,
  );
  if (!page) return null;

  const text = page.map((c) => c.ch).join('');

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 78,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <div
        style={{
          fontFamily: '"SimHei", "Microsoft YaHei", "Heiti SC", sans-serif',
          fontSize: 36,
          fontWeight: 900,
          letterSpacing: 2,
          whiteSpace: 'nowrap',
          color: '#E8B60F',
          WebkitTextStroke: '4px rgba(0,0,0,0.88)',
          paintOrder: 'stroke fill',
          textShadow: '0 3px 10px rgba(0,0,0,0.55)',
        }}
      >
        {text}
      </div>
    </div>
  );
};
