import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ 
  currentPage, 
  totalItems, 
  itemsPerPage = 10, 
  onPageChange,
  className = ""
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Show first pages
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last pages
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show middle pages
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalItems === 0) {
    return null; // Don't show pagination if there are no items
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-3 ${className}`}>
      {/* Page Info */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>
      
      {/* Pagination Buttons */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>
        
        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => {
            if (page === '...') {
              return <span key={index} className="px-2 text-gray-400">...</span>
            }
            
            return (
              <button
                key={index}
                onClick={() => handlePageClick(page)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === page
                    ? 'bg-gradient-to-r from-[#C91C1C] to-[#FF5757] text-white shadow-md'
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {page}
              </button>
            )
          })}
        </div>
        
        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
          }`}
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
