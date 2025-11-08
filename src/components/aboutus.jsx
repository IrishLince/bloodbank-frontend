'use client'

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from './Header';
import AkiImage from '../assets/Project Members/Aki.png';
import LinceImage from '../assets/Project Members/Lince.png';
import ArvinImage from '../assets/Project Members/Arvin.png'
import MiguelImage from '../assets/Project Members/Miguel.png';
import MatenImage from '../assets/Project Members/Maten.png';
import backgroundImage from '../assets/coverAboutus.png';
import backgroundImageJoinus from '../assets/CoverJoinus.png';
import firstimage from '../assets/1st.png';
import secondimage from '../assets/2nd.png'

export default function BloodDonationWebsite() {
  const [currentTeamIndex, setCurrentTeamIndex] = useState(2);
 
  const teamMembers = [
    { name: 'Villaflor, Akimarie A.', role: 'System Analyst/Frontend', image: AkiImage },
    { name: 'Lince, Irish T.', role: 'Tester/QA Frontend', image: LinceImage },
    { name: 'Espinoza, Arvin S.', role: 'Team Leader/Backend', image: ArvinImage },
    { name: 'Carandang, Miguel T.', role: 'Integration/Backend', image: MiguelImage },
    { name: 'Maten, Rovic', role: 'Tester/QA Frontend', image: MatenImage },
  ];

  const nextTeamSlide = () => {
    setCurrentTeamIndex((prevIndex) => (prevIndex + 1) % teamMembers.length);
  };

  const prevTeamSlide = () => {
    setCurrentTeamIndex((prevIndex) => (prevIndex - 1 + teamMembers.length) % teamMembers.length);
  };

  useEffect(() => {
    const handleResize = () => {
      // Add any specific resize logic here if needed
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const heroText = "Donate Blood, Save Lives";
  const heroSubtext = "Every drop counts in our mission to help those in need.";

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="overflow-hidden">
        {/* Hero Section with Animated Text */}
        <div 
          className="relative h-48 sm:h-64 md:h-96 mb-8 sm:mb-12 flex items-center justify-center" 
          style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
          <div className="relative z-10 text-center p-4 sm:p-8">
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {heroText.split('').map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h1>
            <motion.p
              className="text-lg sm:text-xl text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              {heroSubtext}
            </motion.p>
          </div>
        </div>

        {/* Who We Are Section */}
        <section className="bg-white px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 sm:gap-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-redsource">Who We Are</h2>
              <p className="text-sm sm:text-base text-graycustom">
                At <span className="text-redsource font-semibold">RedSource</span>, we are driven by the mission to improve healthcare access through smarter, technology-powered solutions for blood donation management. Launched in 2024, <span className="text-redsource font-semibold">RedSource</span> was created in response to the persistent challenges faced by blood banks and hospitals—shortages, wastage, and delayed access to life-saving blood. We believe that modern healthcare deserves a modern approach, and we aim to bridge the gap between donors, hospitals, and blood banks with a digital platform that is efficient, safe, and easy to use.
              </p>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-redsource">Our Mission and Impact</h2>
              <p className="text-sm sm:text-base text-graycustom">
                <span className="text-redsource font-semibold">RedSource</span> is committed to transforming the way blood is donated, tracked, and delivered. Our mission is not only to promote the importance of blood donation but also to build an integrated system that supports real-time inventory monitoring, secure donor scheduling, and fast hospital request fulfillment. By enhancing coordination and minimizing inefficiencies, we help save lives and improve patient outcomes across the healthcare system.
              </p>
            </div>
          </div>
        </section>

        {/* Join Us Section */}
        <section 
          className="text-white py-12 px-4 sm:px-6 text-center" 
          style={{ backgroundImage: `url(${backgroundImageJoinus})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">Join Us In Saving Lives!</h2>
            <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-12">
            At RedSource, saving lives is a shared mission—and you can be a part of it. Whether you're a first-time donor or a returning supporter, your involvement helps improve access to safe and timely blood supply.
            </p>
            
            <div className="space-y-6 text-left max-w-2xl mx-auto">
              {['Donate Through Our Platform:', 'Volunteer Your Time', 'Spread the Word'].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="text-red-300 mt-1.5">•</span>
                  <div>
                    <h3 className="font-semibold mb-1">{item}:</h3>
                    <p className="text-sm sm:text-base">{item === 'Donate Through Our Platform:' 
                      ? 'Use our easy-to-access system to schedule a donation. Each appointment helps ensure blood is available when and where it’s needed most.'
                      : item === 'Volunteer Your Time'
                      ? 'Support our mission by assisting with donor coordination or engaging in community outreach. Your time and effort help ensure smooth operations and broader awareness.'
                      : 'Raise awareness by encouraging others to join. Sharing information about blood donation can inspire more people to give and strengthen the community.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Information Sections */}
        <section className="bg-red-50 px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-6xl mx-auto space-y-8 sm:space-y-12">
            {/* Why Blood Donation Matters */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 sm:gap-8">
              <div className="flex-1 max-w-xl">
                <h2 className="text-xl sm:text-2xl font-bold text-redsource mb-4">
                  Why Digital Blood Donation Matters
                </h2>
                <div className="space-y-4 text-sm sm:text-base text-graycustom">
                  <p>
                  Every moment counts in emergency medical care—and blood donation is often the difference between life and death. However, the traditional blood supply chain often suffers from poor communication and delays. At <span className="text-redsource font-semibold">RedSource</span>, our digital solution empowers donors to contribute consistently, enables blood banks to manage stocks accurately, and ensures hospitals get what they need—when they need it.
                  </p>
                </div>
              </div>
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64">
                <img
                  src={firstimage}
                  alt="Blood donation process"
                  className="w-full h-full rounded-full object-cover"
                />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-200 rounded-full" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-red-200 rounded-full" />
              </div>
            </div>

            {/* Our Commitment to Security and Accessibility */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 sm:gap-8">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 order-2 md:order-first">
                <img
                  src={secondimage}
                  alt="Safety protocols in blood donation"
                  className="w-full h-full rounded-full object-cover"
                />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-rose-200 rounded-full" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-rose-200 rounded-full" />
              </div>
              <div className="flex-1 max-w-xl order-1 md:order-last">
                <h2 className="text-xl sm:text-2xl font-bold text-redsource mb-4">
                Our Commitment to Security and Accessibility
                </h2>
                <p className="text-sm sm:text-base text-graycustom">
                We prioritize the safety of both data and people. Our platform is designed with strong data protection protocols, role-based access, and compliance with healthcare standards to ensure a secure and reliable experience for all users. At <span className="text-redsource font-semibold">RedSource</span>, we are building more than a system—we’re building trust in a digital healthcare future.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Members Section */}
        <section className="bg-red-900 py-12 sm:py-16 px-4 relative overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center text-white">Our Team</h2>
            <div className="relative">
              {/* Large red circle */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-red-500 rounded-full opacity-20 blur-3xl"></div>
              {/* Small pink circle */}
              <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-pink-500 rounded-full opacity-20 blur-3xl"></div>

              <div className="flex justify-center items-center gap-2 sm:gap-4 -mx-2 sm:mx-0">
                {teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-300 ${
                      index === currentTeamIndex
                        ? 'scale-100 opacity-100 w-64 sm:w-72'
                        : index === (currentTeamIndex + 1) % teamMembers.length || index === (currentTeamIndex - 1 + teamMembers.length) % teamMembers.length
                        ? 'scale-75 opacity-60 hidden sm:block'
                        : 'hidden'
                    }`}
                  >
                    <div className="bg-red-800 rounded-lg overflow-hidden shadow-lg w-full">
                      <div className="h-48 sm:h-56 bg-white flex justify-center items-center">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-full border-4 border-white"
                        />
                      </div>
                      <div className="p-4 text-center">
                        <h3 className="font-bold text-lg sm:text-xl text-white">{member.name}</h3>
                        <p className="text-red-200 text-sm sm:text-base">{member.role}</p>
                        <button className="mt-4 px-4 py-2 bg-red-600 text-white text-sm sm:text-base rounded-full hover:bg-red-700 transition-colors">
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={prevTeamSlide}
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Previous team member"
              >
                <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={nextTeamSlide}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/10 text-white p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Next team member"
              >
                <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            </div>

            <div className="flex justify-center mt-6 sm:mt-8">
              {teamMembers.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 mx-1 rounded-full ${
                    index === currentTeamIndex ? 'bg-white' : 'bg-red-600'
                  }`}
                  onClick={() => setCurrentTeamIndex(index)}
                  aria-label={`Go to slide ${index + 1}`}
                ></button>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
      <section className="bg-red-50 py-12 px-4 sm:px-6 text-center">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-red-800">Contact Us!</h2>
          <p className="mb-8 text-sm sm:text-base">Together, we can build a smarter, more connected blood donation system that saves lives and strengthens healthcare access for all.</p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { icon: Phone, title: 'Phone Number', content: '(555) 123-4567' },
              { icon: Mail, title: 'Email Address', content: 'RedSource@RedSource.com' }
            ].map(({ icon: Icon, title, content }) => (
              <div key={title} className="flex flex-col items-center">
                <Icon className="w-6 h-6 mb-2 text-red-600" />
                <h3 className="font-bold text-red-800">{title}</h3>
                <p className="text-sm sm:text-base">{content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}

