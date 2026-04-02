import { View, Text, Button } from "react-native";
import { useState } from "react";
import { Audio } from "expo-av";
import axios from "axios";

export default function Home() {

    const [recording, setRecording] = useState(null);
    const [recordingState, setRecordingState] = useState(false);

    async function startRecording() {

        const permission = await Audio.requestPermissionsAsync();
        if (!permission.granted) return;

        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true
        });

        const rec = new Audio.Recording();

        await rec.prepareToRecordAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        await rec.startAsync();

        setRecording(rec);
        setRecordingState(true);
    }

    async function stopRecording() {

        if (!recording) return;

        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();

        console.log("Audio:", uri);
        sendAudioToAPI(uri);

        setRecording(null);
        setRecordingState(false);
    }
    async function sendAudioToAPI(uri) {

        const formData = new FormData();

        formData.append("file", {
            uri: uri,
            type: "audio/m4a",
            name: "audio.m4a"
        });

        try {

            const response = await axios.post(
                "http://192.168.1.198:8000/predict",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data"
                    }
                }
            );

            console.log("Prediction:", response.data);

        } catch (error) {

            console.log("Error sending audio:", error);

        }

    }

    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>

            <Text style={{ fontSize: 24, marginBottom: 20 }}>
                Accent Detector 🎤
            </Text>

            <Button
                title={recordingState ? "Detener grabación" : "Grabar Audio"}
                onPress={recordingState ? stopRecording : startRecording}
            />

        </View>
    );
}