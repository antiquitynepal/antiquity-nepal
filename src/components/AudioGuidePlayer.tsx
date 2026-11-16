import React, { useEffect, useRef, useState } from 'react';
import {
  Headphones,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AudioChapter } from '../data/heritageSites';
import { ambientAudio } from '../utils/ambientAudio';

interface AudioGuidePlayerProps {
  siteName: string;
  chapters: AudioChapter[];
  activeChapterIndex: number;
  onChangeChapter: (index: number) => void;
  autoPlaySignal?: number;
}

export const AudioGuidePlayer: React.FC<AudioGuidePlayerProps> = ({
  siteName,
  chapters,
  activeChapterIndex,
  onChangeChapter,
  autoPlaySignal,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [activeSentenceIdx, setActiveSentenceIdx] = useState<number>(0);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [ambientEnabled, setAmbientEnabled] = useState<boolean>(true);
  const [ambientVol, setAmbientVol] = useState<number>(0.28);

  const chapter = chapters[activeChapterIndex] || chapters[0];
  const timerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const stopSpeechAndTimers = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore speech synthesis errors
      }
    }
  };

  // Stop audio on unmount or site switch
  useEffect(() => {
    return () => {
      stopSpeechAndTimers();
      ambientAudio.stop();
    };
  }, [siteName]);

  // Reset chapter progress when chapter changes
  useEffect(() => {
    setActiveSentenceIdx(0);
    setElapsedSec(0);
    if (isPlayingRef.current) {
      startPlayback(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChapterIndex, siteName]);

  // Trigger playback when user clicks "Play Related Audio Chapter" from a 3D hotspot
  useEffect(() => {
    if (autoPlaySignal && autoPlaySignal > 0) {
      startPlayback(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlaySignal]);

  useEffect(() => {
    ambientAudio.setVolume(ambientEnabled ? ambientVol : 0);
  }, [ambientEnabled, ambientVol]);

  const speakSentence = (index: number) => {
    if (!chapter || index >= chapter.script.length) {
      setIsPlaying(false);
      ambientAudio.stop();
      return;
    }
    setActiveSentenceIdx(index);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(chapter.script[index]);
        utterance.rate = playbackRate;
        utterance.pitch = 0.98;
        utterance.lang = 'en-US';
        utterance.onend = () => {
          if (isPlayingRef.current) {
            speakSentence(index + 1);
          }
        };
        window.speechSynthesis.speak(utterance);
      } catch {
        // Timer below still advances transcript cleanly
      }
    }
  };

  const startPlayback = (fromSentence = activeSentenceIdx) => {
    if (!chapter) return;
    stopSpeechAndTimers();
    setIsPlaying(true);
    isPlayingRef.current = true;

    if (ambientEnabled) {
      ambientAudio.setVolume(ambientVol);
      ambientAudio.start(chapter.ambientProfile);
    }

    speakSentence(fromSentence);

    // Reliable progress timer (also serves browsers without speechSynthesis voices)
    timerRef.current = window.setInterval(() => {
      setElapsedSec((prev) => {
        const next = prev + 1;
        if (next >= chapter.durationSec) {
          stopSpeechAndTimers();
          ambientAudio.stop();
          setIsPlaying(false);
          return chapter.durationSec;
        }
        // Keep sentence highlight synced smoothly if speechSynthesis onend didn't fire
        const approxIdx = Math.min(
          chapter.script.length - 1,
          Math.floor((next / chapter.durationSec) * chapter.script.length)
        );
        setActiveSentenceIdx((cur) => (approxIdx > cur ? approxIdx : cur));
        return next;
      });
    }, Math.round(1000 / playbackRate));
  };

  const pausePlayback = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    stopSpeechAndTimers();
    ambientAudio.stop();
  };

  const togglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      if (elapsedSec >= (chapter?.durationSec ?? 0)) {
        setElapsedSec(0);
        startPlayback(0);
      } else {
        startPlayback(activeSentenceIdx);
      }
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  if (!chapter) return null;

  const progressPct = Math.min(100, Math.round((elapsedSec / chapter.durationSec) * 100));

  return (
    <div className="rounded-lg border border-stone-300 bg-[#EFEAE1] p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-300/80 pb-5">
        <div>
          <p className="text-xs font-medium tracking-wide text-[#9A3412]">
            Guided Audio Narrative · {siteName}
          </p>
          <h3 className="mt-1 font-serif text-2xl font-semibold text-[#1C1917]">
            {chapter.number}. {chapter.title}
          </h3>
          <p className="mt-1 text-xs text-stone-600">
            Narrated by {chapter.narratorRole} · Acoustic layer:{' '}
            {chapter.ambientProfile === 'singing-bowl'
              ? 'Himalayan Singing Bowl'
              : chapter.ambientProfile === 'temple-bells'
              ? 'Bronze Temple Bells'
              : 'Valley Ridge Wind'}
          </p>
        </div>

        {/* Speed & Ambient Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-md border border-stone-300 bg-[#F8F5F0] p-0.5">
            {[0.85, 1.0, 1.15].map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  setPlaybackRate(rate);
                  if (isPlaying) {
                    setTimeout(() => startPlayback(activeSentenceIdx), 40);
                  }
                }}
                className={`rounded px-2.5 py-1 font-mono text-xs tabular-nums transition-colors ${
                  playbackRate === rate
                    ? 'bg-[#1C1917] text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {rate}×
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              const next = !ambientEnabled;
              setAmbientEnabled(next);
              if (!next) {
                ambientAudio.stop();
              } else if (isPlaying) {
                ambientAudio.setVolume(ambientVol);
                ambientAudio.start(chapter.ambientProfile);
              }
            }}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              ambientEnabled
                ? 'border-stone-400 bg-[#F8F5F0] text-stone-900'
                : 'border-stone-300 bg-transparent text-stone-500'
            }`}
          >
            {ambientEnabled ? <Volume2 className="h-3.5 w-3.5 text-[#9A3412]" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span>{ambientEnabled ? 'Acoustic On' : 'Acoustic Off'}</span>
          </button>

          {ambientEnabled && (
            <label className="flex items-center gap-2 text-xs text-stone-600">
              <span className="sr-only">Ambient soundscape volume</span>
              <input
                type="range"
                min={0.05}
                max={0.6}
                step={0.05}
                value={ambientVol}
                onChange={(e) => setAmbientVol(Number(e.target.value))}
                className="w-20 accent-[#9A3412]"
              />
            </label>
          )}
        </div>
      </div>

      {/* Main Transport Bar */}
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChangeChapter(Math.max(0, activeChapterIndex - 1))}
            disabled={activeChapterIndex === 0}
            className="rounded-md border border-stone-300 bg-[#F8F5F0] p-2.5 text-stone-800 hover:bg-stone-200 disabled:opacity-40 transition-colors"
            aria-label="Previous chapter"
          >
            <SkipBack className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex items-center gap-2 rounded-md bg-[#9A3412] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#7C2D12] transition-colors whitespace-nowrap"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            <span>{isPlaying ? 'Pause Guide' : 'Play Audio Guide'}</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeChapter(Math.min(chapters.length - 1, activeChapterIndex + 1))}
            disabled={activeChapterIndex === chapters.length - 1}
            className="rounded-md border border-stone-300 bg-[#F8F5F0] p-2.5 text-stone-800 hover:bg-stone-200 disabled:opacity-40 transition-colors"
            aria-label="Next chapter"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Scrubber */}
        <div className="flex flex-1 items-center gap-3">
          <span className="font-mono text-xs text-stone-600 tabular-nums w-10 text-right">
            {formatTime(elapsedSec)}
          </span>
          <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-stone-300">
            <div
              className="h-full bg-[#9A3412] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-mono text-xs text-stone-600 tabular-nums w-10">
            {formatTime(chapter.durationSec)}
          </span>
        </div>
      </div>

      {/* Chapter Selector & Synchronized Transcript */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chapter List */}
        <div className="lg:col-span-4 space-y-2">
          <p className="text-xs font-semibold tracking-wide text-stone-600 mb-2">
            Chapters ({chapters.length})
          </p>
          {chapters.map((ch, idx) => {
            const active = idx === activeChapterIndex;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onChangeChapter(idx)}
                className={`w-full rounded-md border p-3 text-left transition-colors ${
                  active
                    ? 'border-[#9A3412] bg-[#F8F5F0] text-[#1C1917]'
                    : 'border-stone-300/70 bg-transparent text-stone-700 hover:bg-[#F8F5F0]/70'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-[#9A3412] tabular-nums">
                    Chapter {ch.number}
                  </span>
                  <span className="font-mono text-xs text-stone-500 tabular-nums">
                    {formatTime(ch.durationSec)}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium leading-snug">{ch.title}</p>
              </button>
            );
          })}
        </div>

        {/* Synchronized Readable Transcript */}
        <div className="lg:col-span-8 rounded-md border border-stone-300 bg-[#F8F5F0] p-5">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700">
              <Headphones className="h-3.5 w-3.5 text-[#9A3412]" />
              Synchronized Field Transcript
            </span>
            <span className="text-xs text-stone-500">Click any paragraph to jump</span>
          </div>

          <div className="space-y-4">
            {chapter.script.map((paragraph, idx) => {
              const highlighted = isPlaying && idx === activeSentenceIdx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveSentenceIdx(idx);
                    setElapsedSec(Math.round((idx / chapter.script.length) * chapter.durationSec));
                    if (isPlaying) {
                      startPlayback(idx);
                    }
                  }}
                  className={`block w-full rounded px-3 py-2 text-left text-[15px] leading-relaxed transition-colors ${
                    highlighted
                      ? 'bg-[#9A3412]/10 text-[#1C1917] font-medium'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {paragraph}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
