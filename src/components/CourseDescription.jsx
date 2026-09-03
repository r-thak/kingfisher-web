import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import subjectMap from '../utils/subjectMap';

const SUBJECT_KEYS = Object.keys(subjectMap).sort((a, b) => b.length - a.length);
const SUBJECT_REGEX_STR = SUBJECT_KEYS.join('|');

function parseCourseDescription(text) {
  if (!text) return [];

  // Match full course: Subject + Number (e.g. CS 124, MATH 241, AAS 100)
  const coursePattern = new RegExp(`\\b(${SUBJECT_REGEX_STR})\\s+([1-9]\\d{2}[A-Z]?)\\b`, 'g');
  
  const matches = [];
  let m;
  while ((m = coursePattern.exec(text)) !== null) {
    matches.push({
      start: m.index,
      end: m.index + m[0].length,
      text: m[0],
      subject: m[1],
      number: m[2]
    });
  }

  const allMatches = [];
  
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    allMatches.push(cur);

    // Lookahead in text after cur.end until next match start or sentence boundary
    const nextStart = (i + 1 < matches.length) ? matches[i + 1].start : text.length;
    const followingSlice = text.substring(cur.end, nextStart);
    
    // Check if followingSlice contains chained numbers like ", 257", " or 124", ", or 415"
    // Negative lookahead avoids "-level", " level", " hours", " credit", "%", etc.
    const chainedPattern = /(?:,\s*|\s+(?:or|and)\s+|,\s*(?:or|and)\s+)([1-9]\d{2}[A-Z]?)\b(?!\s*-(?:or|and|\d)|-level|\s+level|\s+hours?|\s+credit|%)/g;
    
    let cm;
    while ((cm = chainedPattern.exec(followingSlice)) !== null) {
      const beforeMatch = followingSlice.substring(0, cm.index);
      if (/[.;]/.test(beforeMatch)) break; // Don't cross punctuation boundaries
      
      const numMatch = cm[1];
      const matchIndexInFull = cur.end + cm.index + cm[0].lastIndexOf(numMatch);
      
      allMatches.push({
        start: matchIndexInFull,
        end: matchIndexInFull + numMatch.length,
        text: numMatch,
        subject: cur.subject,
        number: numMatch
      });
    }
  }

  allMatches.sort((a, b) => a.start - b.start);

  const tokens = [];
  let lastIndex = 0;

  for (const match of allMatches) {
    if (match.start < lastIndex) continue;
    if (match.start > lastIndex) {
      tokens.push({
        text: text.substring(lastIndex, match.start),
        isCourse: false
      });
    }
    tokens.push({
      text: match.text,
      isCourse: true,
      subject: match.subject,
      number: match.number,
      searchQuery: `${match.subject} ${match.number}`
    });
    lastIndex = match.end;
  }

  if (lastIndex < text.length) {
    tokens.push({
      text: text.substring(lastIndex),
      isCourse: false
    });
  }

  return tokens;
}

function CourseDescription({ description, fallback = 'No description available for this course.' }) {
  const navigate = useNavigate();

  const tokens = useMemo(() => {
    if (!description) return null;
    return parseCourseDescription(description);
  }, [description]);

  if (!description) {
    return <span>{fallback}</span>;
  }

  return (
    <span>
      {tokens.map((token, idx) => {
        if (!token.isCourse) {
          return <span key={idx}>{token.text}</span>;
        }

        const url = `/search?q=${encodeURIComponent(token.searchQuery)}`;

        return (
          <a
            key={idx}
            href={url}
            className="course-desc-link"
            onClick={(e) => {
              e.preventDefault();
              navigate(url);
            }}
            title={`View ${token.searchQuery}`}
          >
            {token.text}
          </a>
        );
      })}
    </span>
  );
}

export default CourseDescription;
