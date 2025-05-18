"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Clock, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Space } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { playSound, preloadSounds, cleanupSounds, initAudio } from "@/utils/sounds"
import { VolumeControl } from "@/components/volume-control"

interface Props {
  playerName: string
  onGameOver: (score: number) => void
}

type TetrominoType = "I" | "J" | "L" | "O" | "S" | "T" | "Z"

// Define tetromino shapes and colors
const TETROMINOES: Record<TetrominoType, { shape: number[][]; color: string }> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: "bg-cyan-500",
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "bg-blue-600",
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "bg-orange-500",
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: "bg-yellow-500",
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: "bg-green-500",
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: "bg-purple-600",
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: "bg-red-500",
  },
}

const keys = Object.keys(TETROMINOES) as TetrominoType[]
// Game constants
const ROWS = 20
const COLS = 10
const INITIAL_TIME = 120 // 2 minutes
const BLOCK_SIZE = 25

export default function TetrisGame({ playerName, onGameOver}: Props) {
  const [gameBoard, setGameBoard] = useState(createEmptyBoard())
  const [currentPiece, setCurrentPiece] = useState(null)
  const [nextPiece, setNextPiece] = useState(null)
  const [heldPiece, setHeldPiece] = useState(null)
  const [canHold, setCanHold] = useState(true)
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(453)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME)
  const [gameStarted, setGameStarted] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [speed, setSpeed] = useState(2) // 1-5 speed scale
  const [ghostPiece, setGhostPiece] = useState(null)

  const requestRef = useRef(null)
  const lastUpdateTimeRef = useRef(0)
  const lastFallTimeRef = useRef(0)
  const fallIntervalRef = useRef(500) // How often the piece moves down automatically
  const gameContainerRef = useRef(null)

  // Create an empty game board
  function createEmptyBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  }

  // Generate a random tetromino
  const randomTetromino = useCallback(() => {
    const keys = Object.keys(TETROMINOES) as TetrominoType[]
    const tetromino = keys[Math.floor(Math.random() * keys.length)]

    return {
      type: tetromino,
      shape: [...TETROMINOES[tetromino].shape],
      color: TETROMINOES[tetromino].color,
      position: { x: Math.floor(COLS / 2) - 1, y: 0 },
    }
  }, [])

  // Start the game
  const startGame = useCallback(() => {
    // Initialize audio on user interaction
    initAudio()

    setGameBoard(createEmptyBoard())
    const newPiece = randomTetromino()
    setCurrentPiece(newPiece)
    setNextPiece(randomTetromino())
    setHeldPiece(null)
    setCanHold(true)
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
    setTimeLeft(INITIAL_TIME)
    setGameStarted(true)
    lastUpdateTimeRef.current = 0
    lastFallTimeRef.current = 0
    fallIntervalRef.current = 500 / speed

    // Play start sound
    playSound("start", isMuted)

    // Focus the game container to enable keyboard controls
    if (gameContainerRef.current) {
      gameContainerRef.current.focus()
    }
  }, [randomTetromino, isMuted, speed])

  // Check if the move is valid
  const isValidMove = useCallback((piece, boardState, offsetX = 0, offsetY = 0) => {
    if (!piece) return false

    return piece.shape.every((row, y) => {
      return row.every((value, x) => {
        const newX = piece.position.x + x + offsetX
        const newY = piece.position.y + y + offsetY

        // Check if the position is within bounds and not colliding with existing blocks
        return (
          value === 0 || // Empty cell in the tetromino
          (newX >= 0 && newX < COLS && newY < ROWS && (newY < 0 || boardState[newY][newX] === 0))
        )
      })
    })
  }, [])

  // Calculate ghost piece position
  const updateGhostPiece = useCallback(
    (piece, board) => {
      if (!piece) {
        setGhostPiece(null)
        return
      }

      let dropDistance = 0
      while (isValidMove(piece, board, 0, dropDistance + 1)) {
        dropDistance++
      }

      setGhostPiece({
        ...piece,
        position: {
          ...piece.position,
          y: piece.position.y + dropDistance,
        },
      })
    },
    [isValidMove],
  )

  // Rotate the current piece
  const rotatePiece = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return

    const rotated = {
      ...currentPiece,
      shape: currentPiece.shape[0].map((_, index) => currentPiece.shape.map((row) => row[index]).reverse()),
    }

    // Try normal rotation
    if (isValidMove(rotated, gameBoard)) {
      setCurrentPiece(rotated)
      updateGhostPiece(rotated, gameBoard)
      playSound("rotate", isMuted)
      return
    }

    // Wall kick - try to adjust position if rotation is blocked by walls
    // Try moving left
    if (isValidMove(rotated, gameBoard, -1, 0)) {
      rotated.position.x -= 1
      setCurrentPiece(rotated)
      updateGhostPiece(rotated, gameBoard)
      playSound("rotate", isMuted)
      return
    }

    // Try moving right
    if (isValidMove(rotated, gameBoard, 1, 0)) {
      rotated.position.x += 1
      setCurrentPiece(rotated)
      updateGhostPiece(rotated, gameBoard)
      playSound("rotate", isMuted)
      return
    }

    // Try moving up (for I piece sometimes)
    if (isValidMove(rotated, gameBoard, 0, -1)) {
      rotated.position.y -= 1
      setCurrentPiece(rotated)
      updateGhostPiece(rotated, gameBoard)
      playSound("rotate", isMuted)
      return
    }
  }, [currentPiece, gameBoard, isPaused, gameOver, isValidMove, updateGhostPiece, isMuted])

  // Move the current piece
  const movePiece = useCallback(
    (direction) => {
      if (!currentPiece || isPaused || gameOver) return false

      const offsetX = direction === "left" ? -1 : direction === "right" ? 1 : 0
      const offsetY = direction === "down" ? 1 : 0

      if (isValidMove(currentPiece, gameBoard, offsetX, offsetY)) {
        const newPiece = {
          ...currentPiece,
          position: {
            x: currentPiece.position.x + offsetX,
            y: currentPiece.position.y + offsetY,
          },
        }
        setCurrentPiece(newPiece)
        updateGhostPiece(newPiece, gameBoard)

        // Play move sound for horizontal movement
        if (offsetX !== 0 && offsetY === 0) {
          playSound("move", isMuted)
        }

        return true
      }

      // If we can't move down, lock the piece
      if (direction === "down") {
        lockPiece()
        return false
      }

      return false
    },
    [currentPiece, gameBoard, isPaused, gameOver, isValidMove, updateGhostPiece, isMuted],
  )

  // Hard drop the current piece
  const hardDrop = useCallback(() => {
    if (!currentPiece || isPaused || gameOver) return

    let dropDistance = 0
    while (isValidMove(currentPiece, gameBoard, 0, dropDistance + 1)) {
      dropDistance++
    }

    setCurrentPiece({
      ...currentPiece,
      position: {
        ...currentPiece.position,
        y: currentPiece.position.y + dropDistance,
      },
    })

    playSound("drop", isMuted)
    lockPiece()
  }, [currentPiece, gameBoard, isPaused, gameOver, isValidMove, isMuted])

  // Lock the current piece to the board
  const lockPiece = useCallback(() => {
    if (!currentPiece) return

    // Create a new board with the current piece locked in place
    const newBoard = [...gameBoard]
    currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const boardY = currentPiece.position.y + y
          const boardX = currentPiece.position.x + x

          if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
            newBoard[boardY][boardX] = currentPiece.color
          }
        }
      })
    })

    setGameBoard(newBoard)

    // Check for completed rows
    const completedRows = checkCompletedRows(newBoard)
    if (completedRows.length > 0) {
      const updatedBoard = clearRows(newBoard, completedRows)
      setGameBoard(updatedBoard)
      updateScore(completedRows.length)

      // Play line clear sound
      if (completedRows.length === 4) {
        playSound("clearTetris", isMuted)
      } else {
        playSound("clearLine", isMuted)
      }
    }

    // Set the next piece as the current piece
    const newPiece = nextPiece
    setCurrentPiece(newPiece)
    setNextPiece(randomTetromino())
    setCanHold(true)

    // Update ghost piece for new current piece
    updateGhostPiece(newPiece, newBoard)

    // Check for game over
    if (newPiece && !isValidMove(newPiece, newBoard)) {
      setGameOver(true)
      playSound("gameOver", isMuted)

      onGameOver(score)
    }
  }, [currentPiece, gameBoard, nextPiece, randomTetromino, isValidMove, updateGhostPiece, isMuted, score, onGameOver])

  // Hold the current piece
  const holdPiece = useCallback(() => {
    if (!currentPiece || !canHold || isPaused || gameOver) return

    if (heldPiece) {
      // Swap current piece with held piece
      const temp = {
        ...heldPiece,
        position: { x: Math.floor(COLS / 2) - 1, y: 0 },
      }
      setHeldPiece({
        type: currentPiece.type,
        shape: TETROMINOES[currentPiece.type].shape,
        color: currentPiece.color,
      })
      setCurrentPiece(temp)
      updateGhostPiece(temp, gameBoard)
    } else {
      // Hold current piece and get next piece
      setHeldPiece({
        type: currentPiece.type,
        shape: TETROMINOES[currentPiece.type].shape,
        color: currentPiece.color,
      })
      const newPiece = nextPiece
      setCurrentPiece(newPiece)
      setNextPiece(randomTetromino())
      updateGhostPiece(newPiece, gameBoard)
    }

    setCanHold(false)
    playSound("hold", isMuted)
  }, [
    currentPiece,
    heldPiece,
    nextPiece,
    canHold,
    isPaused,
    gameOver,
    randomTetromino,
    updateGhostPiece,
    gameBoard,
    isMuted,
  ])

  // Check for completed rows
  const checkCompletedRows = useCallback((board) => {
    return board.reduce((completedRows, row, index) => {
      if (row.every((cell) => cell !== 0)) {
        completedRows.push(index)
      }
      return completedRows
    }, [])
  }, [])

  // Clear completed rows
  const clearRows = useCallback((board, rowsToClear) => {
    const newBoard = [...board]

    rowsToClear.forEach((rowIndex) => {
      // Remove the completed row
      newBoard.splice(rowIndex, 1)
      // Add a new empty row at the top
      newBoard.unshift(Array(COLS).fill(0))
    })

    return newBoard
  }, [])

  // Update the score
  const updateScore = useCallback(
    (clearedRows) => {
      const points = [0, 100, 300, 500, 800][clearedRows] // Points based on number of rows cleared
      setScore((prevScore) => {
        const newScore = prevScore + points
        if (newScore > highScore) {
          setHighScore(newScore)
        }
        return newScore
      })
    },
    [highScore],
  )

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent default behavior for game controls to avoid scrolling
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) {
        e.preventDefault()
      }

      // Initialize audio on first interaction if needed
      if (!gameStarted && !gameOver && (e.key === "Enter" || e.key === " ")) {
        startGame()
        return
      }

      if (!gameStarted || gameOver) return

      if (isPaused) {
        if (e.key === "p" || e.key === "P" || e.key === "Escape") {
          setIsPaused(false)
        }
        return
      }

      switch (e.key) {
        case "ArrowLeft":
          movePiece("left")
          break
        case "ArrowRight":
          movePiece("right")
          break
        case "ArrowDown":
          movePiece("down")
          break
        case "ArrowUp":
          rotatePiece()
          break
        case " ":
          hardDrop()
          break
        case "c":
        case "C":
          holdPiece()
          break
        case "p":
        case "P":
        case "Escape":
          setIsPaused(true)
          break
        case "m":
        case "M":
          setIsMuted((prev) => !prev)
          break
        default:
          break
      }
    }

    // Add the event listener to the window
    window.addEventListener("keydown", handleKeyDown)

    // Make sure to remove the event listener when the component unmounts
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [gameStarted, gameOver, isPaused, movePiece, rotatePiece, hardDrop, holdPiece, startGame, setIsMuted])

  // Game loop
  const gameLoop = useCallback(
    (timestamp) => {
      if (!gameStarted || gameOver || isPaused) {
        requestRef.current = requestAnimationFrame(gameLoop)
        return
      }

      // Update timer once per second
      if (timestamp - lastUpdateTimeRef.current >= 1000) {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            setGameOver(true)
            return 0
          }
          return prev - 1
        })
        lastUpdateTimeRef.current = timestamp
      }

      // Move the current piece down automatically at regular intervals
      if (currentPiece && timestamp - lastFallTimeRef.current >= fallIntervalRef.current) {
        movePiece("down")
        lastFallTimeRef.current = timestamp
      }

      requestRef.current = requestAnimationFrame(gameLoop)
    },
    [gameStarted, gameOver, isPaused, currentPiece, movePiece],
  )

  // Start game loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [gameLoop])

  // Update intervals when speed changes
  useEffect(() => {
    fallIntervalRef.current = 500 / speed
  }, [speed])

  // Initialize audio
  useEffect(() => {
    preloadSounds()
    return () => {
      cleanupSounds()
    }
  }, [])

  // Render the game board with current piece and ghost piece
  const renderBoard = () => {
    // Create a copy of the game board
    const boardWithPieces = gameBoard.map((row) => [...row])

    // Add ghost piece to the board
    if (ghostPiece && currentPiece) {
      ghostPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const boardY = ghostPiece.position.y + y
            const boardX = ghostPiece.position.x + x

            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS && boardWithPieces[boardY][boardX] === 0) {
              // Use a lighter version of the color for ghost piece
              boardWithPieces[boardY][boardX] = ghostPiece.color.replace("bg-", "bg-opacity-30 bg-")
            }
          }
        })
      })
    }

    // Add current piece to the board
    if (currentPiece) {
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            const boardY = currentPiece.position.y + y
            const boardX = currentPiece.position.x + x

            if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
              boardWithPieces[boardY][boardX] = currentPiece.color
            }
          }
        })
      })
    }

    return (
      <div className="grid grid-cols-10 gap-[1px] bg-gray-800 p-[1px]">
        {boardWithPieces.map((row, y) =>
          row.map((cell, x) => (
            <div key={`${y}-${x}`} className={cn("w-[25px] h-[25px]", cell ? cell : "bg-gray-900")} />
          )),
        )}
      </div>
    )
  }

  // Render a piece preview (for next and hold)
  const renderPiecePreview = (piece, size = 4) => {
    if (!piece)
      return (
        <div className="grid grid-cols-4 gap-[1px] bg-gray-800 p-[1px]">
          {Array.from({ length: size * size }).map((_, i) => (
            <div key={i} className="w-[15px] h-[15px] bg-gray-900" />
          ))}
        </div>
      )

    const previewGrid = Array.from({ length: size }, () => Array(size).fill(0))

    // Center the piece in the preview
    const offsetX = Math.floor((size - piece.shape[0].length) / 2)
    const offsetY = Math.floor((size - piece.shape.length) / 2)

    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          previewGrid[y + offsetY][x + offsetX] = piece.color
        }
      })
    })

    return (
      <div className="grid grid-cols-4 gap-[1px] bg-gray-800 p-[1px]">
        {previewGrid.flat().map((cell, i) => (
          <div key={i} className={cn("w-[15px] h-[15px]", cell ? cell : "bg-gray-900")} />
        ))}
      </div>
    )
  }

  // Render control buttons for mobile
  const renderControlButtons = () => {
    return (
      <div className="mt-4 grid grid-cols-3 gap-2 max-w-[250px]">
        <div></div>
        <Button
          onClick={() => rotatePiece()}
          variant="outline"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 border-none"
          aria-label="Rotate"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
        <div></div>

        <Button
          onClick={() => movePiece("left")}
          variant="outline"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 border-none"
          aria-label="Move Left"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => movePiece("down")}
          variant="outline"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 border-none"
          aria-label="Move Down"
        >
          <ArrowDown className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => movePiece("right")}
          variant="outline"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 border-none"
          aria-label="Move Right"
        >
          <ArrowRight className="h-5 w-5" />
        </Button>

        <Button
          onClick={() => holdPiece()}
          variant="outline"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 border-none"
          aria-label="Hold Piece"
        >
          Hold
        </Button>
        <Button
          onClick={() => hardDrop()}
          variant="outline"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 border-none"
          aria-label="Hard Drop"
        >
          <Space className="h-5 w-5" />
        </Button>
        <Button
          onClick={() => setIsPaused((prev) => !prev)}
          variant="outline"
          size="sm"
          className="bg-gray-700 hover:bg-gray-600 border-none"
          aria-label="Pause/Resume"
        >
          {isPaused ? "Resume" : "Pause"}
        </Button>
      </div>
    )
  }

  useEffect(() => {
    if (currentPiece) {
      updateGhostPiece(currentPiece, gameBoard)
    }
  }, [currentPiece, gameBoard, updateGhostPiece])

  return (
    <div className="flex flex-col items-center" tabIndex={0} onFocus={() => {}} onBlur={() => {}}>
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-6 w-6 text-yellow-400" />
        <h1 className="text-3xl font-bold text-yellow-400">Ultra</h1>
      </div>

      {!gameStarted ? (
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl font-bold text-white">NeoTrix</h2>

          <div className="flex flex-col items-center gap-2 mb-4">
            <label htmlFor="speed-slider" className="text-white">
              Speed: {speed}x
            </label>
            <input
              id="speed-slider"
              type="range"
              min="1"
              max="5"
              step="1"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-48"
            />
          </div>

          <Button onClick={startGame} className="bg-yellow-500 hover:bg-yellow-600">
            Start Game
          </Button>

          <p className="text-gray-400 text-sm mt-2 text-center max-w-md">
            Click Start Game to enable sound. Sound requires user interaction and may not work in all environments.
          </p>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Hold piece */}
          <div className="flex flex-col items-center bg-gray-900 rounded-lg p-3 shadow-lg">
            <h3 className="text-white font-bold mb-2">HOLD</h3>
            {renderPiecePreview(heldPiece)}
          </div>

          {/* Main game board */}
          <div
            ref={gameContainerRef}
            className="flex flex-col items-center outline-none focus:ring-2 focus:ring-yellow-400 rounded-lg p-2"
            tabIndex={0}
            onFocus={() => {}}
            onBlur={() => {}}
            aria-label="Tetris game board. Use arrow keys to move, up arrow to rotate, space to drop."
          >
            {renderBoard()}

            {/* Timer */}
            <div className="mt-2 text-xl font-bold text-white">TIME: {timeLeft}</div>

            {/* Mobile controls */}
            {renderControlButtons()}

            {/* Game over overlay */}
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70">
                <h2 className="text-2xl font-bold text-white mb-4">Game Over</h2>
                <Button onClick={startGame} className="bg-yellow-500 hover:bg-yellow-600">
                  Play Again
                </Button>
              </div>
            )}
          </div>

          {/* Next piece and score */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center bg-gray-900 rounded-lg p-3 shadow-lg">
              <h3 className="text-white font-bold mb-2">NEXT</h3>
              {renderPiecePreview(nextPiece)}
            </div>

            <div className="flex flex-col items-center bg-gray-900 rounded-lg p-3 shadow-lg">
              <h3 className="text-yellow-500 font-bold mb-2">HIGH SCORE</h3>
              <p className="text-white font-bold">{highScore}</p>

              <h3 className="text-white font-bold mt-4 mb-2">SCORE</h3>
              <p className="text-white font-bold">{score}</p>
            </div>
          </div>
        </div>
      )}

      {/* Sound controls */}
      <div className="mt-4">
        <VolumeControl isMuted={isMuted} onToggle={() => setIsMuted((prev) => !prev)} />
      </div>

      {/* Controls info */}
      <div className="mt-6 text-white text-sm text-center max-w-md">
        <p>
          <strong>Controls:</strong> Arrow keys to move, Up to rotate, Space to hard drop, C to hold
        </p>
        <p className="mt-2 text-yellow-300">
          <strong>Note:</strong> Click on the game area to enable keyboard controls
        </p>
      </div>
    </div>
  )
}
