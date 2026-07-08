import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const wordVariants = {
  hidden: { y: '110%', opacity: 0 },
  visible: (index) => ({
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      delay: index * 0.06,
    },
  }),
};

const AnimatedWord = ({ text, className = '', index, shouldReduceMotion }) => {
  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className="inline-block overflow-hidden align-bottom">
      <motion.span
        className={`inline-block ${className}`}
        variants={wordVariants}
        custom={index}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.6 }}
      >
        {text}
      </motion.span>
    </span>
  );
};

const AnimatedSectionHeading = ({
  as: Component = 'h2',
  className = '',
  before = '',
  highlight = '',
  highlightClassName = 'text-accent-purple',
  after = '',
  afterClassName = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const beforeWords = before.trim() ? before.trim().split(/\s+/) : [];
  const highlightWords = highlight.trim() ? highlight.trim().split(/\s+/) : [];
  const afterWords = after.trim() ? after.trim().split(/\s+/) : [];
  let wordIndex = 0;

  if (shouldReduceMotion) {
    return (
      <Component className={className}>
        {before}
        {before && highlight ? ' ' : ''}
        {highlight ? <span className={highlightClassName}>{highlight}</span> : null}
        {after ? (
          <>
            {' '}
            <span className={afterClassName}>{after}</span>
          </>
        ) : null}
      </Component>
    );
  }

  return (
    <Component className={className} aria-label={`${before} ${highlight} ${after}`.trim()}>
      {beforeWords.map((word) => {
        const currentIndex = wordIndex;
        wordIndex += 1;
        return (
          <React.Fragment key={`before-${word}-${currentIndex}`}>
            <AnimatedWord text={word} index={currentIndex} shouldReduceMotion={shouldReduceMotion} />
            {' '}
          </React.Fragment>
        );
      })}
      {highlightWords.map((word) => {
        const currentIndex = wordIndex;
        wordIndex += 1;
        return (
          <React.Fragment key={`highlight-${word}-${currentIndex}`}>
            <AnimatedWord
              text={word}
              className={highlightClassName}
              index={currentIndex}
              shouldReduceMotion={shouldReduceMotion}
            />
            {' '}
          </React.Fragment>
        );
      })}
      {afterWords.map((word) => {
        const currentIndex = wordIndex;
        wordIndex += 1;
        return (
          <React.Fragment key={`after-${word}-${currentIndex}`}>
            <AnimatedWord
              text={word}
              className={afterClassName}
              index={currentIndex}
              shouldReduceMotion={shouldReduceMotion}
            />
            {' '}
          </React.Fragment>
        );
      })}
    </Component>
  );
};

export default AnimatedSectionHeading;
