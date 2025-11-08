'use client';

import React from 'react';
import { ArrowRight, Calendar, MapPin, Users, Phone, Mail, Clock, Coffee, Heart, ChevronRight, Facebook, Twitter, Instagram } from 'lucide-react';
import backgroundImage from '../assets/coverAboutus.png';
import Header from './Header';

export default function Home() {
  const HeroSection = () => (
    <div className="relative min-h-screen bg-gradient-to-br from-red-50 to-white overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-red-100 opacity-20 transform rotate-45">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="absolute h-16 w-16 md:h-32 md:w-32 border border-red-200 rounded-full animate-pulse" 
                 style={{ 
                   top: `${Math.random() * 100}%`, 
                   left: `${Math.random() * 100}%`,
                   animationDelay: `${Math.random() * 2}s`
                 }} 
            />
          ))}
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 relative">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6 md:space-y-8 z-10">
            <div className="inline-flex items-center px-3 py-1 md:px-4 md:py-2 bg-red-100 rounded-full shadow-md">
              <Heart className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-2 animate-pulse" />
              <span className="text-red-600 text-xs md:text-sm font-medium">Save Lives Today</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Your Blood Donation
              <span className="text-red-600 block mt-2"> Can Save Lives</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-lg">
              Every drop counts. Join our community of lifesavers and make a difference in someone's life today.
            </p>
            <div className="space-y-4 md:space-y-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800">WHY DONATE BLOOD?</h2>
              <ul className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                {['Save Lives, Streamlined Process', 'Quick, Easy Blood Donations', 'One Donation, Multiple Lives Saved', 'Emergency Blood Access Made Simple', 'Free Health Check with Donation'].map((item, index) => (
                  <li key={index} className="flex items-center">
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-red-500 mr-2 md:mr-3 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => window.location.href = '/signup'}
                className="px-6 py-3 md:px-8 md:py-4 bg-red-600 text-white rounded-full hover:bg-red-700 transform hover:scale-105 transition-all shadow-lg flex items-center justify-center text-sm md:text-base">
                Donate Now
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
              </button>
              <button
              onClick={() => window.location.href = '/about-us'}
              className="px-6 py-3 md:px-8 md:py-4 bg-white text-red-600 border-2 border-red-600 rounded-full hover:bg-red-50 transform hover:scale-105 transition-all flex items-center justify-center text-sm md:text-base"
            >
              Learn More
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
             </button>
            </div>
          </div>
          
          <div className="relative z-10 mt-8 md:mt-0">
            <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-transparent rounded-3xl transform rotate-3"></div>
            <img
              src={backgroundImage}
              alt="Blood donation"
              className="rounded-3xl shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500 object-cover w-full h-full max-h-[500px]"
            />
            
          </div>
        </div>
      </div>
    </div>
  );

  const DonationProcess = () => {
    const steps = [
      { 
        icon: Users, 
        title: "Registration", 
        description: "Quick and easy sign-up process",
        color: "bg-blue-50" 
      },
      { 
        icon: Calendar, 
        title: "Appointment", 
        description: "Choose your preferred time",
        color: "bg-green-50"
      },
      { 
        icon: Clock, 
        title: "Screening", 
        description: "Brief health check-up",
        color: "bg-yellow-50"
      },
      { 
        icon: Heart, 
        title: "Donation", 
        description: "Safe and comfortable process",
        color: "bg-red-50"
      },
      { 
        icon: Coffee, 
        title: "Recovery", 
        description: "Relax with refreshments",
        color: "bg-purple-50"
      },
    ];

    return (
      <section className="py-12 md:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">How Donation Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Our donation process is simple, safe, and convenient. Here's what you can expect when you visit us.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 md:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className={`${step.color} rounded-2xl p-4 md:p-6 h-full transform hover:scale-105 transition-all duration-300 hover:shadow-xl`}>
                  <div className="flex flex-col items-center text-center space-y-3 md:space-y-4">
                    <div className="bg-white p-3 md:p-4 rounded-xl shadow-md">
                      <step.icon className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg md:text-xl font-semibold">{step.title}</h3>
                    <p className="text-sm md:text-base text-gray-600">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const Testimonials = () => {
    const testimonials = [
      {
        name: "Sarah Johnson",
        role: "Regular Donor",
        quote: "Donating blood has become a meaningful part of my life. It's incredible to know that just 30 minutes of my time can save multiple lives.",
        image: "https://i.pravatar.cc/300?img=1"
      },
      {
        name: "Michael Chen",
        role: "First-time Donor",
        quote: "I was nervous at first, but the staff made me feel so comfortable. The process was much easier than I expected!",
        image: "https://i.pravatar.cc/300?img=3"
      },
      {
        name: "Emma Davis",
        role: "Monthly Donor",
        quote: "The team is professional and caring. I've been donating monthly for a year now, and it's always a positive experience.",
        image: "https://i.pravatar.cc/300?img=5"
      },
    ];

    return (
      <section className="py-12 md:py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Donor Stories</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              Hear from our amazing donors about their experiences and why they choose to save lives.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4 md:mb-6">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="font-semibold text-base md:text-lg">{testimonial.name}</h3>
                    <p className="text-red-600 text-xs md:text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic text-sm md:text-base">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const ContactInfo = () => (
    <section className="py-12 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Get in Touch</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            Have questions? We're here to help. Contact us through any of these channels.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {[
            { 
              icon: Phone, 
              title: "Phone",
              info: "(123) 456-7890",
              description: "Available Monday to Friday, 9AM-5PM",
              color: "bg-blue-50"
            },
            { 
              icon: Mail, 
              title: "Email",
              info: "Redsource@RedSource.com",
              description: "We'll respond within 24 hours",
              color: "bg-red-50"
            },
          ].map((item, index) => (
            <div key={index} 
                 className={`${item.color} p-6 md:p-8 rounded-2xl hover:shadow-lg transition-shadow flex items-start space-x-4 md:space-x-6`}>
              <div className="bg-white p-3 md:p-4 rounded-xl shadow-md flex-shrink-0">
                <item.icon className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg md:text-xl mb-2">{item.title}</h3>
                <p className="text-base md:text-lg text-gray-900 mb-1 md:mb-2">{item.info}</p>
                <p className="text-xs md:text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
  
  const Footer = () => (
    <footer className="bg-red-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div>
            <h4 className="text-lg md:text-xl font-bold mb-4 md:mb-6">About Us</h4>
            <p className="text-gray-400 mb-6 text-sm md:text-base">
              Our system streamlines blood donation, appointment scheduling, inventory management, and medical assessments for efficient, safe blood donation processes.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5 md:w-6 md:h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5 md:w-6 md:h-6" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5 md:w-6 md:h-6" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Quick Links</h4>
            <ul className="space-y-2 md:space-y-4">
              {[
                'Home',
                'About Us',
                'Donate Blood',
                'Contact Us'
              ].map((link, index) => (
                <li key={index}>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors flex items-center text-sm md:text-base">
                    <ChevronRight className="w-4 h-4 mr-2" />
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg md:text-xl font-bold mb-4 md:mb-6">Contact Info</h4>
            <ul className="space-y-2 md:space-y-4">
              <li className="text-gray-400 flex items-start text-sm md:text-base">
                <Phone className="w-4 h-4 md:w-5 md:h-5 mr-3 mt-1 flex-shrink-0" />
                <span>(123) 456-7890</span>
              </li>
              <li className="text-gray-400 flex items-start text-sm md:text-base">
                <Mail className="w-4 h-4 md:w-5 md:h-5 mr-3 mt-1 flex-shrink-0" />
                <span>Redsource@RedSource.com</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 md:mt-12 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm md:text-base">
          <p>© 2024 Blood Donation Center. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )

  return (
    <div className="min-h-screen">
      <Header isLoggedIn={false} />
      <HeroSection />
      <DonationProcess />
      <Testimonials />
      <ContactInfo />
      <Footer />
    </div>
  )
}