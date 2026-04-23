import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';

const API_URL = 'https://accent-mvp.onrender.com';

const FLAGS: Record<string, string> = {
  mexico: "🇲🇽", argentina: "🇦🇷", chile: "🇨🇱", colombia: "🇨🇴", peru: "🇵🇪",
  spain: "🇪🇸", usa: "🇺🇸", puerto_rico: "🇵🇷", dominican_republic: "🇩🇴",
  venezuela: "🇻🇪", ecuador: "🇪🇨", panama: "🇵🇦", el_salvador: "🇸🇻",
  bolivia: "🇧🇴", uruguay: "🇺🇾", paraguay: "🇵🇾", guatemala: "🇬🇹",
  honduras: "🇭🇳", nicaragua: "🇳🇮", costa_rica: "🇨🇷", cuba: "🇨🇺"
};

export default function Home() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<{ accent: string; confidence: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpanish, setIsSpanish] = useState(true);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
          Alert.alert("Permission", "Microphone permission is required");
          return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: recordingObject } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recordingObject);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', isSpanish ? 'No se pudo iniciar la grabación' : 'Could not start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) sendToAPI(uri);
    } catch (error) {
      Alert.alert('Error', isSpanish ? 'No se pudo detener la grabación' : 'Could not stop recording');
    }
  };

  const sendToAPI = async (audioUri: string) => {
    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);

      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setResult(response.data);

    } catch (error: any) {
      Alert.alert('Error', (isSpanish ? 'Error de conexión: ' : 'Connection error: ') + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatAccentName = (name: string) => {
    if (!name) return "";
    const key = name.toLowerCase();
    
    if (key === "dominican_republic") {
      return isSpanish ? "República Dominicana" : "Dominican Republic";
    }

    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <TouchableOpacity 
        style={styles.langSwitch} 
        onPress={() => setIsSpanish(!isSpanish)}
      >
        <Text style={styles.langText}>{isSpanish ? "🇺🇸 EN" : "🇪🇸 ES"}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>
        {isSpanish ? "Analizador de Voz" : "Voice Analyzer"}
      </Text>

      <TouchableOpacity 
        style={[styles.recordBtn, isRecording && styles.recordingActive]} 
        onPress={isRecording ? stopRecording : startRecording}
      >
        <Text style={styles.micIcon}>🎙</Text>
      </TouchableOpacity>

      <Text style={styles.statusText}>
        {isRecording 
          ? (isSpanish ? "Escuchando..." : "Listening...") 
          : (isSpanish ? "Toca para detectar acento" : "Tap to detect accent")}
      </Text>

      {loading && (
        <View style={styles.infoContainer}>
          <ActivityIndicator size="large" color="#4ade80" />
          <Text style={styles.infoText}>
            {isSpanish ? "Analizando..." : "Analyzing..."}
          </Text>
        </View>
      )}

      {result && !loading && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultFlag}>{FLAGS[result.accent.toLowerCase()] || "🌎"}</Text>
          <Text style={styles.resultAccent}>
            {formatAccentName(result.accent)}
          </Text>
          <Text style={styles.resultConfidence}>
            {isSpanish ? "Precisión" : "Confidence"}: {Math.round(result.confidence * 100)}%
          </Text>
        </View>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1128', // Dark background to match PWA
    alignItems: 'center',
    paddingTop: 40,
  },
  langSwitch: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
  },
  langText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 100,
    marginBottom: 60,
  },
  recordBtn: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  recordingActive: {
    backgroundColor: '#ff4444',
    shadowColor: '#ff4444',
    transform: [{ scale: 1.1 }],
  },
  micIcon: {
    fontSize: 60,
  },
  statusText: {
    color: '#aaa',
    marginTop: 30,
    fontSize: 16,
  },
  infoContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  infoText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 18,
  },
  resultContainer: {
    marginTop: 40,
    padding: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 25,
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  resultFlag: {
    fontSize: 50,
    marginBottom: 10,
  },
  resultAccent: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  resultConfidence: {
    fontSize: 16,
    color: '#4ade80',
    marginTop: 12,
  },
});
