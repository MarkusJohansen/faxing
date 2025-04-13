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
    const pollGameState = setInterval(async () => {
      try {
        const response = await axios.get(`/api/games/${gameId}/state`);
        const { state, players: gamePlayers } = response.data;
        setPlayers(gamePlayers);
        
        if (state === 'started' && gameState === 'waiting') {
          setGameState('countdown');
        }
      } catch (error) {
        console.error('Error polling game state:', error);
      }
    }, 1000);

    return () => clearInterval(pollGameState);
  }, [gameId, gameState]);

  const handleCountdownComplete = () => {
    setGameState('playing');
  };

  const handleGameComplete = async (time) => {
    try {
      await axios.post(`/api/games/${gameId}/complete`, {
        playerId,
        completionTime: Math.round(time * 1000) // Convert to milliseconds
      });
      setCompletionTime(time);
      setGameState('completed');
    } catch (error) {
      setError('Failed to submit completion time. Please try again.');
      console.error('Error completing game:', error);
    }
  };

  return (
    <div className={`participant-view ${gameState}`}>
      <img src="/faxe-orden.png" alt="Faxe" className="faxe-image" />
      <h1>Faxe Orden</h1>

      {error && <div className="error-message">{error}</div>}

      {gameState === 'waiting' && (
        <div className="waiting-screen">
          <h2>Waiting for host to start the game...</h2>
          <div className="game-info">
            <p>Game ID: {gameId}</p>
            <div className="players-list">
              <h3>Players:</h3>
              {players.map((player, index) => (
                <div key={index} className="player">
                  {player.name}
                </div>
              ))}
            </div>
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
          <ScoreboardView
            players={players}
            currentPlayerId={playerId}
            isHost={false}
          />
        </div>
      )}
    </div>
  );
}

export default ParticipantView; 