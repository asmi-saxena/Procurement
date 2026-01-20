// src/hooks/useFirebaseData.ts
import { useState, useEffect } from 'react';
import { FirebaseService } from '../services/firebaseService';
import { ShipmentBid, Shipment, User, Lane } from '../../types';

export const useBids = () => {
  const [bids, setBids] = useState<ShipmentBid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.listenToShipmentBids((newBids) => {
      setBids(newBids);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { bids, loading };
};

export const useShipments = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.listenToShipments((newShipments) => {
      setShipments(newShipments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { shipments, loading };
};

export const useVendors = () => {
  const [vendors, setVendors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.listenToVendors((newVendors) => {
      setVendors(newVendors);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { vendors, loading };
};

export const useLanes = () => {
  const [lanes, setLanes] = useState<Lane[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = FirebaseService.listenToLanes((newLanes) => {
      setLanes(newLanes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { lanes, loading };
};