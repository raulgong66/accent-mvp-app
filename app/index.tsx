import { View, Text, Button } from "react-native";

export default function Home() {
    return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 24, marginBottom: 20 }}>
                Accent Detector 🎤
            </Text>

            <Button title="Grabar Audio" onPress={() => alert("Grabando...")} />
        </View>
    );
}