import React, { useEffect } from 'react';
import './ClickSpark.css';

const ClickSpark = () => {
  useEffect(() => {
    const handler = (e) => {
      const sparkContainer = document.createElement('span');
      sparkContainer.className = 'clickspark-container';
      sparkContainer.style.left = e.clientX + 'px';
      sparkContainer.style.top = e.clientY + 'px';

      const sparkCount = 12;
      for (let i = 0; i < sparkCount; i++) {
        const spark = document.createElement('i');
        spark.className = 'clickspark';
        spark.style.setProperty('--i', String(i));
        sparkContainer.appendChild(spark);
      }

      document.body.appendChild(sparkContainer);
      const remove = () => {
        if (sparkContainer && sparkContainer.parentNode) {
          sparkContainer.parentNode.removeChild(sparkContainer);
        }
      };
      sparkContainer.addEventListener('animationend', remove, { once: true });
      setTimeout(remove, 1000);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return null;
};

export default ClickSpark;


