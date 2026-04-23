import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator, SafeAreaView, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';

const API_URL = 'https://accent-mvp.onrender.com';
const DONATION_DURATION = 20000; // 20 seconds

const COUNTRIES = [
  { id: 'dominican_republic', name: 'República Dominicana', flag: '🇩🇴' },
  { id: 'venezuela', name: 'Venezuela', flag: '🇻🇪' },
  { id: 'mexico', name: 'México', flag: '🇲🇽' },
  { id: 'puerto_rico', name: 'Puerto Rico', flag: '🇵🇷' },
  { id: 'cuba', name: 'Cuba', flag: '🇨🇺' },
  { id: 'colombia', name: 'Colombia', flag: '🇨🇴' },
  { id: 'spain', name: 'España', flag: '🇪🇸' },
  { id: 'argentina', name: 'Argentina', flag: '🇦🇷' },
  { id: 'chile', name: 'Chile', flag: '🇨🇱' },
  { id: 'peru', name: 'Perú', flag: '🇵🇪' },
  { id: 'ecuador', name: 'Ecuador', flag: '🇪🇨' },
  { id: 'guatemala', name: 'Guatemala', flag: '🇬🇹' },
  { id: 'bolivia', name: 'Bolivia', flag: '🇧🇴' },
  { id: 'honduras', name: 'Honduras', flag: '🇭🇳' },
  { id: 'paraguay', name: 'Paraguay', flag: '🇵🇾' },
  { id: 'el_salvador', name: 'El Salvador', flag: '🇸🇻' },
  { id: 'nicaragua', name: 'Nicaragua', flag: '🇳🇮' },
  { id: 'costa_rica', name: 'Costa Rica', flag: '🇨🇷' },
  { id: 'panama', name: 'Panamá', flag: '🇵🇦' },
  { id: 'uruguay', name: 'Uruguay', flag: '🇺🇾' },
  { id: 'equatorial_guinea', name: 'Guinea Ecuatorial', flag: '🇬🇶' },
  { id: 'usa', name: 'USA (Hispano)', flag: '🇺🇸' },
];

export default function DonateScreen() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSpanish, setIsSpanish] = useState(true);

  const startDonationRecording = async () => {
    if (!selectedCountry) {
      Alert.alert("Atención", isSpanish ? "Selecciona un país primero" : "Select a country first");
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording: recordingObject } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recordingObject);
      setIsRecording(true);

      // Auto-stop after 20s
      setTimeout(() => {
        setIsRecording(prev => {
          if (prev) stopAndSend();
          return false;
        });
      }, DONATION_DURATION);

    } catch (err) {
      Alert.alert("Error", "Could not start recording");
    }
  };

  const stopAndSend = async () => {
    if (!recording) return;
    setIsRecording(false);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) uploadAudio(uri);
    } catch (err) {
      console.error(err);
    }
  };

  const uploadAudio = async (uri: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      
      // Using a more generic object for the file to satisfy legacy server parsers
      const fileData = {
        uri: uri,
        type: 'audio/m4a',
        name: 'donation.m4a',
      };

      formData.append('audio', fileData as any);
      formData.append('country', selectedCountry!);

      console.log('Donating to Simply.com/upload.php...');

      const response = await fetch('https://dulcecare.se/upload.php', {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        // If it's not JSON, it's probably an HTML error from PHP
        Alert.alert("Server Response (HTML)", responseText.substring(0, 200));
        return;
      }

      if (data && data.success) {
        Alert.alert("¡Gracias!", isSpanish ? "Tu voz ayudará a mejorar el modelo." : "Your voice successfully uploaded.");
      } else {
        Alert.alert("Server Error", data.error || "Unknown server error");
      }

    } catch (err: any) {
      console.error("DEBUG:", err);
      Alert.alert("Upload Error", err.message || "Network request failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <Text style={styles.header}>
          {isSpanish ? "Ayúdanos a Mejorar" : "Help Us Improve"}
        </Text>
        
        <Text style={styles.instruction}>
          {isSpanish 
            ? "Menciona tu edad, ciudad y dispositivo durante la grabación de 20s." 
            : "State your age, city and device during the 20s recording."}
        </Text>

        <Text style={styles.sectionTitle}>
          {isSpanish ? "1. Selecciona tu país" : "1. Select your country"}
        </Text>

        <View style={styles.grid}>
          {COUNTRIES.map((c) => (
            <TouchableOpacity 
              key={c.id} 
              style={[styles.countryCard, selectedCountry === c.id && styles.selectedCard]}
              onPress={() => setSelectedCountry(c.id)}
            >
              <Text style={styles.flagIcon}>{c.flag}</Text>
              <Text style={styles.countryName}>{c.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.actionSection}>
          {isUploading ? (
            <ActivityIndicator size="large" color="#4ade80" />
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.donateBtn, isRecording && styles.recordingBtn]} 
                onPress={isRecording ? stopAndSend : startDonationRecording}
              >
                <Text style={styles.donateBtnText}>
                  {isRecording 
                    ? (isSpanish ? "Detener (20s máx)" : "Stop (20s max)") 
                    : (isSpanish ? "🎙 Grabar Donación" : "🎙 Record Donation")}
                </Text>
              </TouchableOpacity>
              {isRecording && <Text style={styles.timerText}>{isSpanish ? "Grabando clip de 20s..." : "Recording 20s clip..."}</Text>}
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1128',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  instruction: {
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    color: '#4ade80',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  countryCard: {
    width: (Dimensions.get('window').width / 2) - 35,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#4ade80',
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  flagIcon: {
    fontSize: 30,
    marginBottom: 5,
  },
  countryName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  actionSection: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  donateBtn: {
    backgroundColor: '#4ade80',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  recordingBtn: {
    backgroundColor: '#ff4444',
  },
  donateBtnText: {
    color: '#0a1128',
    fontSize: 18,
    fontWeight: 'bold',
  },
  timerText: {
    color: '#ff4444',
    marginTop: 15,
    fontWeight: 'bold',
  }
});
