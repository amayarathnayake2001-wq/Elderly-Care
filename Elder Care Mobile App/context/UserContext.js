import React, { createContext, useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { Audio } from 'expo-av';
import { database } from '../services/firebaseConfig';
import { firebaseConfig } from '../services/firebaseConfig'; // Will export this as well
export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const knownAlertsRef = useRef(new Set(["-P0AnQx8fCUTJ7Uo-_ik"]));
  const isFirstFetch = useRef(true);

  const [caregiver, setCaregiver] = useState({
    name: 'Caregiver Name',
    role: 'Primary Contact',
    email: 'caregiver@email.com',
    phone: '+94 77 000 0000',
    secondaryPhone: '',
    address: '',
    username: 'caregiver123',
    relationship: 'Son',
    profilePic: null,
  });

  const [elderly, setElderly] = useState({
    name: 'Robert (Grandpa)',
    age: '78',
    gender: 'Male',
    dob: '1948-05-12',
    phone: '+94 71 234 5678',
    address: '123 Main Street, Colombo',
    medicalNotes: 'Hypertension',
    allergies: 'Penicillin',
    doctorName: 'Dr. Smith',
    doctorContact: '+94 11 234 5678',
    deviceId: 'ESP32-8F2B'
  });

  const [sensorData, setSensorData] = useState({
    ai: {
      fall: {
        fall_probability: 0.0248,
        prediction: "no_fall",
        timestamp: "2026-08-29T04:41:13.786074+00:00"
      },
      health: {
        reasons: ["Readings are within configured ranges"],
        requires_alert: false,
        risk_score: 0,
        status: "NORMAL",
        timestamp: "2026-08-29T04:41:13.786074+00:00"
      },
      mood: {
        emotion: "neutral",
        confidence: 91,
        timestamp: "2026-08-29T05:16:12.488611+00:00"
      }
    },
    alerts: {
      "-P0AnQx8fCUTJ7Uo-_ik": {
        details: {
          health: {
            event_codes: ["FALL_DETECTED"],
            reasons: ["Possible fall detected"],
            requires_alert: true,
            risk_score: 100,
            status: "CRITICAL",
            timestamp: "2026-08-29T04:36:06.848602+00:00"
          },
          message: "Possible fall detected"
        },
        severity: "critical",
        status: "new",
        timestamp: "2026-08-29T04:36:09.970914+00:00",
        type: "FALL_DETECTED"
      }
    },
    sensors: {
      movement: {
        latest: {
          features: {
            acc_max: 21.162190790851067,
            gyro_max: 4.627253258210394
          },
          timestamp: "2026-08-29T04:41:06.305663+00:00"
        }
      },
      vitals: {
        latest: {
          heart_rate_bpm: 78,
          spo2_pct: 98,
          temperature_c: 27.5,
          humidity_pct: 62,
          timestamp: "2026-08-29T05:15:58.277796+00:00"
        }
      }
    }
  });

  async function playAlertSound() {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=emergency-alarm-with-reverb-29431.mp3' }
      );
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing alert sound', error);
    }
  }

  useEffect(() => {
    // Only attempt to connect if API key is provided
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
      const dbRef = ref(database, 'elderly/elderly_001');
      const unsubscribe = onValue(dbRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setSensorData(data);
          
          // Sound Alert Logic
          if (data.alerts) {
            let newAlertFound = false;
            Object.keys(data.alerts).forEach(alertKey => {
              const alert = data.alerts[alertKey];
              if (!knownAlertsRef.current.has(alertKey) && alert.severity === 'critical') {
                knownAlertsRef.current.add(alertKey);
                if (!isFirstFetch.current) {
                  newAlertFound = true;
                }
              }
            });

            if (newAlertFound) {
              playAlertSound();
            }
          }
          isFirstFetch.current = false;
        }
      });

      return () => unsubscribe();
    }
  }, []);

  return (
    <UserContext.Provider value={{ caregiver, setCaregiver, elderly, setElderly, sensorData, setSensorData }}>
      {children}
    </UserContext.Provider>
  );
};
