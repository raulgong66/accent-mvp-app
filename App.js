import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';

const API_URL = 'https://accent-mvp-production.up.railway.app';

export default function App() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recordingObject = new Audio.Recording();
      await recordingObject.prepareToRecordAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      await recordingObject.startAsync();
      setRecording(recordingObject);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Error', 'Could not start recording');
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      sendToAPI(uri);
    } catch (error) {
      Alert.alert('Error', 'Could not stop recording');
    }
  };

  const sendToAPI = async (audioUri) => {
    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      });

      console.log('Sending audio to:', `${API_URL}/predict`);

      const response = await axios.post(`${API_URL}/predict`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('API RESPONSE:', response.data);

      // Store full result object { accent, confidence }
      setResult(response.data);

    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to send audio: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const confidencePercent = result
    ? `${Math.round(result.confidence * 100)}%`
    : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accent Detector</Text>

      <Button
        title={isRecording ? 'Recording...' : 'Record Audio'}
        onPress={isRecording ? stopRecording : startRecording}
        color={isRecording ? 'red' : 'green'}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="green" />
          <Text style={styles.loadingText}>Analyzing accent...</Text>
        </View>
      )}

      {result && !loading && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultAccent}>
            {result.accent.toUpperCase()}
          </Text>
          <Text style={styles.resultConfidence}>
            Confidence: {confidencePercent}
          </Text>
        </View>
      )}

      {/* Debug — remove before production */}
      <Text style={styles.debug}>
        DEBUG: {JSON.stringify(result)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#555',
  },
  resultContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resultAccent: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'green',
  },
  resultConfidence: {
    fontSize: 16,
    color: '#555',
    marginTop: 6,
  },
  debug: {
    position: 'absolute',
    bottom: 20,
    fontSize: 11,
    color: '#aaa',
  },
});