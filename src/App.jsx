import { useState, useEffect } from 'react'
import { TextField, Button, Card, CardContent, Typography, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import CloseIcon from '@mui/icons-material/Close'
import './App.css'

function App() {
  const [timers, setTimers] = useState([])
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [draggingTimer, setDraggingTimer] = useState(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [openErrorModal, setOpenErrorModal] = useState(false)

  const addTimer = (e) => {
    e.preventDefault()
    const totalMinutes = (parseInt(hours) || 0) * 60 + (parseInt(minutes) || 0)

    // Error handling: Prevent creating a timer without hours or minutes
    if (totalMinutes <= 0) {
      setOpenErrorModal(true)
      return
    }

    const newTimer = {
      id: Date.now().toString(),
      totalMinutes,
      remainingTime: totalMinutes * 60, // Store remaining time in seconds
      endTime: Date.now() + totalMinutes * 60 * 1000,
      description: `Repair #${timers.length + 1}`,
      position: { x: 0, y: 0 },
      isRunning: false, // Timer state
      isShaking: false, // Shake state
      fadeIn: true, // Add fade-in property
      isEditing: false, // Track if the timer is being edited
      tempDescription: '', // Temporary description for editing
      lastShakeTime: 0, // Track when the timer last shook
    }
    setTimers([...timers, newTimer])
    setHours('')
    setMinutes('')
  }

  const handleCloseErrorModal = () => {
    setOpenErrorModal(false)
  }

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    const seconds = timeInSeconds % 60
    return { hours, minutes, seconds }
  }

  // Update timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => prev.map(timer => {
        if (timer.isRunning) {
          const updatedTime = timer.remainingTime - 1
          if (updatedTime <= 0) {
            return { ...timer, isRunning: false, remainingTime: 0 }
          }
          
          // Enhanced shake logic
          const remainingMinutes = Math.floor(updatedTime / 60)
          const currentTime = Date.now()
          
          // Shake when timer reaches 30 minutes remaining
          if (remainingMinutes === 30 && !timer.isShaking && (currentTime - timer.lastShakeTime > 10000 || timer.lastShakeTime === 0)) {
            return { 
              ...timer, 
              remainingTime: updatedTime, 
              isShaking: true,
              lastShakeTime: currentTime
            }
          }
          
          // Shake every 10 minutes after the 30-minute mark
          if (remainingMinutes < 30 && remainingMinutes % 10 === 0 && remainingMinutes > 0 && 
              updatedTime % 60 === 0 && // Only trigger at the start of a minute
              (currentTime - timer.lastShakeTime > 10000 || timer.lastShakeTime === 0)) {
            return { 
              ...timer, 
              remainingTime: updatedTime, 
              isShaking: true,
              lastShakeTime: currentTime
            }
          }
          
          // Stop shaking after 5 seconds instead of 10
          if (timer.isShaking && (currentTime - timer.lastShakeTime > 5000)) {
            return { 
              ...timer, 
              remainingTime: updatedTime, 
              isShaking: false 
            }
          }
          
          return { ...timer, remainingTime: updatedTime }
        }
        return timer
      }))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleMouseDown = (timer, e) => {
    setDraggingTimer(timer)
    setOffset({
      x: e.clientX - timer.position.x,
      y: e.clientY - timer.position.y
    })
  }

  const handleMouseMove = (e) => {
    if (!draggingTimer) return

    const updatedTimers = timers.map(timer => {
      if (timer.id === draggingTimer.id) {
        return {
          ...timer,
          position: {
            x: e.clientX - offset.x,
            y: e.clientY - offset.y
          }
        }
      }
      return timer
    })

    setTimers(updatedTimers)
  }

  const handleMouseUp = () => {
    setDraggingTimer(null)
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [draggingTimer, offset])

  const handleRename = (id, newName) => {
    setTimers(timers.map(timer => timer.id === id ? { ...timer, description: newName, isEditing: false } : timer))
  }

  const handlePlayPause = (id) => {
    setTimers(timers.map(timer => {
      if (timer.id === id) {
        return { ...timer, isRunning: !timer.isRunning }
      }
      return timer
      
    }))
  }

  const handleDelete = (id) => {
    setTimers(timers.filter(timer => timer.id !== id))
  }

  return (
    <div className="container">
      <h1>Timely</h1>
      
      <form onSubmit={addTimer} className="timer-form">
        <TextField
          type="number"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          label="Hours"
          variant="outlined"
          size="small"
        />
        <TextField
          type="number"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          label="Minutes"
          variant="outlined"
          size="small"
        />
        <Button type="submit" variant="contained" color="primary">Add Timer</Button>
      </form>

      <div className="timers-grid">
        {timers.map((timer) => {
          const { hours, minutes, seconds } = formatTime(timer.remainingTime)
          return (
            <Card
              key={timer.id}
              className={`timer-card ${timer.isShaking ? 'shake' : ''} ${timer.fadeIn ? 'fade-in' : ''}`}
              onMouseDown={(e) => handleMouseDown(timer, e)}
              style={{
                position: 'absolute',
                left: timer.position.x,
                top: timer.position.y,
                transition: 'transform 0.2s ease'
              }}
            >
              <CardContent style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {timer.isEditing ? (
                    <input
                      value={timer.tempDescription}
                      onChange={(e) => setTimers(timers.map(t => t.id === timer.id ? { ...t, tempDescription: e.target.value } : t))}
                      onBlur={() => handleRename(timer.id, timer.tempDescription)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRename(timer.id, timer.tempDescription);
                        }
                      }}
                      autoFocus
                      style={{
                        border: 'none',
                        background: 'transparent',
                        fontSize: '1.5em',
                        flexGrow: 1,
                        outline: 'none',
                        color: 'black',
                      }}
                    />
                  ) : (
                    <>
                      <Typography variant="h6" style={{ flexGrow: 1 }}>{timer.description}</Typography>
                      <IconButton onClick={() => setTimers(timers.map(t => t.id === timer.id ? { ...t, isEditing: true, tempDescription: timer.description } : t))}>
                        <EditIcon />
                      </IconButton>
                    </>
                  )}
                  <IconButton 
                    onClick={() => handleDelete(timer.id)} 
                    style={{ 
                      position: 'absolute',
                      top: 5,
                      right: 5,
                      padding: 0 
                    }}
                  >
                    <CloseIcon style={{ color: '#34495E', fontSize: '20px' }} />
                  </IconButton>
                </div>
                <div className="timer-display">
                  <div className="time-box">
                    <Typography variant="h4">{hours}</Typography>
                    <Typography variant="body2">Hours</Typography>
                  </div>
                  <div className="time-box">
                    <Typography variant="h4">{minutes}</Typography>
                    <Typography variant="body2">Minutes</Typography>
                  </div>
                  <div className="time-box">
                    <Typography variant="h4">{seconds}</Typography>
                    <Typography variant="body2">Seconds</Typography>
                  </div>
                </div>
                <div className="button-group">
                  <Button onClick={() => handlePlayPause(timer.id)} variant="outlined">
                    {timer.isRunning ? 'Pause' : 'Play'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Custom Error Modal */}
      <Dialog open={openErrorModal} onClose={handleCloseErrorModal}>
        <DialogTitle>Error</DialogTitle>
        <DialogContent>
          <Typography>Please set either hours or minutes to create a timer.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseErrorModal} color="primary">Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default App
