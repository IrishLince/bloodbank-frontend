import { useState, useEffect } from 'react';

export const useTypingEffect = (text, typingSpeed = 150, pauseDuration = 5000) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let timeout;

    const type = () => {
      if (currentIndex < text.length) {
        timeout = setTimeout(() => {
          setDisplayedText(text.substring(0, currentIndex + 1));
          setCurrentIndex(prev => prev + 1);
        }, typingSpeed);
      } else {
        setIsPaused(true);
        timeout = setTimeout(() => {
          setDisplayedText('');
          setCurrentIndex(0);
          setIsPaused(false);
        }, pauseDuration);
      }
    };

    if (isTyping && !isPaused) {
      type();
    }

    return () => clearTimeout(timeout);
  }, [text, currentIndex, isTyping, isPaused, typingSpeed, pauseDuration]);

  return displayedText;
}; 