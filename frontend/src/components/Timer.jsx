import React, { useState, useEffect } from 'react';
import './Timer.css';

function Timer({ isCountdown, onCountdownComplete, onComplete }) {
  const [time, setTime] = useState(isCountdown ? 5 : 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    let interval;

    if (isRunning && !isCompleted) {
      interval = setInterval(() => {
        setTime(prevTime => {
          if (isCountdown) {
            if (prevTime <= 1) {
              setIsRunning(false);
              setIsCompleted(true);
              onCountdownComplete();
              return 0;
            }
            return prevTime - 1;
          } else {
            return prevTime + 0.01;
          }
        });
      }, isCountdown ? 1000 : 10);
    }

    return () => clearInterval(interval);
  }, [isRunning, isCompleted, isCountdown, onCountdownComplete]);

  useEffect(() => {
    if (isCountdown) {
      setIsRunning(true);
    }
  }, [isCountdown]);

  const handleComplete = () => {
    setIsRunning(false);
    setIsCompleted(true);
    onComplete(time);
  };

  const formatTime = (timeInSeconds) => {
    if (isCountdown) {
      return Math.ceil(timeInSeconds);
    }
    return timeInSeconds.toFixed(2);
  };

  return (
    <div className="timer">
      {isCountdown ? (
        <div className="countdown">
          <h2>Game starts in</h2>
          <div className="time">{formatTime(time)}</div>
        </div>
      ) : (
        <div className="stopwatch">
          <h2>Time</h2>
          <div className="time">{formatTime(time)}s</div>
          {!isCompleted && (
            <button className="complete-button" onClick={handleComplete}>
              Ferdig Faxet
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Timer; 