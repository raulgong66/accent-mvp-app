import React, { useState } from "react";
import { View, Button, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Audio } from "expo-av";
import axios from "axios";

const API_URL = "https://accent-mvp-production.up.railway.app";

const ACCENT_FLAGS: Record<string, string> = {
    cuba: "🇨🇺",
    mexico: "🇲🇽",
    argentina: "🇦🇷",
    chile: "🇨🇱",
    colombia: "🇨🇴",
    "puerto rico": "🇵🇷",
    dominicana: "🇩🇴",
    venezuela: "🇻🇪",
    uruguay: "🇺🇾",
    guatemala: "🇬🇹",
};

export default function Home() {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [result, setResult] = useState<{ accent: string; confidence: number } | null>(null);
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
            Alert.alert("Error", "Could not start recording");
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setIsRecording(false);
        if (!uri) {
            Alert.alert("Error", "Could not get audio URI");
            return;
        }
        sendToAPI(uri);
    };

    const sendToAPI = async (audioUri: string) => {
        try {
            setLoading(true);
            setResult(null);

            const formData = new FormData();
            formData.append("file", {
                uri: audioUri,
                type: "audio/m4a",
                name: "audio.m4a",
            } as any);

            console.log("Sending audio to:", `${API_URL}/predict`);

            const response = await axios.post(`${API_URL}/predict`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            console.log("API RESPONSE:", response.data);
            setResult(response.data);

        } catch (error) {
            console.log("AXIOS ERROR:", error);
            Alert.alert("Error", "Failed to send audio");
        } finally {
            setLoading(false);
        }
    };

    const confidencePercent = result
        ? `${Math.round(result.confidence * 100)}%`
        : null;

    const flag = result
        ? (ACCENT_FLAGS[result.accent.toLowerCase()] ?? "🏳️")
        : null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Accent Detector 🎤</Text>
            <Text style={styles.subtitle}>Speak for a few seconds</Text>

            <View style={styles.buttonWrapper}>
                <Button
                    title={isRecording ? "Stop Recording" : "Record Audio"}
                    onPress={isRecording ? stopRecording : startRecording}
                    color={isRecording ? "#ff4d4d" : "#1DB954"}
                />
            </View>

            {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1DB954" />
                    <Text style={styles.loadingText}>Analyzing accent...</Text>
                </View>
            )}

            {result && !loading && (
                <View style={styles.resultContainer}>
                    <Text style={styles.resultFlag}>{flag}</Text>
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
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0e0e10",
        padding: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#e8e6e0",
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: "#888780",
        marginBottom: 36,
    },
    buttonWrapper: {
        width: 200,
    },
    loadingContainer: {
        marginTop: 32,
        alignItems: "center",
        gap: 12,
    },
    loadingText: {
        fontSize: 15,
        color: "#888780",
    },
    resultContainer: {
        marginTop: 36,
        alignItems: "center",
        backgroundColor: "#18181c",
        borderRadius: 16,
        paddingVertical: 24,
        paddingHorizontal: 40,
        borderWidth: 1,
        borderColor: "#2a2a30",
    },
    resultFlag: {
        fontSize: 64,
        marginBottom: 8,
    },
    resultAccent: {
        fontSize: 32,
        fontWeight: "bold",
        color: "#1DB954",
        letterSpacing: 2,
    },
    resultConfidence: {
        fontSize: 15,
        color: "#1DB954",
        marginTop: 8,
    },
    debug: {
        position: "absolute",
        bottom: 20,
        fontSize: 11,
        color: "#444",
    },
});
