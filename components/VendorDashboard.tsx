import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRight, 
  MapPin, 
  Truck, 
  Clock, 
  TrendingDown, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  ChevronRight,
  Send,
  Search,
  Timer,
  X,
  Phone,
  User as UserIcon,
  Filter,
  ChevronDown,
  ArrowUpDown,
  Play,
  Pause,
  Trophy
} from 'lucide-react';

import { ShipmentBid, BidStatus, BidOffer, VehicleDetails, Notification, User } from '../types';

interface VehicleDetails {
  vehicleNumber: string;
  vehicleType: string;
  driverName: string;
  driverPhone: string;
  expectedDispatch: string;
}

interface ShipmentBid {
  id: string;
  origin: string;
  destination: string;
  lane: string;
  vehicleType: string;
  loadType: string;
  materialType: string;
  capacity: string;
  pickupTime: number;
  status: BidStatus;
  offers: BidOffer[];
  winningVendorId?: string;
  counterOffer?: number;
  finalAmount?: number;
  vehicleDetailsSubmitted?: boolean;
  // Vehicle & Driver details (populated after submission)
  vehicleNumber?: string;
  driverName?: string;
  driverContact?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'vendor';
  lanes?: string[];
}

interface Notification {
  id: string;
  type: 'success' | 'alert' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read?: boolean;
}

type VendorBidFilter = 'all' | 'active' | 'won' | 'lost' | 'newest' | 'oldest';

