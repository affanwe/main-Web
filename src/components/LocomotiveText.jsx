import React from 'react';

const LocomotiveText = ({ text, className = '', style = {} }) => {
  if (typeof text !== 'string') return text;

  return (
    <span className={`split-text-container ${className}`} style={{ ...style, display: 'inline-block' }}>
      {text.split('').map((char, index) => {
        if (char === ' ') {
          return (
            <span key={index} style={{ display: 'inline-block', width: '0.25em' }}>
              &nbsp;
            </span>
          );
        }

        return (
          <span
            key={index}
            className="char-wrapper"
            style={{
              display: 'inline-block',
              position: 'relative',
              overflow: 'hidden',
              verticalAlign: 'bottom',
              '--index': index,
            }}
          >
            <span className="char-primary" style={{ display: 'block' }}>
              {char}
            </span>
            <span
              className="char-secondary"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                display: 'block',
              }}
            >
              {char}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export default LocomotiveText;
