import React from 'react';
// import './QuitButton.css';

const QuitButton = ({ onClick }) => {
return (
<button className="quit-button" onClick={onClick}>
    <span className="quit-icon">[X]</span>
    <span className="quit-text">QUIT GAME</span>
</button>
);
};

export default QuitButton;