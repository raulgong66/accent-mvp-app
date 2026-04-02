import React, { useState } from 'react';
import { View, Button, Text, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import axios from 'axios';

export default function App() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState(null);

  const API_URL = 'https://accent-mvp-production.up.railway.app'; // CAMBIAR POR TU IP/URL

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
      Alert.alert('Error', 'No se pudo iniciar grabación');
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);

      sendToAPI(uri);
    } catch (error) {
      Alert.alert('Error', 'No se pudo detener grabación');
    }
  };

  const sendToAPI = async (audioUri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'audio.wav'
      });

      const response = await axios.post(
        `${API_URL}/predict`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setResult(response.data.accent);
      Alert.alert('Resultado', `Acento detectado: ${response.data.accent}`);
    } catch (error) {
      Alert.alert('Error', 'Error al enviar: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Accent Detector</Text>

      <Button
        title={isRecording ? 'Grabando...' : 'Grabar Audio'}
        onPress={isRecording ? stopRecording : startRecording}
        color={isRecording ? 'red' : 'green'}
      />

      {result && (
        <Text style={styles.result}>
          Acento: {result}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30
  },
  result: {
    fontSize: 18,
    marginTop: 20,
    fontWeight: 'bold',
    color: 'green'
  }
});