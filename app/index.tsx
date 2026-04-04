import React, { useState } from "react";
import { View, Button, Text, StyleSheet, Alert } from "react-native";
import { Audio } from "expo-av";
import axios from "axios";

export default function Home() {

    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [result, setResult] = useState(null);

    const API_URL = "http://192.168.1.198:8000";

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
            Alert.alert("Error", "No se pudo iniciar grabación");
        }
    };

    const stopRecording = async () => {

        if (!recording) return;

        await recording.stopAndUnloadAsync();

        const uri = recording.getURI();

        setIsRecording(false);

        if (!uri) {
            Alert.alert("Error", "No se pudo obtener el audio");
            return;
        }

        sendToAPI(uri);
    };

    const sendToAPI = async (audioUri: string) => {
        try {

            const formData = new FormData();

            if (!recording) return;

            const response = await axios.post(
                `${API_URL}/predict`,
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            console.log("API RESPONSE:", response.data);

            setResult(response.data.accent);

        } catch (error) {
            console.log(error);
            Alert.alert("Error", "Error al enviar audio");
        }
    };

    return (
        <View style={styles.container}>

            <Text style={styles.title}>Accent Detector 🎤</Text>

            <Button
                title={isRecording ? "Detener Grabación" : "Grabar Audio"}
                onPress={isRecording ? stopRecording : startRecording}
                color={isRecording ? "red" : "green"}
            />

            {result && (
                <Text style={styles.result}>
                    Acento detectado: {result}
                </Text>
            )}

        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    title: {
        fontSize: 24,
        marginBottom: 20,
    },

    result: {
        marginTop: 20,
        fontSize: 20,
        color: "green",
    },

});