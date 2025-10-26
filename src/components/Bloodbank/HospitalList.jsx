import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTruck, FiActivity, FiBarChart2, FiMap, FiPieChart, FiAlertTriangle, FiPackage, FiCalendar } from 'react-icons/fi';

const HospitalList = () => {
  const adminName = localStorage.getItem('username') || 'RedsourceAdmin';
  
  // Mock data for blood bank logistics
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const bloodInventory = [
    { type: 'A+', current: 450, capacity: 600, status: 'normal' },
    { type: 'A-', current: 75, capacity: 200, status: 'normal' },
    { type: 'B+', current: 380, capacity: 500, status: 'normal' },
    { type: 'B-', current: 12, capacity: 100, status: 'critical' },
    { type: 'AB+', current: 105, capacity: 200, status: 'normal' },
    { type: 'AB-', current: 8, capacity: 100, status: 'critical' },
    { type: 'O+', current: 520, capacity: 700, status: 'normal' },
    { type: 'O-', current: 15, capacity: 300, status: 'critical' }
  ];
  
  const pendingDeliveries = [
    { id: 'DEL-2234', hospital: 'City General Hospital', items: 'A+ (5 units), O+ (3 units)', date: '2023-08-18', status: 'Ready for Dispatch' },
    { id: 'DEL-2235', hospital: 'Memorial Hospital', items: 'B- (2 units), AB+ (1 unit)', date: '2023-08-19', status: 'Packaging' },
  ];
  
  const recentRequests = [
    { id: 'REQ-1122', hospital: 'County Medical Center', items: 'O- (4 units)', date: '2023-08-16', priority: 'High' },
    { id: 'REQ-1123', hospital: 'University Hospital', items: 'A- (2 units), B+ (3 units)', date: '2023-08-17', priority: 'Medium' },
  ];
  
  const hospitalZones = [
    { zone: 'North', hospitals: 8, activeRequests: 12 },
    { zone: 'South', hospitals: 6, activeRequests: 5 },
    { zone: 'East', hospitals: 5, activeRequests: 3 },
    { zone: 'West', hospitals: 7, activeRequests: 8 },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'critical': return 'text-red-600';
      case 'low': return 'text-yellow-600';
      case 'normal': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };
  
  const getPercentage = (current, capacity) => {
    return Math.round((current / capacity) * 100);
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Blood Bank Logistics</h1>
          <p className="text-gray-600">Welcome, {adminName}</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <button 
            className={`py-2 px-4 rounded-lg ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`py-2 px-4 rounded-lg ${activeTab === 'hospitals' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            onClick={() => setActiveTab('hospitals')}
          >
            Hospital List
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Blood Units</p>
                  <p className="text-2xl font-bold">{bloodInventory.reduce((acc, item) => acc + item.current, 0)}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <FiActivity className="text-red-600 text-xl" />
                </div>
              </div>
              <Link to="/request-sheet" className="text-red-600 text-sm mt-4 inline-block">View inventory</Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Pending Deliveries</p>
                  <p className="text-2xl font-bold">{pendingDeliveries.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <FiTruck className="text-blue-600 text-xl" />
                </div>
              </div>
              <button className="text-blue-600 text-sm mt-4 inline-block">Manage deliveries</button>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">New Requests</p>
                  <p className="text-2xl font-bold">{recentRequests.length}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <FiBarChart2 className="text-green-600 text-xl" />
                </div>
              </div>
              <Link to="/requests" className="text-green-600 text-sm mt-4 inline-block">View requests</Link>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Partner Hospitals</p>
                  <p className="text-2xl font-bold">{hospitalZones.reduce((acc, zone) => acc + zone.hospitals, 0)}</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <FiMap className="text-purple-600 text-xl" />
                </div>
              </div>
              <button className="text-purple-600 text-sm mt-4 inline-block">View hospital map</button>
            </div>
          </div>

          {/* Blood Inventory */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Blood Inventory Status</h2>
                <button className="text-red-600 text-sm font-medium">Update inventory</button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bloodInventory.map((item) => (
                  <div key={item.type} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl font-bold">{item.type}</span>
                      <span className={`text-sm font-medium ${getStatusColor(item.status)}`}>
                        {item.status === 'critical' ? 'CRITICAL' : 
                        item.status === 'low' ? 'LOW' : 'NORMAL'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                      <span>{item.current} units</span>
                      <span>{item.capacity} max</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          item.status === 'critical' ? 'bg-red-600' : 
                          item.status === 'low' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${getPercentage(item.current, item.capacity)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <FiPieChart className="text-purple-600 mr-2" />
                <h2 className="text-lg font-semibold">Distribution by Zone</h2>
              </div>
              
              <div className="space-y-4">
                {hospitalZones.map((zone, index) => (
                  <div key={index} className="border-b pb-3">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">{zone.zone} Zone</span>
                      <span className="text-gray-600">{zone.hospitals} hospitals</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-500">{zone.activeRequests} active requests</span>
                      <span className="text-blue-600 font-medium">
                        {Math.round((zone.activeRequests / recentRequests.length) * 100)}% of total
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-purple-600 h-1.5 rounded-full"
                        style={{ width: `${(zone.hospitals / hospitalZones.reduce((acc, z) => acc + z.hospitals, 0)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-4 text-purple-600 border border-purple-600 py-2 rounded-lg text-sm font-medium">
                View detailed analytics
              </button>
            </div>
          </div>

          {/* Pending Deliveries and Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FiPackage className="text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold">Pending Deliveries</h2>
                </div>
                <Link to="/schedule" className="text-blue-600 text-sm">Schedule new</Link>
              </div>
              
              {pendingDeliveries.length > 0 ? (
                <div className="space-y-4">
                  {pendingDeliveries.map((delivery, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold">{delivery.hospital}</span>
                        <span className="text-sm text-gray-500">ID: {delivery.id}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">{delivery.items}</div>
                      <div className="flex justify-between text-sm">
                        <span>Delivery Date: {delivery.date}</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                          {delivery.status}
                        </span>
                      </div>
                      <div className="mt-3 pt-3 border-t flex justify-end space-x-2">
                        <button className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-xs">
                          Track
                        </button>
                        <button className="bg-green-50 text-green-700 px-3 py-1 rounded-md text-xs">
                          Update Status
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button className="text-gray-600 text-sm w-full py-2 border rounded-lg mt-2">
                    View all deliveries
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">No pending deliveries at this time.</p>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FiAlertTriangle className="text-red-600 mr-2" />
                  <h2 className="text-lg font-semibold">Recent Blood Requests</h2>
                </div>
                <Link to="/requests" className="text-red-600 text-sm">View all</Link>
              </div>
              
              {recentRequests.length > 0 ? (
                <div className="space-y-4">
                  {recentRequests.map((request, index) => (
                    <div key={index} className="border p-4 rounded-lg">
                      <div className="flex justify-between mb-2">
                        <span className="font-semibold">{request.hospital}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityColor(request.priority)}`}>
                          {request.priority} Priority
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">Requested: {request.items}</div>
                      <div className="text-sm text-gray-500">
                        Request Date: {request.date} | ID: {request.id}
                      </div>
                      <div className="mt-3 pt-3 border-t flex justify-end space-x-2">
                        <button className="bg-red-50 text-red-700 px-3 py-1 rounded-md text-xs">
                          Decline
                        </button>
                        <button className="bg-green-50 text-green-700 px-3 py-1 rounded-md text-xs">
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No pending requests at this time.</p>
              )}
            </div>
          </div>
          
          {/* Calendar */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FiCalendar className="text-gray-600 mr-2" />
                <h2 className="text-lg font-semibold">Upcoming Events & Schedules</h2>
              </div>
              <Link to="/schedule" className="text-blue-600 text-sm">Manage schedule</Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium">Blood Donation Drive</div>
                      <div className="text-sm text-gray-500">Community Center</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>Aug 25, 2023</div>
                      <div className="text-sm text-gray-500">9:00 AM - 5:00 PM</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">Downtown Community Center</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                        Confirmed
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Manage</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium">Hospital Supply Run</div>
                      <div className="text-sm text-gray-500">Memorial Hospital</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>Aug 20, 2023</div>
                      <div className="text-sm text-gray-500">10:00 AM</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">Memorial Hospital</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        In Planning
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Details</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {activeTab === 'hospitals' && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Hospital Directory</h2>
          
          <div className="mb-4">
            <input 
              type="text" 
              placeholder="Search hospitals..." 
              className="w-full p-2 border rounded-lg"
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Person</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active Requests</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">Memorial Hospital</td>
                  <td className="px-4 py-3 whitespace-nowrap">South Zone</td>
                  <td className="px-4 py-3 whitespace-nowrap">Dr. Sarah Johnson</td>
                  <td className="px-4 py-3 whitespace-nowrap">2</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 text-sm mr-2">View</button>
                    <button className="text-green-600 hover:text-green-800 text-sm">Delivery</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">City General Hospital</td>
                  <td className="px-4 py-3 whitespace-nowrap">North Zone</td>
                  <td className="px-4 py-3 whitespace-nowrap">Dr. Robert Chen</td>
                  <td className="px-4 py-3 whitespace-nowrap">1</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 text-sm mr-2">View</button>
                    <button className="text-green-600 hover:text-green-800 text-sm">Delivery</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">University Medical Center</td>
                  <td className="px-4 py-3 whitespace-nowrap">East Zone</td>
                  <td className="px-4 py-3 whitespace-nowrap">Dr. Maria Lopez</td>
                  <td className="px-4 py-3 whitespace-nowrap">0</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 text-sm mr-2">View</button>
                    <button className="text-green-600 hover:text-green-800 text-sm">Delivery</button>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 whitespace-nowrap">Community Hospital</td>
                  <td className="px-4 py-3 whitespace-nowrap">West Zone</td>
                  <td className="px-4 py-3 whitespace-nowrap">Dr. James Wilson</td>
                  <td className="px-4 py-3 whitespace-nowrap">3</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button className="text-blue-600 hover:text-blue-800 text-sm mr-2">View</button>
                    <button className="text-green-600 hover:text-green-800 text-sm">Delivery</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalList; 