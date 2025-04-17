import './App.css'

import { useEffect, useState } from 'react'

import { gameData } from './assets/gameData.js'

function App() {
  // Check for dev mode in URL
  const isDevMode = new URLSearchParams(window.location.search).get('dev') === 'true';

  const [gameState, setGameState] = useState('setup') // setup, playing, roundEnd, gameEnd
  const [teams, setTeams] = useState([
    { name: 'Team 1', score: 0, turns: 0 },
    { name: 'Team 2', score: 0, turns: 0 }
  ])
  const [currentTeam, setCurrentTeam] = useState(0)
  const [currentRound, setCurrentRound] = useState(1)
  const [totalRounds, setTotalRounds] = useState(5)
  const [timeLeft, setTimeLeft] = useState(60)
  const [timerDuration, setTimerDuration] = useState(60) // Default 60 seconds
  const [timerInputValue, setTimerInputValue] = useState('60') // String value for the input
  const [timerActive, setTimerActive] = useState(false)
  const [gameCards, setGameCards] = useState([...gameData])
  const [currentCard, setCurrentCard] = useState(null)
  const [totalCardsPlayed, setTotalCardsPlayed] = useState(0)

  // Handle team name change
  const handleTeamNameChange = (index, newName) => {
    const updatedTeams = [...teams]
    updatedTeams[index] = { ...updatedTeams[index], name: newName }
    setTeams(updatedTeams)
  }

  // Handle total rounds change
  const handleRoundsChange = (newRounds) => {
    setTotalRounds(Math.max(1, parseInt(newRounds) || 1))
  }

  // Handle timer duration input change
  const handleTimerInputChange = (value) => {
    // Allow the user to type freely, just store the raw input
    setTimerInputValue(value)
    
    // Only update the actual timer duration if it's a valid number
    if (!isNaN(value) && value.trim() !== '') {
      const duration = parseInt(value)
      // Only apply limits when actually starting the game
      if (duration > 0) {
        setTimerDuration(duration)
      }
    }
  }

  // Force end the current turn (for dev mode)
  const forceEndTurn = () => {
    setTimeLeft(0);
  }

  // Start the game
  const startGame = () => {
    // Final validation of timer duration before starting
    let finalDuration = parseInt(timerInputValue) || 60
    
    // Apply min/max only when starting the game
    finalDuration = Math.min(Math.max(10, finalDuration), 300)
    setTimerDuration(finalDuration)
    
    setGameState('playing')
    setCurrentTeam(0)
    setCurrentRound(1)
    setTotalCardsPlayed(0)
    // Shuffle the game cards at the start
    setGameCards([...gameData].sort(() => Math.random() - 0.5))
    startTurn()
  }

  // Start a team's turn
  const startTurn = () => {
    setTimeLeft(timerDuration) // Use the custom timer duration
    setTimerActive(true)
    drawCard()
  }

  // Draw a new card
  const drawCard = () => {
    if (gameCards.length > 0) {
      const randomIndex = Math.floor(Math.random() * gameCards.length)
      setCurrentCard(gameCards[randomIndex])
    } else {
      setGameState('gameEnd')
    }
  }

  // Handle card action (1 or 3 points)
  const handleCardAction = (points) => {
    // Add points to current team
    const updatedTeams = [...teams]
    updatedTeams[currentTeam] = { 
      ...updatedTeams[currentTeam], 
      score: updatedTeams[currentTeam].score + points 
    }
    setTeams(updatedTeams)

    // Remove current card from deck
    if (currentCard) {
      setGameCards(gameCards.filter(card => 
        card["1"] !== currentCard["1"] || card["3"] !== currentCard["3"]))
      setTotalCardsPlayed(totalCardsPlayed + 1)
    }
    
    // Draw a new card
    drawCard()
  }

  // End current turn
  const endTurn = () => {
    setTimerActive(false)
    
    // Update turns for current team
    const updatedTeams = [...teams]
    updatedTeams[currentTeam] = { 
      ...updatedTeams[currentTeam], 
      turns: updatedTeams[currentTeam].turns + 1 
    }
    setTeams(updatedTeams)
    
    setGameState('roundEnd')
  }

  // Start next team's turn
  const nextTeamTurn = () => {
    const nextTeam = (currentTeam + 1) % 2
    setCurrentTeam(nextTeam)
    
    // Check if we've completed a round
    if (nextTeam === 0) {
      const newRound = currentRound + 1
      if (newRound > totalRounds) {
        setGameState('gameEnd')
        return
      }
      setCurrentRound(newRound)
    }
    
    setGameState('playing')
    startTurn()
  }

  // Reset the game
  const resetGame = () => {
    setTeams([
      { name: 'Team 1', score: 0, turns: 0 },
      { name: 'Team 2', score: 0, turns: 0 }
    ])
    setCurrentTeam(0)
    setCurrentRound(1)
    setTotalCardsPlayed(0)
    setGameCards([...gameData].sort(() => Math.random() - 0.5))
    setGameState('setup')
  }

  // Timer effect
  useEffect(() => {
    let timer
    if (timerActive && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1)
      }, 1000)
    } else if (timerActive && timeLeft === 0) {
      endTurn()
    }
    
    return () => clearTimeout(timer)
  }, [timerActive, timeLeft])

  // Format time as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  return (
    <div className="app-container">
      {gameState === 'setup' && (
        <div className="setup-screen">
          <h1>Poetry for Neanderthals</h1>
          
          <div className="team-setup">
            <h2>Team Setup</h2>
            {teams.map((team, index) => (
              <div key={index} className="team-input">
                <label>Team {index + 1} Name:</label>
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => handleTeamNameChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>
          
          <div className="game-settings">
            <h2>Game Settings</h2>
            <div className="rounds-input">
              <label>Number of Rounds:</label>
              <input
                type="number"
                min="1"
                value={totalRounds}
                onChange={(e) => handleRoundsChange(e.target.value)}
              />
            </div>
            
            <div className="timer-input">
              <label>Timer Duration (seconds):</label>
              <input
                type="text"
                value={timerInputValue}
                onChange={(e) => handleTimerInputChange(e.target.value)}
                placeholder="Enter seconds (10-300)"
              />
            </div>
            
            <div className="timer-preview">
              {!isNaN(timerInputValue) && timerInputValue.trim() !== '' && parseInt(timerInputValue) > 0
                ? `Round timer will be: ${formatTime(parseInt(timerInputValue))}`
                : "Please enter a valid time in seconds"
              }
            </div>
          </div>
          
          <button 
            className="start-button" 
            onClick={startGame}
            disabled={isNaN(timerInputValue) || timerInputValue.trim() === '' || parseInt(timerInputValue) <= 0}
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-screen">
          <div className="game-header">
            <div className="team-info">
              <h2>{teams[currentTeam].name}'s Turn</h2>
              <div className="scores">
                {teams.map((team, index) => (
                  <div key={index} className={`team-score ${index === currentTeam ? 'active' : ''}`}>
                    {team.name}: {team.score}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="game-status">
              <div className={`timer ${timeLeft <= 10 ? 'warning' : ''}`}>
                Time: {formatTime(timeLeft)}
              </div>
              <div className="round-info">Round: {currentRound}/{totalRounds}</div>
              <div className="cards-info">Cards: {gameCards.length}/{gameData.length}</div>
            </div>
          </div>
          
          {currentCard && (
            <div className="card-container">
              <div 
                className="card-half top-half" 
                onClick={() => handleCardAction(1)}
              >
                <div className="point-value">1</div>
                <div className="word">{currentCard["1"]}</div>
              </div>
              
              <div className="card-divider"></div>
              
              <div 
                className="card-half bottom-half" 
                onClick={() => handleCardAction(3)}
              >
                <div className="word">{currentCard["3"]}</div>
                <div className="point-value">3</div>
              </div>
            </div>
          )}
          
          <div className="game-buttons">
            <button className="penalty-button" onClick={() => handleCardAction(-1)}>
              Skip / Penalty (-1 point)
            </button>
            
            {isDevMode && (
              <button className="dev-button end-turn-dev-button" onClick={forceEndTurn}>
                End Turn (Dev)
              </button>
            )}
          </div>
        </div>
      )}

      {gameState === 'roundEnd' && (
        <div className="round-end-screen">
          <h2>Time's Up!</h2>
          <div className="round-summary">
            <h3>{teams[currentTeam].name}'s turn is over</h3>
            <p>Round {currentRound}</p>
            <p>Current Score: {teams[currentTeam].score}</p>
            <p>Cards remaining: {gameCards.length}</p>
          </div>
          
          <button className="next-turn-button" onClick={nextTeamTurn}>
            {currentTeam === 1 && currentRound === totalRounds 
              ? "See Final Results" 
              : `Start ${teams[(currentTeam + 1) % 2].name}'s Turn`}
          </button>
        </div>
      )}

      {gameState === 'gameEnd' && (
        <div className="game-end-screen">
          <h2>Game Over!</h2>
          
          <div className="final-scores">
            <h3>Final Scores</h3>
            {teams.map((team, index) => (
              <div key={index} className={`team-final-score ${
                teams[0].score !== teams[1].score && 
                ((teams[0].score > teams[1].score && index === 0) || 
                (teams[0].score < teams[1].score && index === 1)) 
                  ? 'winner' : ''
              }`}>
                {team.name}: {team.score} points
              </div>
            ))}
            <p className="game-stats">
              Total cards played: {totalCardsPlayed} of {gameData.length}
            </p>
          </div>
          
          <button className="play-again-button" onClick={resetGame}>
            Play Again
          </button>
        </div>
      )}
      
      {isDevMode && (
        <div className="dev-indicator">Dev Mode</div>
      )}
    </div>
  )
}

export default App
