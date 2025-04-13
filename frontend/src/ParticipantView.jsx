import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ParticipantView.css';
import Timer from './components/Timer';
import ScoreboardView from './components/ScoreboardView';

function ParticipantView({ gameId, playerId }) {
  const [gameState, setGameState] = useState('waiting'); // waiting, countdown, playing, completed
  const [error, setError] = useState('');
  const [players, setPlayers] = useState([]);
  const [completionTime, setCompletionTime] = useState(null);

  useEffect(() => {
    console.log('Starting game state polling for game:', gameId);
    
    const pollGameState = setInterval(async () => {
      try {
        console.log('Polling game state...');
        const response = await axios.get(`/api/games/${gameId}/state`);
        const { state, players: gamePlayers } = response.data;
        console.log('Received game state:', state);
        
        setPlayers(gamePlayers);
        
        // Handle state transitions
        if (state === 'started' && gameState === 'waiting') {
          console.log('Game started, transitioning to countdown');
          setGameState('countdown');
        } else if (state === 'completed' && gameState !== 'completed') {
          console.log('Game completed, showing results');
          setGameState('completed');
        }
      } catch (error) {
        console.error('Error polling game state:', error);
        setError('Failed to connect to game. Please refresh the page.');
      }
    }, 1000);

    return () => {
      console.log('Cleaning up game state polling');
      clearInterval(pollGameState);
    };
  }, [gameId, gameState]);

  const handleCountdownComplete = () => {
    console.log('Countdown complete, starting game');
    setGameState('playing');
  };

  const handleGameComplete = async (time) => {
    try {
      console.log('Submitting completion time:', time);
      await axios.post(`/api/games/${gameId}/complete`, {
        playerId,
        completionTime: Math.round(time * 1000) // Convert to milliseconds
      });
      setCompletionTime(time);
      setGameState('completed');
    } catch (error) {
      console.error('Error completing game:', error);
      setError('Failed to submit completion time. Please try again.');
    }
  };

  return (
    <div className={`participant-view ${gameState}`}>
      <div className="hero-section">
        <div className="hero-content">
          <img src="/faxe-orden.png" alt="Faxe Orden" className="hero-logo" />
          <h1>Faxe Orden</h1>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {gameState === 'waiting' && (
        <div className="waiting-screen">
          <h2>Ready to Fax!</h2>
          <div className="game-info">
            <div className="info-card">
              <span className="label">Your Name</span>
              <span className="value">{playerId}</span>
            </div>
            <div className="info-card">
              <span className="label">Game ID</span>
              <span className="value">{gameId}</span>
            </div>
          </div>
          <div className="status-message">
            <div className="status-icon"></div>
            <span>Waiting for host to start the game...</span>
          </div>
        </div>
      )}

      {gameState === 'countdown' && (
        <div className="countdown-screen">
          <Timer 
            isCountdown={true}
            onCountdownComplete={handleCountdownComplete}
          />
        </div>
      )}

      {gameState === 'playing' && (
        <div className="playing-screen">
          <Timer 
            isCountdown={false}
            onComplete={handleGameComplete}
          />
        </div>
      )}

      {gameState === 'completed' && (
        <div className="completed-screen">
          <h2>Game Complete!</h2>
          <div className="completed-time">
            Your Time: {completionTime ? `${Math.floor(completionTime / 60)}:${(completionTime % 60).toString().padStart(2, '0')}` : '--:--'}
          </div>
          <ScoreboardView 
            players={players}
            isHost={false}
          />
        </div>
      )}
    </div>
  );
}

export default ParticipantView; 