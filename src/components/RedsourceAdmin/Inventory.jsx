import React, { useState, useEffect, useRef } from 'react';
import { 
  FiFilter, 
  FiDownload, 
  FiPlus, 
  FiRefreshCw, 
  FiAlertCircle, 
  FiClock, 
  FiPackage, 
  FiThermometer, 
  FiBarChart2, 
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiCheck,
  FiEdit,
  FiTrash2,
  FiPrinter,
  FiCalendar,
  FiMap,
  FiArrowLeft,
  FiUpload,
  FiLayers,
  FiMinus,
  FiCornerUpRight,
  FiActivity,
  FiUser,
  FiArrowRight
} from 'react-icons/fi';
import { Calendar } from 'lucide-react';
import BloodBagRequests from './BloodBagRequests';

const Inventory = () => {
  const [view, setView] = useState('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBloodType, setSelectedBloodType] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [expandedBatch, setExpandedBatch] = useState(null);
  
  // New state variables for additional functionalities
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAdvancedFilterModal, setShowAdvancedFilterModal] = useState(false);
  const [showRequestsView, setShowRequestsView] = useState(false);
  const [currentDetailItem, setCurrentDetailItem] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    location: 'All',
    collectedAfter: '',
    collectedBefore: '',
    expiryAfter: '',
    expiryBefore: '',
    temperature: 'All'
  });
  
  // Form state for add/edit modals
  const [formData, setFormData] = useState({
    id: '',
    type: 'A+',
    units: 1,
    location: 'Storage A',
    collected: '',
    expiry: '',
    status: 'Available',
    temperature: '4°C',
    donorId: '',
    hospital: '',
    batchNo: ''
  });
  
  // Ref for print functionality
  const printSectionRef = useRef(null);

  // Location options
  const locations = ['All', 'Storage A', 'Storage B', 'Storage C', 'Storage D'];
  
  // Temperature options
  const temperatures = ['All', '2°C', '3°C', '4°C', '5°C', '6°C'];
  

  // Hospital options (mock data)
  const hospitals = [
    'City General Hospital',
    'Memorial Hospital',
    'University Medical Center',
    'Children\'s Hospital',
    'Regional Medical Center'
  ];
  
  // Mock data for claiming donors (add this near the hospitals array)
  const claimingDonors = [
    { id: 'D-1001', name: 'John Smith', points: 250, date: '2023-09-15' },
    { id: 'D-1002', name: 'Maria Garcia', points: 300, date: '2023-09-14' },
    { id: 'D-1003', name: 'David Lee', points: 220, date: '2023-09-13' },
    { id: 'D-1004', name: 'Sarah Johnson', points: 280, date: '2023-09-10' },
    { id: 'D-1005', name: 'Michael Brown', points: 190, date: '2023-09-08' }
  ];
  
  // Mock data for blood inventory
  const [bloodInventory, setBloodInventory] = useState([
    { 
      id: 'BU-1001', 
      type: 'A+', 
      units: 150, 
      location: 'Storage A', 
      collected: '2023-08-15', 
      expiry: '2023-08-22', 
      status: 'Available',
      temperature: '4°C',
      donorId: 'D-5432',
      hospital: null,
      batchNo: 'B-202308-01'
    },
    { 
      id: 'BU-1002', 
      type: 'B+', 
      units: 120, 
      location: 'Storage B', 
      collected: '2023-08-16', 
      expiry: '2023-08-23', 
      status: 'Available',
      temperature: '4°C',
      donorId: 'D-5433',
      hospital: null,
      batchNo: 'B-202308-01'
    },
    { 
      id: 'BU-1003', 
      type: 'O-', 
      units: 75, 
      location: 'Storage C', 
      collected: '2023-08-14', 
      expiry: '2023-08-21', 
      status: 'Available',
      temperature: '4°C',
      donorId: 'D-5431',
      hospital: 'City General Hospital',
      batchNo: 'B-202308-01'
    },
    { 
      id: 'BU-1004', 
      type: 'AB+', 
      units: 50, 
      location: 'Storage A', 
      collected: '2023-08-12', 
      expiry: '2023-08-19', 
      status: 'Available',
      temperature: '4°C',
      donorId: 'D-5430',
      hospital: 'Memorial Hospital',
      batchNo: 'B-202308-01'
    },
    { 
      id: 'BU-1005', 
      type: 'A-', 
      units: 30, 
      location: 'Storage B', 
      collected: '2023-08-13', 
      expiry: '2023-08-20', 
      status: 'Quarantined',
      temperature: '4°C',
      donorId: 'D-5429',
      hospital: null,
      batchNo: 'B-202308-02'
    },
    { 
      id: 'BU-1006', 
      type: 'O+', 
      units: 200, 
      location: 'Storage C', 
      collected: '2023-08-17', 
      expiry: '2023-08-24', 
      status: 'Available',
      temperature: '4°C',
      donorId: 'D-5434',
      hospital: null,
      batchNo: 'B-202308-02'
    },
    { 
      id: 'BU-1007', 
      type: 'B-', 
      units: 35, 
      location: 'Storage A', 
      collected: '2023-08-11', 
      expiry: '2023-08-18', 
      status: 'Available',
      temperature: '4°C',
      donorId: 'D-5428',
      hospital: null,
      batchNo: 'B-202308-02'
    },
    { 
      id: 'BU-1008', 
      type: 'AB-', 
      units: 20, 
      location: 'Storage B', 
      collected: '2023-08-10', 
      expiry: '2023-08-17', 
      status: 'Critical',
      temperature: '5°C',
      donorId: 'D-5427',
      hospital: null,
      batchNo: 'B-202308-02'
    }
  ]);

  // Blood type summary
  const bloodTypeSummary = [
    { type: 'A+', available: 150, total: 150 },
    { type: 'A-', available: 30, total: 30 },
    { type: 'B+', available: 120, total: 120 },
    { type: 'B-', available: 35, total: 35 },
    { type: 'AB+', available: 50, total: 50 },
    { type: 'AB-', available: 20, total: 20 },
    { type: 'O+', available: 200, total: 200 },
    { type: 'O-', available: 75, total: 75 },
  ];

  const bloodTypes = ['All', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const statuses = ['All', 'Available', 'Quarantined', 'Critical'];

  // Filter blood inventory based on search term and selected filters
  const filteredInventory = bloodInventory.filter(item => {
    return (
      (searchTerm === '' || 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.batchNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.donorId.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedBloodType === 'All' || item.type === selectedBloodType) &&
      (selectedStatus === 'All' || item.status === selectedStatus)
    );
  });

  // Sort function
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Apply sorting
  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Quarantined': return 'bg-yellow-100 text-yellow-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Toggle row expansion
  const toggleExpand = (id) => {
    setExpandedBatch(expandedBatch === id ? null : id);
  };

  // Expiry alert function
  const getExpiryAlert = (expiryDate) => {
    const daysUntilExpiry = getDaysUntilExpiry(expiryDate);
    if (daysUntilExpiry <= 1) {
      return { className: 'text-red-600 font-bold', alert: true, message: 'Expires today!' };
    } else if (daysUntilExpiry <= 3) {
      return { className: 'text-orange-600 font-medium', alert: true, message: `Expires in ${daysUntilExpiry} days` };
    } else {
      return { className: 'text-gray-600', alert: false, message: `${daysUntilExpiry} days left` };
    }
  };

  // Handle checkbox selection
  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedItems([]);
  };

  // Select all items
  const selectAllItems = () => {
    if (selectedItems.length === filteredInventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredInventory.map(item => item.id));
    }
  };

  // Handle batch actions
  const handleBatchAction = (action) => {
    switch (action) {
      case 'delete':
        setShowDeleteModal(true);
        break;
      default:
        break;
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Reset form data
  const resetFormData = () => {
    setFormData({
      id: `BU-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'A+',
      units: 1,
      location: 'Storage A',
      collected: new Date().toISOString().split('T')[0],
      expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Available',
      temperature: '4°C',
      donorId: `D-${Math.floor(1000 + Math.random() * 9000)}`,
      hospital: '',
      batchNo: `B-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${Math.floor(1 + Math.random() * 99).toString().padStart(2, '0')}`
    });
  };

  // Open add modal
  const openAddModal = () => {
    resetFormData();
    setShowAddModal(true);
  };

  // Open edit modal
  const openEditModal = (item) => {
    setFormData({
      ...item
    });
    setShowEditModal(true);
  };

  // Handle add blood unit
  const handleAddBloodUnit = () => {
    setBloodInventory([formData, ...bloodInventory]);
    setShowAddModal(false);
    
    // Update blood type summary
    const updatedSummary = bloodTypeSummary.map(type => {
      if (type.type === formData.type) {
        return {
          ...type,
          available: formData.status === 'Available' ? type.available + formData.units : type.available,
          total: type.total + formData.units
        };
      }
      return type;
    });
    
    // Here you would typically make an API call to save the data
  };

  // Handle edit blood unit
  const handleEditBloodUnit = () => {
    const updatedInventory = bloodInventory.map(item => 
      item.id === formData.id ? formData : item
    );
    setBloodInventory(updatedInventory);
    setShowEditModal(false);
    
    // Here you would typically make an API call to update the data
  };

  // Handle delete blood units
  const handleDeleteBloodUnits = () => {
    const updatedInventory = bloodInventory.filter(item => !selectedItems.includes(item.id));
    setBloodInventory(updatedInventory);
    setShowDeleteModal(false);
    setSelectedItems([]);
    setIsSelectMode(false);
    
    // Here you would typically make an API call to delete the data
  };

  // Handle view details
  const handleViewDetails = (item) => {
    setCurrentDetailItem(item);
    setView('details');
  };

  // Handle print inventory
  const handlePrintInventory = () => {
    const printContent = document.getElementById('printSection');
    const originalBody = document.body.innerHTML;

    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalBody;
    
    // Reload the component after printing
    window.location.reload();
  };

  // Handle print donor claim voucher
  const handlePrintVoucher = (donorId, selectedUnits) => {
    // Get donor information
    const donor = claimingDonors.find(d => d.id === donorId);
    if (!donor) return;
    
    // Generate request ID and timestamp
    const requestId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    const requestDate = new Date().toLocaleDateString();
    
    // Create voucher content
    const voucherHtml = `
      <div style="font-family: 'Arial', sans-serif; max-width: 800px; margin: 0 auto; padding: 30px; border: 2px solid #e11d48; border-radius: 10px; position: relative;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #e11d48; padding-bottom: 20px;">
          <div>
            <h1 style="margin: 0; color: #e11d48; font-size: 28px;">RedSource Blood Bank</h1>
            <p style="margin: 5px 0 0; color: #666;">Blood Donation Claim Voucher</p>
          </div>
          <div style="text-align: right;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background-color: #e11d48; color: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">
              <span>R+</span>
            </div>
          </div>
        </div>
        
        <!-- Watermark -->
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 100px; opacity: 0.05; color: #e11d48; font-weight: bold; pointer-events: none; white-space: nowrap;">
          RedSource
        </div>
        
        <!-- Request Info -->
        <div style="margin-bottom: 20px; background-color: #f9f9f9; border-left: 4px solid #e11d48; padding: 15px;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <h3 style="margin: 0 0 5px; font-size: 16px; color: #333;">Blood Bag Request</h3>
              <p style="margin: 0; font-size: 14px;"><strong>Request ID:</strong> ${requestId}</p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; padding: 5px 10px; background-color: #FEF9C3; border-radius: 15px; color: #854D0E; font-size: 12px; font-weight: bold;">Accepted</span>
              <p style="margin: 5px 0 0; font-size: 14px;"><strong>Date:</strong> ${requestDate}</p>
            </div>
          </div>
        </div>
        
        <!-- Donor Information -->
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">Donor Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; width: 40%;"><strong>Donor ID:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${donor.id}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Donor Name:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${donor.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Donor Points:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${donor.points} points</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Claim Date:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #eee;">${requestDate}</td>
            </tr>
          </table>
        </div>
        
        <!-- Blood Units Info -->
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">Blood Units Claimed</h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
            <thead>
              <tr style="background-color: #f9f9f9;">
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Unit ID</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Blood Type</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Units</th>
                <th style="padding: 10px; text-align: left; border-bottom: 1px solid #ddd;">Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              ${selectedUnits.map(id => {
                const unit = bloodInventory.find(item => item.id === id);
                return unit ? `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${unit.id}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #e11d48;">${unit.type}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${unit.units}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${unit.expiry}</td>
                  </tr>
                ` : '';
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <!-- Validation Section -->
        <div style="margin-bottom: 30px; border: 1px dashed #ccc; padding: 15px; background-color: #f9f9f9;">
          <h2 style="font-size: 18px; margin-bottom: 15px; color: #333;">Voucher Validation</h2>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="margin: 0 0 5px; font-size: 14px;">To validate this voucher, scan the QR code or visit:</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold;">www.redsource.org/validate</p>
              <p style="margin: 5px 0 0; font-size: 14px;">Enter validation code: <strong style="font-family: monospace;">${requestId}-${donor.id}</strong></p>
            </div>
            <div style="width: 100px; height: 100px; background-color: #fff; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center;">
              <div style="font-size: 10px; text-align: center;">QR Code<br>Placeholder</div>
            </div>
          </div>
        </div>
        
        <!-- Terms & Signature -->
        <div style="display: flex; margin-top: 40px;">
          <div style="flex: 1;">
            <h3 style="font-size: 16px; margin-bottom: 10px; color: #333;">Terms & Conditions</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 12px;">
              <li>This voucher is valid for 30 days from the claim date.</li>
              <li>Blood units must be used for medical purposes only.</li>
              <li>RedSource is not responsible for improper handling after claim.</li>
              <li>For inquiries, contact our support at support@redsource.org</li>
            </ul>
          </div>
          <div style="flex: 1; text-align: right;">
            <div style="margin-top: 60px; border-top: 1px solid #333; display: inline-block; padding-top: 5px; width: 200px;">
              <p style="margin: 0; font-size: 12px; color: #666;">Authorized Signature</p>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #666;">
          <p style="margin: 0;">RedSource Blood Bank | 123 Medical Center Rd | City, State 12345</p>
          <p style="margin: 5px 0 0;">Phone: (123) 456-7890 | Email: info@redsource.org | www.redsource.org</p>
          <p style="margin: 15px 0 0; font-size: 10px;">Voucher ID: ${requestId}-${Date.now().toString(36).toUpperCase()}</p>
        </div>
      </div>
    `;
    
    // Print the voucher
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = voucherHtml;
    
    // Add print styles
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body { margin: 0; padding: 0; }
        @page { size: A4; margin: 0.5cm; }
      }
    `;
    document.head.appendChild(style);
    
    // Print and restore
    window.print();
    document.body.innerHTML = originalBody;
    window.location.reload();
  };

  // Handle export to CSV
  const handleExportCSV = () => {
    // Create header row with styling for Excel
    const header = [
      'ID', 'Type', 'Units', 'Location', 'Collected Date', 'Expiry Date', 
      'Status', 'Temperature', 'Donor ID', 'Hospital', 'Batch No'
    ];
    
    // Generate rows from filtered inventory
    const rows = filteredInventory.map(item => [
      item.id,
      item.type,
      item.units,
      item.location,
      item.collected,
      item.expiry,
      item.status,
      item.temperature,
      item.donorId,
      item.hospital || 'N/A',
      item.batchNo
    ]);
    
    // Create HTML table for Excel
    let excelContent = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    excelContent += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Blood Inventory</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>';
    excelContent += '<body>';
    excelContent += '<table border="1">';
    
    // Add header row with styling
    excelContent += '<tr style="font-weight: bold; background-color: #f2f2f2;">';
    header.forEach(cell => {
      excelContent += `<td style="padding: 5px;">${cell}</td>`;
    });
    excelContent += '</tr>';
    
    // Add data rows
    rows.forEach(row => {
      excelContent += '<tr>';
      row.forEach((cell, index) => {
        // Add styling based on cell type - example: color status cells
        let style = 'padding: 5px;';
        if (index === 6) { // Status column
          if (cell === 'Available') style += 'color: green;';
          else if (cell === 'Critical') style += 'color: red;';
          else if (cell === 'Quarantined') style += 'color: orange;';
        }
        excelContent += `<td style="${style}">${cell}</td>`;
      });
      excelContent += '</tr>';
    });
    
    excelContent += '</table>';
    excelContent += '</body>';
    excelContent += '</html>';
    
    // Create blob with Excel MIME type
    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `blood_inventory_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Apply advanced filters
  const applyAdvancedFilters = (inventory) => {
    return inventory.filter(item => {
      // Location filter
      if (advancedFilters.location !== 'All' && item.location !== advancedFilters.location) {
        return false;
      }
      
      // Collection date filters
      if (advancedFilters.collectedAfter && new Date(item.collected) < new Date(advancedFilters.collectedAfter)) {
        return false;
      }
      if (advancedFilters.collectedBefore && new Date(item.collected) > new Date(advancedFilters.collectedBefore)) {
        return false;
      }
      
      // Expiry date filters
      if (advancedFilters.expiryAfter && new Date(item.expiry) < new Date(advancedFilters.expiryAfter)) {
        return false;
      }
      if (advancedFilters.expiryBefore && new Date(item.expiry) > new Date(advancedFilters.expiryBefore)) {
        return false;
      }
      
      // Temperature filter
      if (advancedFilters.temperature !== 'All' && item.temperature !== advancedFilters.temperature) {
        return false;
      }
      
      return true;
    });
  };

  // Modal Components
  const renderAddModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between bg-gray-100 px-6 py-3 rounded-t-lg">
          <h3 className="text-lg font-medium">Add New Blood Unit</h3>
          <button 
            onClick={() => setShowAddModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                {bloodTypes.filter(type => type !== 'All').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
              <input
                type="number"
                name="units"
                value={formData.units}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                {locations.filter(loc => loc !== 'All').map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
              <input
                type="date"
                name="collected"
                value={formData.collected}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                name="expiry"
                value={formData.expiry}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                {statuses.filter(status => status !== 'All').map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <select
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                {temperatures.filter(temp => temp !== 'All').map(temp => (
                  <option key={temp} value={temp}>{temp}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donor ID</label>
              <input
                type="text"
                name="donorId"
                value={formData.donorId}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch No</label>
              <input
                type="text"
                name="batchNo"
                value={formData.batchNo}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 border rounded text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleAddBloodUnit}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Add Blood Unit
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEditModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between bg-gray-100 px-6 py-3 rounded-t-lg">
          <h3 className="text-lg font-medium">Edit Blood Unit</h3>
          <button 
            onClick={() => setShowEditModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                className="w-full p-2 border rounded bg-gray-100"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                {bloodTypes.filter(type => type !== 'All').map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
              <input
                type="number"
                name="units"
                value={formData.units}
                onChange={handleInputChange}
                min="1"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                {locations.filter(loc => loc !== 'All').map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collection Date</label>
              <input
                type="date"
                name="collected"
                value={formData.collected}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input
                type="date"
                name="expiry"
                value={formData.expiry}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                {statuses.filter(status => status !== 'All').map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <select
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                {temperatures.filter(temp => temp !== 'All').map(temp => (
                  <option key={temp} value={temp}>{temp}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donor ID</label>
              <input
                type="text"
                name="donorId"
                value={formData.donorId}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Batch No</label>
              <input
                type="text"
                name="batchNo"
                value={formData.batchNo}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border rounded text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleEditBloodUnit}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between bg-gray-100 px-6 py-3 rounded-t-lg">
          <h3 className="text-lg font-medium">Confirm Deletion</h3>
          <button 
            onClick={() => setShowDeleteModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-center justify-center text-red-600 mb-4">
            <FiAlertCircle size={50} />
          </div>
          <p className="text-center text-gray-700 mb-4">
            Are you sure you want to delete {selectedItems.length} selected blood unit(s)? This action cannot be undone.
          </p>
          
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border rounded text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteBloodUnits}
              className="px-4 py-2 bg-red-600 text-white rounded"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvancedFilterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between bg-gray-100 px-6 py-3 rounded-t-lg">
          <h3 className="text-lg font-medium">Advanced Filters</h3>
          <button 
            onClick={() => setShowAdvancedFilterModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select
                value={advancedFilters.location}
                onChange={(e) => setAdvancedFilters({...advancedFilters, location: e.target.value})}
                className="w-full p-2 border rounded"
              >
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <select
                value={advancedFilters.temperature}
                onChange={(e) => setAdvancedFilters({...advancedFilters, temperature: e.target.value})}
                className="w-full p-2 border rounded"
              >
                {temperatures.map(temp => (
                  <option key={temp} value={temp}>{temp}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collected After</label>
              <input
                type="date"
                value={advancedFilters.collectedAfter}
                onChange={(e) => setAdvancedFilters({...advancedFilters, collectedAfter: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collected Before</label>
              <input
                type="date"
                value={advancedFilters.collectedBefore}
                onChange={(e) => setAdvancedFilters({...advancedFilters, collectedBefore: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires After</label>
              <input
                type="date"
                value={advancedFilters.expiryAfter}
                onChange={(e) => setAdvancedFilters({...advancedFilters, expiryAfter: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires Before</label>
              <input
                type="date"
                value={advancedFilters.expiryBefore}
                onChange={(e) => setAdvancedFilters({...advancedFilters, expiryBefore: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              onClick={() => {
                setAdvancedFilters({
                  location: 'All',
                  collectedAfter: '',
                  collectedBefore: '',
                  expiryAfter: '',
                  expiryBefore: '',
                  temperature: 'All'
                });
              }}
              className="px-4 py-2 border rounded text-gray-700"
            >
              Reset Filters
            </button>
            <div className="space-x-2">
              <button
                onClick={() => setShowAdvancedFilterModal(false)}
                className="px-4 py-2 border rounded text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAdvancedFilterModal(false)}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Handle showing blood bag requests view
  const handleShowBloodBagRequests = () => {
    setShowRequestsView(true);
    setView('requests');
  };

  // Detail view component
  const renderDetailView = () => {
    if (!currentDetailItem) return null;
    
    const expiryInfo = getExpiryAlert(currentDetailItem.expiry);
    
    return (
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => setView('inventory')}
          className="flex items-center text-red-600 hover:text-red-800 mb-6"
        >
          <FiArrowLeft className="mr-2" /> Back to Inventory
        </button>
        
        <div className="bg-white rounded-lg shadow-md">
          <div className="bg-red-600 text-white p-6 rounded-t-lg">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Blood Unit Details</h1>
              <div className="flex space-x-2">
                <button 
                  onClick={() => openEditModal(currentDetailItem)}
                  className="p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30"
                >
                  <FiEdit className="text-white" />
                </button>
              </div>
            </div>
            <div className="flex items-center mt-2">
              <span className={`px-3 py-1 rounded-full text-sm bg-white ${
                currentDetailItem.status === 'Available' ? 'text-green-600' : 
 
                currentDetailItem.status === 'Quarantined' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {currentDetailItem.status}
              </span>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FiPackage className="mr-2 text-red-600" />
                  Basic Information
                </h2>
                
                <table className="w-full mb-6">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600 font-medium">ID</td>
                      <td className="py-2 text-gray-900">{currentDetailItem.id}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600 font-medium">Blood Type</td>
                      <td className="py-2 text-gray-900 font-bold">{currentDetailItem.type}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600 font-medium">Units</td>
                      <td className="py-2 text-gray-900">{currentDetailItem.units}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600 font-medium">Donor ID</td>
                      <td className="py-2 text-gray-900">{currentDetailItem.donorId}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600 font-medium">Batch No</td>
                      <td className="py-2 text-gray-900">{currentDetailItem.batchNo}</td>
                    </tr>
                  </tbody>
                </table>
                
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FiMap className="mr-2 text-red-600" />
                  Storage Information
                </h2>
                
                <table className="w-full">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600 font-medium">Location</td>
                      <td className="py-2 text-gray-900">{currentDetailItem.location}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600 font-medium">Temperature</td>
                      <td className="py-2 text-gray-900">{currentDetailItem.temperature}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600 font-medium">Status</td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(currentDetailItem.status)}`}>
                          {currentDetailItem.status}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FiCalendar className="mr-2 text-red-600" />
                  Timeline
                </h2>
                
                <table className="w-full mb-6">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600 font-medium">Collected Date</td>
                      <td className="py-2 text-gray-900">{currentDetailItem.collected}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 text-gray-600 font-medium">Expiry Date</td>
                      <td className={`py-2 ${expiryInfo.className}`}>
                        {currentDetailItem.expiry}
                        {expiryInfo.alert && (
                          <div className="flex items-center mt-1 text-xs">
                            <FiAlertCircle className="mr-1" />
                            {expiryInfo.message}
                          </div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="mt-8 space-y-4">
                  <button 
                    onClick={() => openEditModal(currentDetailItem)}
                    className="w-full py-2 bg-blue-600 text-white rounded-md flex items-center justify-center"
                  >
                    <FiEdit className="mr-2" /> Edit Unit Details
                  </button>
                  
                  <button 
                    onClick={handleShowBloodBagRequests}
                    className="w-full py-2 bg-green-600 text-white rounded-md flex items-center justify-center"
                  >
                    <FiCornerUpRight className="mr-2" /> Process Donor Claim
                  </button>
                  
                  <button 
                    onClick={() => {
                      setSelectedItems([currentDetailItem.id]);
                      setShowDeleteModal(true);
                    }}
                    className="w-full py-2 bg-red-600 text-white rounded-md flex items-center justify-center"
                  >
                    <FiTrash2 className="mr-2" /> Delete Unit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        
      </div>
    );
  };

  const renderInventoryOverview = () => {
    // Apply advanced filters to the filtered inventory
    const advancedFilteredInventory = applyAdvancedFilters(filteredInventory);
    
    // Apply sorting to the advanced filtered inventory
    const finalSortedInventory = [...advancedFilteredInventory].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Blood Inventory Management</h1>
            <p className="text-gray-600">Track, manage, and monitor blood supplies</p>
          </div>
          <button 
            onClick={() => setShowValidationModal(true)}
            className="mt-2 sm:mt-0 flex items-center bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiCheck className="mr-2" /> Validate Donor Voucher
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Blood Units</p>
                <p className="text-2xl font-bold">
                  {bloodInventory.reduce((acc, item) => acc + item.units, 0)}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <FiPackage className="text-red-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expiring Soon</p>
                <p className="text-2xl font-bold">
                  {bloodInventory.filter(item => getDaysUntilExpiry(item.expiry) <= 3).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <FiClock className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical Storage</p>
                <p className="text-2xl font-bold">
                  {bloodInventory.filter(item => item.status === 'Critical').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <FiAlertCircle className="text-red-600 text-xl" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Temperature Monitoring</p>
                <p className="text-2xl font-bold">
                  Normal
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <FiThermometer className="text-blue-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Blood Type Summary */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <FiBarChart2 className="mr-2 text-red-600" />
              Blood Type Summary
            </h2>
            <button 
              onClick={handleExportCSV}
              className="text-sm text-red-600 flex items-center"
            >
              <FiDownload className="mr-1" />
              Export
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {bloodTypeSummary.map((type) => (
              <div key={type.type} className="border rounded-lg p-3 text-center">
                <div className="text-xl font-bold">{type.type}</div>
                <div className="text-sm text-gray-500">Available: <span className="font-medium text-green-600">{type.available}</span></div>
                <div className="mt-1 h-1 bg-gray-200 rounded-full">
                  <div
                    className="h-1 bg-red-600 rounded-full"
                    style={{ width: `${(type.available / type.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Inventory List */}
        <div className="bg-white p-4 rounded-lg shadow" id="printSection" ref={printSectionRef}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h2 className="text-lg font-semibold mb-2 sm:mb-0">Inventory List</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <button 
                onClick={openAddModal}
                className="bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <FiPlus className="mr-1" />
                Add New
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm flex items-center"
              >
                <FiRefreshCw className="mr-1" />
                Refresh
              </button>
              <button 
                onClick={handlePrintInventory}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
              >
                <FiPrinter className="mr-1" />
                Print
              </button>
              <button 
                onClick={toggleSelectMode}
                className={`${isSelectMode ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'} px-3 py-1 rounded-md text-sm flex items-center`}
              >
                {isSelectMode ? <FiX className="mr-1" /> : <FiCheck className="mr-1" />}
                {isSelectMode ? 'Cancel Selection' : 'Select Mode'}
              </button>
            </div>
          </div>

          {/* Batch actions when in select mode */}
          {isSelectMode && selectedItems.length > 0 && (
            <div className="bg-gray-100 p-3 rounded-md mb-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">{selectedItems.length} items selected</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleBatchAction('delete')}
                  className="bg-red-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                >
                  <FiTrash2 className="mr-1" />
                  Delete
                </button>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by ID, batch, or donor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 border rounded-md"
              />
              <FiSearch className="absolute left-2.5 top-2.5 text-gray-400" />
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedBloodType}
                onChange={(e) => setSelectedBloodType(e.target.value)}
                className="border rounded-md p-2 text-sm"
              >
                {bloodTypes.map(type => (
                  <option key={type} value={type}>{type} Type</option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded-md p-2 text-sm"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status} Status</option>
                ))}
              </select>
              
              <button 
                onClick={() => setShowAdvancedFilterModal(true)}
                className="bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm flex items-center"
              >
                <FiFilter className="mr-1" />
                More Filters
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {isSelectMode && (
                    <th scope="col" className="px-6 py-3 text-left">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.length === finalSortedInventory.length && finalSortedInventory.length > 0}
                        onChange={selectAllItems}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('id')}>
                    <div className="flex items-center">
                      ID
                      {sortConfig.key === 'id' && (
                        sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('type')}>
                    <div className="flex items-center">
                      Type
                      {sortConfig.key === 'type' && (
                        sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('units')}>
                    <div className="flex items-center">
                      Units
                      {sortConfig.key === 'units' && (
                        sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('location')}>
                    <div className="flex items-center">
                      Location
                      {sortConfig.key === 'location' && (
                        sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('expiry')}>
                    <div className="flex items-center">
                      Expiry
                      {sortConfig.key === 'expiry' && (
                        sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('status')}>
                    <div className="flex items-center">
                      Status
                      {sortConfig.key === 'status' && (
                        sortConfig.direction === 'asc' ? <FiChevronUp className="ml-1" /> : <FiChevronDown className="ml-1" />
                      )}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {finalSortedInventory.map((item) => {
                  const expiryInfo = getExpiryAlert(item.expiry);
                  return (
                    <React.Fragment key={item.id}>
                      <tr className={`hover:bg-gray-50 ${isSelectMode ? '' : 'cursor-pointer'}`} onClick={isSelectMode ? undefined : () => toggleExpand(item.id)}>
                        {isSelectMode && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input 
                              type="checkbox" 
                              checked={selectedItems.includes(item.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectItem(item.id);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className="font-medium">{item.type}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.units}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className={expiryInfo.className}>
                            {item.expiry}
                            {expiryInfo.alert && (
                              <div className="flex items-center mt-1 text-xs">
                                <FiAlertCircle className="mr-1" />
                                {expiryInfo.message}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(item);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              View
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(item);
                              }}
                              className="text-red-600 hover:text-red-800"
                            >
                              Update
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedBatch === item.id && !isSelectMode && (
                        <tr className="bg-gray-50">
                          <td colSpan={isSelectMode ? "8" : "7"} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h3 className="text-sm font-medium mb-2">Collection Details</h3>
                                <p className="text-xs text-gray-600">Collected: {item.collected}</p>
                                <p className="text-xs text-gray-600">Donor ID: {item.donorId}</p>
                                <p className="text-xs text-gray-600">Batch No: {item.batchNo}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium mb-2">Storage Information</h3>
                                <p className="text-xs text-gray-600">Temperature: {item.temperature}</p>
                                <p className="text-xs text-gray-600">Location: {item.location}</p>
                              </div>
                              <div>
                                <h3 className="text-sm font-medium mb-2">Allocation Status</h3>
                                <p className="text-xs text-gray-600">Status: {item.status}</p>
                                <p className="text-xs text-gray-600">Expiry: {expiryInfo.message}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="py-3 flex items-center justify-between border-t border-gray-200 mt-4">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{finalSortedInventory.length}</span> of <span className="font-medium">{finalSortedInventory.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                    1
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // State for validation modal
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationCode, setValidationCode] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  
  // ... existing code ...
  
  // Handle voucher validation
  const handleValidateVoucher = () => {
    // Validate the voucher code
    if (!validationCode.trim()) {
      setValidationResult({
        status: 'error',
        message: 'Please enter a validation code'
      });
      return;
    }
    
    // Parse the validation code (format: REQ-XXXX-D-XXXX)
    const parts = validationCode.split('-');
    if (parts.length < 3) {
      setValidationResult({
        status: 'error',
        message: 'Invalid voucher format. Expected format: REQ-XXXX-D-XXXX'
      });
      return;
    }
    
    // Simulate validation success (in a real app, this would check against a database)
    setValidationResult({
      status: 'success',
      message: 'Voucher validated successfully!',
      details: {
        requestId: `${parts[0]}-${parts[1]}`,
        donorId: `${parts[2]}-${parts[3]}`,
        validatedOn: new Date().toLocaleString()
      }
    });
  };
  
  // Reset validation
  const resetValidation = () => {
    setValidationCode('');
    setValidationResult(null);
  };
  
  // Validation modal
  const renderValidationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between bg-gray-100 px-6 py-3 rounded-t-lg">
          <h3 className="text-lg font-medium">Validate Donor Voucher</h3>
          <button 
            onClick={() => {
              setShowValidationModal(false);
              resetValidation();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {!validationResult ? (
            <>
              <p className="text-gray-700 mb-4">
                Enter the validation code from the donor's voucher to verify its authenticity.
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Validation Code</label>
                <input
                  type="text"
                  value={validationCode}
                  onChange={(e) => setValidationCode(e.target.value)}
                  placeholder="e.g. REQ-1234-D-5678"
                  className="w-full p-2 border rounded"
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowValidationModal(false);
                    resetValidation();
                  }}
                  className="px-4 py-2 border rounded text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleValidateVoucher}
                  className="px-4 py-2 bg-green-600 text-white rounded flex items-center"
                >
                  <FiCheck className="mr-1" /> Validate
                </button>
              </div>
            </>
          ) : (
            <div>
              {validationResult.status === 'success' ? (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4 text-green-600">
                    <div className="bg-green-100 p-3 rounded-full">
                      <FiCheck size={30} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-green-600 mb-2">Voucher Validated!</h3>
                  <p className="text-gray-600 mb-4">{validationResult.message}</p>
                  
                  <div className="bg-gray-50 p-4 rounded-lg text-left mb-4">
                    <p className="text-sm text-gray-700"><strong>Request ID:</strong> {validationResult.details.requestId}</p>
                    <p className="text-sm text-gray-700"><strong>Donor ID:</strong> {validationResult.details.donorId}</p>
                    <p className="text-sm text-gray-700"><strong>Validated On:</strong> {validationResult.details.validatedOn}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4 text-red-600">
                    <div className="bg-red-100 p-3 rounded-full">
                      <FiX size={30} />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-red-600 mb-2">Validation Failed</h3>
                  <p className="text-gray-600 mb-4">{validationResult.message}</p>
                </div>
              )}
              
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => {
                    resetValidation();
                  }}
                  className="px-4 py-2 border rounded text-gray-700 mr-2"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setShowValidationModal(false);
                    resetValidation();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Format date helper function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Get status color for blood requests
  const getRequestStatusColor = (status) => {
    switch(status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Accepted': return 'bg-blue-100 text-blue-800';
      case 'Complete': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Mock data for blood bag requests
  const [pendingRequests, setPendingRequests] = useState([
    {
      id: 'REQ-001',
      donorName: 'Irish Lince',
      donorId: 'D-4578',
      bloodType: 'O+',
      units: 1,
      requestDate: '2024-04-18',
      status: 'Pending'
    },
    {
      id: 'REQ-002',
      donorName: 'Jane Smith',
      donorId: 'D-3692',
      bloodType: 'A-',
      units: 2,
      requestDate: '2024-04-17',
      status: 'Pending'
    },
    {
      id: 'REQ-003',
      donorName: 'Mark Johnson',
      donorId: 'D-5123',
      bloodType: 'AB+',
      units: 1,
      requestDate: '2024-04-15',
      status: 'Accepted'
    },
    {
      id: 'REQ-004',
      donorName: 'Sarah Williams',
      donorId: 'D-4211',
      bloodType: 'B+',
      units: 1,
      requestDate: '2024-04-10',
      status: 'Complete'
    }
  ]);

  return (
    <div>
      {view === 'inventory' && renderInventoryOverview()}
      {view === 'details' && renderDetailView()}
      {view === 'requests' && (
        <BloodBagRequests
          pendingRequests={pendingRequests}
          setPendingRequests={setPendingRequests}
          setView={setView}
          setShowValidationModal={setShowValidationModal}
          formatDate={formatDate}
          getRequestStatusColor={getRequestStatusColor}
        />
      )}
      
      {/* Modals */}
      {showAddModal && renderAddModal()}
      {showEditModal && renderEditModal()}
      {showDeleteModal && renderDeleteModal()}
      {showAdvancedFilterModal && renderAdvancedFilterModal()}
      {showValidationModal && renderValidationModal()}
    </div>
  );
};

export default Inventory; 