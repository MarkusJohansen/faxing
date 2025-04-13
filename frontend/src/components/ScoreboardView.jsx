import React from 'react';
import './ScoreboardView.css';

function ScoreboardView({ players, currentPlayerId, isHost }) {
  // Sort players by completion time
  const sortedPlayers = [...players].sort((a, b) => {
    if (!a.completionTime) return 1;
    if (!b.completionTime) return -1;
    return a.completionTime - b.completionTime;
  });

  // Find current player's position
  const currentPlayerPosition = sortedPlayers.findIndex(p => p.id === currentPlayerId) + 1;
  const currentPlayer = sortedPlayers.find(p => p.id === currentPlayerId);

  return (
    <div className="scoreboard-view">
      {!isHost && currentPlayer && currentPlayer.completionTime && (
        <div className="player-result">
          <h2>Din Faxe-tid</h2>
          <div className="player-stats">
            <div className="position">#{currentPlayerPosition}</div>
            <div className="name">{currentPlayer.name}</div>
            <div className="time">{(currentPlayer.completionTime / 1000).toFixed(2)}s</div>
          </div>
        </div>
      )}

      <div className="scoreboard">
        <h2>Scoreboard</h2>
        <div className="scoreboard-header">
          <span className="position-header">Pos</span>
          <span className="name-header">Navn</span>
          <span className="time-header">Tid</span>
        </div>
        <div className="player-list">
          {sortedPlayers.map((player, index) => (
            <div 
              key={player.id} 
              className={`player-row ${player.id === currentPlayerId ? 'current-player' : ''}`}
            >
              <span className="position">#{index + 1}</span>
              <span className="name">{player.name}</span>
              <span className="time">
                {player.completionTime 
                  ? `${(player.completionTime / 1000).toFixed(2)}s`
                  : 'Faxer fortsatt...'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="host-controls">
          <button className="reset-game-button" onClick={() => window.location.reload()}>
            Reset Game
          </button>
        </div>
      )}
    </div>
  );
}

export default ScoreboardView; 