import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { connectSocket, disconnectSocket } from '../../services/socket';
import './Matchmaking.css';

export default function Matchmaking() {
    const navigate = useNavigate();
    const [queueStatus, setQueueStatus] = useState('joining');
    const [queuePosition, setQueuePosition] = useState(null);
    const [queueTime, setQueueTime] = useState(0);
    const [opponent, setOpponent] = useState(null);
    const [matchData, setMatchData] = useState(null);
    const socketRef = useRef(null);
    const timerRef = useRef(null);
    const isMounted = useRef(true);
    const isLeavingQueue = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        const token = localStorage.getItem('token');
        
        if (!token) {
            navigate('/login');
            return;
        }

        console.log('🔌 Initializing socket connection...');
        socketRef.current = connectSocket();
        const socket = socketRef.current;

        // Socket connection events
        socket.on('connect', () => {
            console.log('✅ Socket connected:', socket.id);
            
            // Join queue after connection
            if (isMounted.current) {
                console.log('📤 Emitting join_queue event...');
                socket.emit('join_queue', { token });
            }
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            alert('Failed to connect to matchmaking server. Make sure backend is running.');
            navigate('/ranked-lobby');
        });

        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            hasJoinedQueue.current = false; // Reset on disconnect
        });

        // Listen for queue events
        socket.on('queue_left', () => {
            console.log('✅ Successfully left queue');
        });

        socket.on('queue_joined', ({ position }) => {
            console.log('✅ Queue joined! Position:', position);
            setQueueStatus('searching');
            setQueuePosition(position);
        });

        socket.on('already_in_queue', () => {
            console.log('⚠️ Already in queue');
            setQueueStatus('searching');
        });

        socket.on('match_found', (data) => {
            console.log('🎮 Match found!', data);
            if (isMounted.current) {
                setQueueStatus('matched');
                setOpponent(data.opponent);
                setMatchData(data);
                
                // Navigate to PvP game after 3 seconds
                setTimeout(() => {
                    if (isMounted.current) {
                        navigate('/pvp-game', { state: { matchData: data } });
                    }
                }, 3000);
            }
        });

        socket.on('error', ({ message }) => {
            console.error('❌ Queue error:', message);
            alert('Failed to join queue: ' + message);
            navigate('/ranked-lobby');
        });

        // Start queue timer
        timerRef.current = setInterval(() => {
            setQueueTime(prev => prev + 1);
        }, 1000);

        return () => {
            console.log('🧹 Matchmaking component unmounting...');
            isMounted.current = false;
            
            // Cleanup timer
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            
            // Only send leave_queue if not already leaving via button
            if (socketRef.current && socketRef.current.connected && !isLeavingQueue.current) {
                console.log('🚪 Auto-leaving queue on unmount...');
                socketRef.current.emit('leave_queue', { token });
            }
            
            // Cleanup socket listeners
            if (socketRef.current) {
                socketRef.current.off('connect');
                socketRef.current.off('connect_error');
                socketRef.current.off('disconnect');
                socketRef.current.off('queue_joined');
                socketRef.current.off('match_found');
                socketRef.current.off('error');
                socketRef.current.off('already_in_queue');
                socketRef.current.off('queue_left');
                
                // Only disconnect if not already leaving manually
                if (!isLeavingQueue.current) {
                    socketRef.current.disconnect();
                }
            }
        };
    }, []);

    const handleCancelQueue = () => {
        console.log('🚫 User clicked cancel - leaving queue...');
        const token = localStorage.getItem('token');
        
        isLeavingQueue.current = true; // Mark as intentionally leaving
        isMounted.current = false;
        
        // Clear timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        
        // Leave queue via socket
        if (socketRef.current && socketRef.current.connected) {
            // Listen for confirmation before navigating
            socketRef.current.once('queue_left', () => {
                console.log('✅ Queue left confirmed, navigating...');
                socketRef.current.disconnect();
                navigate('/ranked-lobby');
            });
            
            socketRef.current.emit('leave_queue', { token });
            
            // Fallback navigation in case queue_left doesn't fire
            setTimeout(() => {
                if (isLeavingQueue.current) {
                    console.log('⏱️ Timeout reached, navigating anyway...');
                    if (socketRef.current) {
                        socketRef.current.disconnect();
                    }
                    navigate('/ranked-lobby');
                }
            }, 500);
        } else {
            // No socket, just navigate
            navigate('/ranked-lobby');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="matchmaking-container">
            <div className="matchmaking-content">
                <h1 className="matchmaking-title">MATCHMAKING</h1>
                
                {queueStatus === 'searching' && (
                    <>
                        <div className="matchmaking-subtitle">SEARCHING FOR OPPONENT</div>
                        <div className="queue-status">
                            <div className="searching-animation">
                                <span>SCANNING</span>
                                <div className="searching-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                            
                            <div className="queue-timer">
                                {formatTime(queueTime)}
                            </div>
                            
                            <div className="queue-info">
                                {queuePosition !== null && (
                                    <div className="queue-stat">
                                        <span className="queue-label">POSITION IN QUEUE:</span>
                                        <span className="queue-value">#{queuePosition}</span>
                                    </div>
                                )}
                                <div className="queue-stat">
                                    <span className="queue-label">STATUS:</span>
                                    <span className="queue-value">WAITING</span>
                                </div>
                            </div>
                            
                            <button className="cancel-queue-btn" onClick={handleCancelQueue}>
                                CANCEL SEARCH
                            </button>
                        </div>
                    </>
                )}
                
                {queueStatus === 'matched' && opponent && (
                    <div className="match-found">
                        <div className="match-found-title">⚔️ MATCH FOUND! ⚔️</div>
                        
                        <div className="opponent-info">
                            <div className="opponent-name">VS {opponent.username}</div>
                            <div className="opponent-mmr">MMR: {opponent.mmr}</div>
                        </div>
                        
                        <div className="starting-message">
                            PREPARE FOR BATTLE...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}