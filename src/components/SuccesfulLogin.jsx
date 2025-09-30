import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, Shield, Star, Users, Heart, Droplet } from 'lucide-react';
import Header from './Header';
import { useNavigate } from 'react-router-dom';
import { useTypingEffect } from '../hooks/useTypingEffect';
import { navigateWithRefresh } from '../utils/navigation';
import { ArrowRight } from 'lucide-react';
import person1 from '../assets/person/1.png';
import person2 from '../assets/person/2.png';
import person3 from '../assets/person/3.png';
import person4 from '../assets/person/4.png';

const SuccessfulLogin = () => {
  const navigate = useNavigate();
  const typedText = useTypingEffect(
    "Be a hero today. Your donation creates a lifeline for tomorrow.",
    150,  // Slower typing speed
    5000  // Longer pause between cycles
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [person1, person2, person3, person4];
  const professionals = [
    {
      name: "Dr. Sarah Mitchell",
      title: "Blood Bank Director"
    },
    {
      name: "Dr. James Wilson",
      title: "Senior Hematologist"
    },
    {
      name: "Dr. Emily Chen",
      title: "Transfusion Specialist"
    },
    {
      name: "Dr. Michael Roberts",
      title: "Research Director"
    }
  ];

  // Auto transition effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 20000); // Change image every 20 seconds

    return () => clearInterval(timer);
  }, []);

  const handleDonateClick = () => {
    navigateWithRefresh('/donation-center');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#FAFAFA]">
      <Header isLoggedIn={true} />
      
      {/* Professional Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Modern Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-red-50/30" />
        
        {/* Decorative Medical Elements */}
        <div className="absolute inset-0">
          {/* DNA Helix Pattern */}
          <div className="absolute top-0 right-0 w-[600px] h-[800px] opacity-[0.03] rotate-45"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, #DC2626 0, #DC2626 2px, transparent 2px, transparent 12px),
                               repeating-linear-gradient(-45deg, #DC2626 0, #DC2626 2px, transparent 2px, transparent 12px)`,
              backgroundSize: '24px 24px'
            }}
          />
          
          {/* Medical Cross Pattern */}
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-[0.02]"
            style={{
              backgroundImage: `
                radial-gradient(circle at center, #DC2626 2px, transparent 2px),
                radial-gradient(circle at center, #DC2626 1.5px, transparent 1.5px)
              `,
              backgroundSize: '24px 24px, 16px 16px',
              backgroundPosition: '0 0, 8px 8px'
            }}
          />
        </div>

        {/* Modern Accent Shapes */}
        <div className="absolute top-0 right-0 w-[1000px] h-[1000px]">
          <div className="absolute inset-0 bg-gradient-to-br from-red-100/20 via-red-50/10 to-transparent rounded-full blur-3xl transform -translate-y-1/2 translate-x-1/4" />
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-red-100/20 to-transparent rounded-full blur-2xl transform translate-y-1/4 -translate-x-1/4 rotate-45" />
        </div>

        {/* Floating Elements */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-slow"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 100 + 100}px`,
              height: `${Math.random() * 100 + 100}px`,
              background: `radial-gradient(circle at center, 
                rgba(220, 38, 38, ${0.01 + Math.random() * 0.02}) 0%, 
                transparent 70%)`,
              borderRadius: '50%',
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}

        {/* Professional Grid Overlay */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(to right, #DC2626 1px, transparent 1px),
                linear-gradient(to bottom, #DC2626 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Subtle Flow Lines */}
        <div className="absolute inset-0 opacity-[0.02]">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-red-500 to-transparent"
              style={{
                left: `${20 + i * 20}%`,
                transform: `rotate(${-10 + i * 5}deg)`,
                opacity: 0.1 + i * 0.02
              }}
            />
          ))}
        </div>

        {/* Edge Highlights */}
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-200/20 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-200/20 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full min-h-screen px-4 sm:px-6 lg:px-8">
        <style jsx>{`
          @keyframes float-slow {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(10px, -10px) rotate(2deg); }
            50% { transform: translate(0, -20px) rotate(0deg); }
            75% { transform: translate(-10px, -10px) rotate(-2deg); }
          }
          .animate-float-slow {
            animation: float-slow var(--duration, 15s) ease-in-out infinite;
          }
        `}</style>

        <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center max-w-7xl mx-auto py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-12 w-full items-center">
            {/* Left Column */}
        <motion.div 
              className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-xl lg:max-w-none mx-auto lg:mx-0 px-2 sm:px-4 lg:px-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <motion.div 
                className="inline-flex items-center space-x-2 bg-white rounded-full 
                          px-4 py-2 border border-red-100 hover:border-red-200 
                          shadow-lg hover:shadow-xl transition-all duration-500 mx-auto lg:mx-0
                          backdrop-blur-xl"
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Activity className="w-4 h-4 text-red-500" />
                <span className="text-red-600 text-sm font-medium tracking-wide whitespace-nowrap">Where Heroes Save Lives</span>
              </motion.div>

              {/* Main Heading */}
              <div className="text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight">
                  <motion.span className="block text-gray-900 mb-2">
                    DONATE BLOOD
                  </motion.span>
                  <motion.span className="block bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-red-600 to-red-500">
                    SAVE LIVES
                  </motion.span>
                </h1>
              </div>

              {/* Description */}
              <div className="space-y-6 text-center lg:text-left">
          <motion.p 
                  className="text-base lg:text-lg text-gray-600 leading-relaxed
                           font-light tracking-wide max-w-md mx-auto lg:mx-0"
          >
                  When you donate blood, you're not just giving a pint – you're giving someone a chance to live, heal, and create more memories.
          </motion.p>

                {/* Features List */}
                <div className="space-y-4">
                  <h3 className="text-base text-gray-700 font-semibold tracking-wide">Why Choose RedSource:</h3>
                  <ul className="space-y-3">
                    {[
                      { text: "Simple & Quick Donation Process", icon: Clock },
                      { text: "State-of-the-Art Safety Standards", icon: Shield },
                      { text: "Real-Time Impact Tracking", icon: Star },
                      { text: "Community of Life-Savers", icon: Users }
                    ].map((item, index) => (
                      <motion.li
                        key={index}
                        className="flex items-center space-x-3 text-gray-600 hover:text-gray-900
                                 p-3 rounded-xl hover:bg-white/80 transition-all duration-300
                                 justify-center lg:justify-start backdrop-blur-sm
                                 border border-transparent hover:border-red-100/50
                                 shadow-sm hover:shadow-md"
                        whileHover={{ x: 5, scale: 1.02 }}
                      >
                        <item.icon className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span className="text-base">{item.text}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex justify-center lg:justify-start pt-4">
                <motion.button
                  onClick={handleDonateClick}
                  className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 
                           rounded-xl text-white font-semibold text-base
                           shadow-xl hover:shadow-2xl transition-all duration-300
                           border border-red-400/20"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative flex items-center justify-center space-x-2">
                    <span>Become a Hero Today</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 
                                transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                </motion.button>
              </div>
            </motion.div>

            {/* Right Side - Professional Image Display */}
            <motion.div
              className="relative mt-6 sm:mt-8 lg:mt-0 max-w-2xl mx-auto lg:max-w-none w-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="relative">
                {/* Main Image Container */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-[2.5rem]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentImageIndex}
                      initial={{ opacity: 0, x: 100 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ duration: 0.7 }}
                    >
                      {/* Image with Enhanced Container */}
                      <div className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
                        <img
                          src={images[currentImageIndex]}
                          alt={`Medical Professional ${currentImageIndex + 1}`}
                          className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                        />
                        
                        {/* Professional Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 py-3 px-4 bg-black/30 backdrop-blur-xl
                                    border-t border-white/20 rounded-b-2xl sm:rounded-b-[2.5rem]">
                          <motion.div className="flex flex-col items-start space-y-1">
                            <div className="space-y-0">
                              <p className="text-red-400/90 text-xs sm:text-sm font-medium tracking-wide">
                                Meet Our Expert
                              </p>
                              <h3 className="text-white text-base sm:text-xl lg:text-2xl font-bold tracking-tight -mt-0.5">
                                {professionals[currentImageIndex].name}
                              </h3>
                            </div>
                            <p className="text-red-100/90 text-sm sm:text-base lg:text-lg font-light -mt-0.5">
                              {professionals[currentImageIndex].title}
                            </p>
                            <div className="w-16 sm:w-20 h-0.5 bg-gradient-to-r from-red-500/50 to-transparent rounded-full -mt-0.5" />
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Indicators */}
                  <div className="absolute bottom-20 sm:bottom-24 right-4 sm:right-6 flex items-center justify-end space-x-2 sm:space-x-3 z-20">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
                          index === currentImageIndex 
                            ? 'w-6 sm:w-8 bg-gradient-to-r from-red-500 to-red-400 shadow-sm shadow-red-500/20' 
                            : 'w-1.5 sm:w-2 bg-white/30 hover:bg-white/50'
                        }`}
                        aria-label={`View professional ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Side Accents */}
                <div className="absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 w-0.5 sm:w-1 h-24 sm:h-32 bg-gradient-to-b from-red-500/0 via-red-500/40 to-red-500/0" />
                <div className="absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 w-0.5 sm:w-1 h-24 sm:h-32 bg-gradient-to-b from-red-500/0 via-red-500/40 to-red-500/0" />
              </div>
            </motion.div>
          </div>

          {/* Bottom Text */}
          <motion.div
            className="absolute bottom-4 sm:bottom-6 left-0 right-0 text-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-xs sm:text-sm lg:text-base text-red-50/70 font-light tracking-wide backdrop-blur-sm
                       hover:text-red-50 transition-colors duration-300 max-w-xs sm:max-w-md lg:max-w-2xl mx-auto">
              {typedText}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SuccessfulLogin;