interface VendorDashboardProps {
  currentUser: User;
  bids: ShipmentBid[];
  onPlaceOffer: (bidId: string, vendorId: string, vendorName: string, amount: number) => void;
  onRespondToCounter: (bidId: string, accept: boolean) => void;
  onSubmitVehicle: (bidId: string, details: VehicleDetails) => void;
  notifications: Notification[];
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ 
  currentUser, 
  bids, 
  onPlaceOffer, 
  onRespondToCounter,
  onSubmitVehicle,
  notifications 
}) => {
  const [bidAmount, setBidAmount] = useState<{[key: string]: string}>({});
  const [selectedBid, setSelectedBid] = useState<ShipmentBid | null>(null);
  
  // Track vehicle details per bid
  const [vehicleDetailsByBid, setVehicleDetailsByBid] = useState<{[bidId: string]: VehicleDetails}>({});

  // Filter state
  const [bidFilter, setBidFilter] = useState<VendorBidFilter>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize vehicle details for a bid
  const getVehicleDetails = (bidId: string): VehicleDetails => {
    return vehicleDetailsByBid[bidId] || {
      vehicleNumber: '',
      vehicleType: '',
      driverName: '',
      driverPhone: '',
      expectedDispatch: ''
    };
  };

  const updateVehicleDetails = (bidId: string, field: keyof VehicleDetails, value: string) => {
    setVehicleDetailsByBid(prev => ({
      ...prev,
      [bidId]: {
        ...getVehicleDetails(bidId),
        [field]: value
      }
    }));
  };

  const getTimeRemaining = (bid: ShipmentBid) => {
    const end = new Date(`${bid.bidEndDate}T${bid.bidEndTime}`);
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return "Ended";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${mins}m ${secs}s`;
  };

  const matchingBids = useMemo(() => {
    return bids.filter(bid => currentUser.lanes?.includes(bid.lane));
  }, [bids, currentUser.lanes]);

  // Helper functions - must be defined before use
  const myRank = (bid: ShipmentBid) => {
    if (!bid.offers || bid.offers.length === 0) return null;
    const sortedOffers = [...bid.offers].sort((a, b) => a.amount - b.amount);
    const index = sortedOffers.findIndex(o => o.vendorId === currentUser.id);
    return index === -1 ? null : index + 1;
  };

  const myOffer = (bid: ShipmentBid) => {
    if (!bid.offers || bid.offers.length === 0) return undefined;
    return bid.offers.find(o => o.vendorId === currentUser.id);
  };

  // Check if auction has ended based on time
  const isAuctionEnded = (bid: ShipmentBid) => {
    const end = new Date(`${bid.bidEndDate}T${bid.bidEndTime}`);
    return now >= end;
  };

  // Check if vendor is L1 (lowest bidder / rank 1)
  const isVendorL1 = (bid: ShipmentBid) => {
    return myRank(bid) === 1;
  };

  // Get vendor-specific bid status
  const getVendorBidStatus = (bid: ShipmentBid) => {
    const auctionEnded = isAuctionEnded(bid) || bid.status === BidStatus.CLOSED;
    const isWinner = bid.winningVendorId === currentUser.id || (auctionEnded && isVendorL1(bid));
    const hasParticipated = myOffer(bid) !== undefined;
    
    if (isWinner) return 'won';
    if (auctionEnded && hasParticipated && !isWinner) return 'lost';
    if (!auctionEnded && bid.status === BidStatus.OPEN) return 'active';
    return 'other';
  };

  // Filtered and sorted bids based on selected filter
  const filteredMatchingBids = useMemo(() => {
    let result = [...matchingBids];
    
    switch (bidFilter) {
      case 'active':
        result = result.filter(b => !isAuctionEnded(b) && b.status === BidStatus.OPEN);
        break;
      case 'won':
        result = result.filter(b => getVendorBidStatus(b) === 'won');
        break;
      case 'lost':
        result = result.filter(b => getVendorBidStatus(b) === 'lost');
        break;
      case 'newest':
        result = result.sort((a, b) => {
          const dateA = new Date(`${a.bidStartDate}T${a.bidStartTime || '00:00'}`);
          const dateB = new Date(`${b.bidStartDate}T${b.bidStartTime || '00:00'}`);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case 'oldest':
        result = result.sort((a, b) => {
          const dateA = new Date(`${a.bidStartDate}T${a.bidStartTime || '00:00'}`);
          const dateB = new Date(`${b.bidStartDate}T${b.bidStartTime || '00:00'}`);
          return dateA.getTime() - dateB.getTime();
        });
        break;
      case 'all':
      default:
        // Default: show newest first
        result = result.sort((a, b) => {
          const dateA = new Date(`${a.bidStartDate}T${a.bidStartTime || '00:00'}`);
          const dateB = new Date(`${b.bidStartDate}T${b.bidStartTime || '00:00'}`);
          return dateB.getTime() - dateA.getTime();
        });
        break;
    }
    
    return result;
  }, [matchingBids, bidFilter, now, currentUser.id]);

  // Filter options configuration
  const filterOptions: { value: VendorBidFilter; label: string; icon: React.ReactNode; count?: number }[] = [
    { value: 'all', label: 'All Loads', icon: <Filter className="w-3.5 h-3.5" />, count: matchingBids.length },
    { value: 'active', label: 'Active', icon: <Play className="w-3.5 h-3.5" />, count: matchingBids.filter(b => !isAuctionEnded(b) && b.status === BidStatus.OPEN).length },
    { value: 'won', label: 'Won', icon: <Trophy className="w-3.5 h-3.5" />, count: matchingBids.filter(b => getVendorBidStatus(b) === 'won').length },
    { value: 'lost', label: 'Lost', icon: <X className="w-3.5 h-3.5" />, count: matchingBids.filter(b => getVendorBidStatus(b) === 'lost').length },
    { value: 'newest', label: 'Newest First', icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
    { value: 'oldest', label: 'Oldest First', icon: <ArrowUpDown className="w-3.5 h-3.5 rotate-180" /> },
  ];

  const handleBidding = (bidId: string) => {
    const amount = parseInt(bidAmount[bidId]);
    if (!amount || isNaN(amount)) {
      alert('Please enter a valid bid amount');
      return;
    }
    onPlaceOffer(bidId, currentUser.id, currentUser.name, amount);
    setBidAmount({...bidAmount, [bidId]: ''});
  };

  const handleSubmitVehicleDetails = (bidId: string) => {
    const details = getVehicleDetails(bidId);
    
    // Validate required fields
    if (!details.vehicleNumber.trim()) {
      alert('Please enter the vehicle number');
      return;
    }
    if (!details.driverName.trim()) {
      alert('Please enter the driver name');
      return;
    }
    if (!details.driverPhone.trim()) {
      alert('Please enter the driver contact number');
      return;
    }

    onSubmitVehicle(bidId, details);
  };

  const getStatusDisplay = (status: BidStatus, bid: ShipmentBid) => {
    const winner = bid.winningVendorId === currentUser.id;
    const auctionEnded = isAuctionEnded(bid) || status === BidStatus.CLOSED;
    const isL1Winner = auctionEnded && isVendorL1(bid);
    
    // Show WINNER if explicitly marked or if L1 when auction ended
    if ((status === BidStatus.FINALIZED && winner) || isL1Winner) {
      return { label: 'WINNER', color: 'bg-emerald-500 text-white' };
    }
    if (status === BidStatus.FINALIZED && !winner) return { label: 'LOST', color: 'bg-slate-400 text-white' };
    if (status === BidStatus.NEGOTIATING && bid.winningVendorId === currentUser.id) return { label: 'NEGOTIATION', color: 'bg-blue-500 text-white' };
    
    // Show AUCTION ENDED if time has expired but status not updated yet
    if (auctionEnded && status === BidStatus.OPEN) {
      return { label: 'AUCTION ENDED', color: 'bg-amber-100 text-amber-700' };
    }
    
    switch (status) {
      case BidStatus.OPEN: return { label: 'ACTIVE', color: 'bg-emerald-100 text-emerald-700' };
      case BidStatus.CLOSED: return { label: 'AUCTION ENDED', color: 'bg-amber-100 text-amber-700' };
      default: return { label: status, color: 'bg-slate-100 text-slate-700' };
    }
  };

  // Check if vendor is winner and needs to submit vehicle details
  // This should show when:
  // 1. Auction has ended (time expired) OR status is FINALIZED/ASSIGNED
  // 2. Vendor is rank #1 (L1) OR explicitly marked as winner
  // 3. Vehicle details not yet submitted
  const isWinnerNeedingVehicleDetails = (bid: ShipmentBid) => {
    const auctionEnded = isAuctionEnded(bid) || bid.status === BidStatus.FINALIZED || bid.status === BidStatus.ASSIGNED || bid.status === BidStatus.CLOSED;
    const isWinner = bid.winningVendorId === currentUser.id || isVendorL1(bid);
    return auctionEnded && isWinner && !bid.vehicleDetailsSubmitted;
  };

  // Check if vehicle details are already submitted
  const hasSubmittedVehicleDetails = (bid: ShipmentBid) => {
    const auctionEnded = isAuctionEnded(bid) || bid.status === BidStatus.FINALIZED || bid.status === BidStatus.ASSIGNED || bid.status === BidStatus.CLOSED;
    const isWinner = bid.winningVendorId === currentUser.id || isVendorL1(bid);
    return auctionEnded && isWinner && bid.vehicleDetailsSubmitted;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome & Registered Lanes */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 space-y-4">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800">Available Loads</h2>
          <p className="text-slate-500">Real-time matching for your registered lanes</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className={`bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center space-x-2 hover:bg-slate-50 transition-all ${bidFilter !== 'all' ? 'border-blue-500 bg-blue-50' : ''}`}
            >
              <Filter className={`w-4 h-4 ${bidFilter !== 'all' ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className={`text-sm font-medium ${bidFilter !== 'all' ? 'text-blue-600' : 'text-slate-600'}`}>
                {filterOptions.find(f => f.value === bidFilter)?.label || 'Filter'}
              </span>
              {bidFilter !== 'all' && (
                <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {filteredMatchingBids.length}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFilterDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsFilterDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden">
                  <div className="p-2">
                    <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter by Status</p>
                    {filterOptions.filter(o => ['all', 'active', 'won', 'lost'].includes(o.value)).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setBidFilter(option.value);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                          bidFilter === option.value
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {option.icon}
                          <span className="font-medium">{option.label}</span>
                        </div>
                        {option.count !== undefined && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            bidFilter === option.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {option.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 p-2">
                    <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sort by Date</p>
                    {filterOptions.filter(o => ['newest', 'oldest'].includes(o.value)).map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setBidFilter(option.value);
                          setIsFilterDropdownOpen(false);
                        }}
                        className={`w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                          bidFilter === option.value
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {option.icon}
                        <span className="font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                  {bidFilter !== 'all' && (
                    <div className="border-t border-slate-100 p-2">
                      <button
                        onClick={() => {
                          setBidFilter('all');
                          setIsFilterDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-sm text-rose-600 hover:bg-rose-50 transition-all"
                      >
                        <X className="w-4 h-4" />
                        <span className="font-medium">Clear Filter</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Lanes pills */}
          <div className="hidden md:flex items-center space-x-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Your Lanes:</span>
            {currentUser.lanes?.map(lane => (
              <span key={lane} className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 shadow-sm whitespace-nowrap">
                {lane}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Lanes Display */}
      <div className="flex md:hidden items-center space-x-2 overflow-x-auto pb-4 mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Your Lanes:</span>
        {currentUser.lanes?.map(lane => (
          <span key={lane} className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[10px] font-bold text-slate-600 shadow-sm whitespace-nowrap">
            {lane}
          </span>
        ))}
      </div>

      {/* Active filter indicator */}
      {bidFilter !== 'all' && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 mb-6">
          <p className="text-sm text-blue-700">
            Showing <span className="font-bold">{filteredMatchingBids.length}</span> {filteredMatchingBids.length === 1 ? 'load' : 'loads'} 
            {' '}matching "<span className="font-medium">{filterOptions.find(f => f.value === bidFilter)?.label}</span>"
          </p>
          <button
            onClick={() => setBidFilter('all')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Bid Listings */}
        <div className="lg:w-2/3 space-y-6">
          {filteredMatchingBids.length > 0 ? (
            filteredMatchingBids.map(bid => {
              const status = getStatusDisplay(bid.status, bid);
              const rank = myRank(bid);
              const offer = myOffer(bid);
              const vehicleDetails = getVehicleDetails(bid.id);
              const showVehicleForm = isWinnerNeedingVehicleDetails(bid);
              const vehicleSubmitted = hasSubmittedVehicleDetails(bid);

              return (
                <div 
                  key={bid.id} 
                  className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all hover:shadow-md ${selectedBid?.id === bid.id ? 'ring-2 ring-blue-500' : 'border-slate-200'}`}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="bg-slate-50 p-3 rounded-2xl">
                          <MapPin className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xl font-bold text-slate-800">{bid.origin}</h4>
                            <ArrowRight className="w-4 h-4 text-slate-300" />
                            <h4 className="text-xl font-bold text-slate-800">{bid.destination}</h4>
                          </div>
                          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">ID: {bid.id} • {bid.lane}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Vehicle Type</p>
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Truck className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-semibold">{bid.vehicleType} ({bid.loadType})</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Material / Weight</p>
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-semibold">{bid.materialType} • {bid.capacity}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Pickup Date</p>
                        <div className="flex items-center space-x-1.5 text-slate-700">
                          <Clock className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-semibold">{new Date(bid.pickupTime || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Time Remaining</p>
                        <div className="flex items-center space-x-1.5 text-rose-500">
                          <Timer className="w-4 h-4" />
                          <span className="text-sm font-bold">{getTimeRemaining(bid)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Vehicle Details Form for Winners */}
                    {showVehicleForm && (
                      <div className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-emerald-500 p-2 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-emerald-800">🎉 Congratulations! You Won This Bid</h4>
                            <p className="text-xs text-emerald-600">Please provide vehicle and driver details to proceed with dispatch</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Vehicle Number */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center space-x-1">
                              <Truck className="w-3 h-3" />
                              <span>Vehicle Number *</span>
                            </label>
                            <input 
                              className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                              placeholder="e.g. MH 12 AB 1234"
                              value={vehicleDetails.vehicleNumber}
                              onChange={e => updateVehicleDetails(bid.id, 'vehicleNumber', e.target.value)}
                            />
                          </div>
                          
                          {/* Driver Name */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center space-x-1">
                              <UserIcon className="w-3 h-3" />
                              <span>Driver Name *</span>
                            </label>
                            <input 
                              className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                              placeholder="e.g. Rajesh Kumar"
                              value={vehicleDetails.driverName}
                              onChange={e => updateVehicleDetails(bid.id, 'driverName', e.target.value)}
                            />
                          </div>
                          
                          {/* Driver Contact */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight flex items-center space-x-1">
                              <Phone className="w-3 h-3" />
                              <span>Driver Contact *</span>
                            </label>
                            <input 
                              className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                              placeholder="e.g. +91 98765 43210"
                              value={vehicleDetails.driverPhone}
                              onChange={e => updateVehicleDetails(bid.id, 'driverPhone', e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between">
                          <p className="text-[10px] text-slate-400">* All fields are required</p>
                          <button 
                            onClick={() => handleSubmitVehicleDetails(bid.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 transition-all flex items-center space-x-2"
                          >
                            <Send className="w-4 h-4" />
                            <span>Submit Details</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Vehicle Details Already Submitted - Show Summary */}
                    {vehicleSubmitted && (
                      <div className="mb-6 bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-5">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="bg-emerald-100 p-2 rounded-xl">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Vehicle Details Submitted</h4>
                            <p className="text-xs text-slate-500">Your dispatch details have been recorded</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white rounded-xl p-3 border border-slate-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <Truck className="w-4 h-4 text-blue-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Vehicle</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{bid.vehicleNumber || 'N/A'}</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-slate-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <UserIcon className="w-4 h-4 text-emerald-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Driver</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{bid.driverName || 'N/A'}</p>
                          </div>
                          <div className="bg-white rounded-xl p-3 border border-slate-200">
                            <div className="flex items-center space-x-2 mb-1">
                              <Phone className="w-4 h-4 text-amber-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Contact</span>
                            </div>
                            <p className="text-sm font-bold text-slate-800">{bid.driverContact || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-4 pt-6 border-t border-slate-50">
                      {/* Bidding Input (Only if Open) */}
                      {bid.status === BidStatus.OPEN && (
                        <div className="w-full md:w-auto flex-grow flex items-center space-x-2">
                          <div className="relative flex-grow">
                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                              type="number"
                              placeholder="Your Quote Amount"
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={bidAmount[bid.id] || ''}
                              onChange={e => setBidAmount({...bidAmount, [bid.id]: e.target.value})}
                            />
                          </div>
                          <button 
                            onClick={() => handleBidding(bid.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 transition-all flex items-center space-x-2"
                          >
                            <Send className="w-4 h-4" />
                            <span>Place Bid</span>
                          </button>
                        </div>
                      )}

                      {/* Rank / Status Displays */}
                      {offer && (
                        <div className="w-full md:w-auto flex items-center space-x-4">
                          <div className="bg-slate-100 px-4 py-2.5 rounded-2xl">
                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Your Last Bid</p>
                            <p className="text-sm font-black text-slate-800">₹{offer.amount.toLocaleString()}</p>
                          </div>
                          {rank && (
                            <div className={`px-4 py-2.5 rounded-2xl ${rank === 1 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}>
                              <p className={`text-[10px] font-bold uppercase mb-0.5 ${rank === 1 ? 'text-emerald-100' : 'text-slate-400'}`}>Current Rank</p>
                              <p className="text-sm font-black flex items-center space-x-1">
                                <span>#{rank}</span>
                                {rank === 1 && <CheckCircle2 className="w-3 h-3" />}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      <button 
                        onClick={() => setSelectedBid(bid)}
                        className="w-full md:w-auto p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors group"
                      >
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-800" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                {bidFilter !== 'all' ? (
                  <Filter className="w-8 h-8 text-slate-300" />
                ) : (
                  <Search className="w-8 h-8 text-slate-300" />
                )}
              </div>
              {bidFilter !== 'all' ? (
                <>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No Loads Found</h3>
                  <p className="text-slate-500 max-w-sm mx-auto mb-4">No loads match the "{filterOptions.find(f => f.value === bidFilter)?.label}" filter.</p>
                  <button
                    onClick={() => setBidFilter('all')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filter and show all loads
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">No Matching Shipments</h3>
                  <p className="text-slate-500 max-w-sm mx-auto">We'll notify you as soon as a load matching your registered lanes is published by WebXpress.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Pane: Actions & Notification Log */}
        <div className="lg:w-1/3 space-y-6">
          {/* Action Context Card */}
          {selectedBid && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-lg font-bold text-slate-800">Context Actions</h3>
                <button onClick={() => setSelectedBid(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Negotiation Section */}
              {selectedBid.status === BidStatus.NEGOTIATING && selectedBid.winningVendorId === currentUser.id && (
                <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <h4 className="text-sm font-bold text-blue-800">Counter Offer Available</h4>
                  </div>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    The admin has counter-offered <span className="font-bold">₹{selectedBid.counterOffer?.toLocaleString()}</span>. 
                    Your previous bid was ₹{(selectedBid.offers || [])[0]?.amount.toLocaleString()}.
                  </p>
                  <div className="flex space-x-3 pt-2">
                    <button 
                      onClick={() => onRespondToCounter(selectedBid.id, true)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-sm font-bold shadow-md shadow-emerald-100 transition-all"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => onRespondToCounter(selectedBid.id, false)}
                      className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}

              {/* Info when vehicle details form is shown in card */}
              {isWinnerNeedingVehicleDetails(selectedBid) && (
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-emerald-800">You Won This Auction!</h4>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Please fill in the vehicle and driver details in the form above to complete the dispatch assignment.
                  </p>
                  <div className="bg-white rounded-xl p-3 border border-emerald-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Final Amount</p>
                    <p className="text-lg font-black text-emerald-700">₹{selectedBid.finalAmount?.toLocaleString() || (selectedBid.offers || [])[0]?.amount.toLocaleString()}</p>
                  </div>
                </div>
              )}

              {selectedBid.status === BidStatus.ASSIGNED && (
                <div className="text-center py-10">
                  <div className="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="font-bold text-slate-800">Trip Assigned</h4>
                  <p className="text-xs text-slate-500 mt-2 px-4">The shipment is fully assigned. Prepare for pickup at the scheduled time.</p>
                </div>
              )}

              {/* Show submitted details in side panel too */}
              {hasSubmittedVehicleDetails(selectedBid) && (
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-800">Dispatch Details Confirmed</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Vehicle Number</span>
                      <span className="text-sm font-bold text-slate-800">{selectedBid.vehicleNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Driver Name</span>
                      <span className="text-sm font-bold text-slate-800">{selectedBid.driverName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Driver Contact</span>
                      <span className="text-sm font-bold text-slate-800">{selectedBid.driverContact}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Activity Logs / Notifications */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center justify-between">
              Activity Stream
              <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-black">LATEST</span>
            </h3>
            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div key={notif.id} className="flex space-x-4 border-b border-slate-50 pb-4">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                      notif.type === 'alert' ? 'bg-rose-100 text-rose-600' : 
                      notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <TrendingDown className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{notif.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                      <p className="text-[9px] text-slate-400 font-medium mt-1 uppercase">{new Date(notif.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 py-10">No recent activity found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;