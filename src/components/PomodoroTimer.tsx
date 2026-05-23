
import React, { useState, useEffect } from 'react';
import { Play, Pause, RefreshCw, Settings, X } from 'lucide-react';
import { t } from '../lib/i18n';
import { useStudio } from '../context/StudioContext';

export function PomodoroTimer() {
  const { language } = useStudio();
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('inkwell-pomodoro-settings');
    return saved ? JSON.parse(saved) : { work: 25, break: 5 };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [timeLeft, setTimeLeft] = useState(settings.work * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    localStorage.setItem('inkwell-pomodoro-settings', JSON.stringify(settings));
    setTimeLeft(mode === 'work' ? settings.work * 60 : settings.break * 60);
  }, [settings, mode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setMode(mode === 'work' ? 'break' : 'work');
      setTimeLeft(mode === 'work' ? settings.break * 60 : settings.work * 60);
      setIsActive(false);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, settings]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? settings.work * 60 : settings.break * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <>
      <div className="flex items-center gap-2 bg-zinc-200 dark:bg-zinc-800 rounded px-2 py-0.5 text-xs">
          <span className="font-bold text-zinc-600 dark:text-zinc-300">{mode === 'work' ? t(language, 'work') : t(language, 'break')}</span>
          <span className="font-mono">{formatTime(timeLeft)}</span>
          <button onClick={toggleTimer} className="hover:text-indigo-500">
              {isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>
          <button onClick={resetTimer} className="hover:text-indigo-500">
              <RefreshCw className="w-3 h-3" />
          </button>
          <button onClick={() => setShowSettings(true)} className="hover:text-indigo-500">
              <Settings className="w-3 h-3" />
          </button>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Pomodoro Settings</h3>
                <button onClick={() => setShowSettings(false)}><X /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs">Work (mins)</label>
                <input type="number" className="w-full bg-zinc-100 dark:bg-zinc-800 p-2 rounded" value={settings.work} onChange={e => setSettings({...settings, work: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="text-xs">Break (mins)</label>
                <input type="number" className="w-full bg-zinc-100 dark:bg-zinc-800 p-2 rounded" value={settings.break} onChange={e => setSettings({...settings, break: parseInt(e.target.value)})} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
