import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/Ionicons";

const tabs = [
    { icon: "home-outline", label: "Home" },
    { icon: "people-outline", label: "Employee" },
    { icon: "document-text-outline", label: "Cashbook" },
    { icon: "stats-chart-outline", label: "Report" },
    { icon: "settings-outline", label: "Settings" },
];

export default function BottomBar({ activeTab = "Home", onTabPress = () => { } }) {
    return (
        <View style={styles.container}>
            {tabs.map((tab, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.tab}
                    onPress={() => onTabPress(tab.label)}
                >
                    {tab.label === activeTab && <View style={styles.activeIndicator} />}
                    <Icon
                        name={tab.icon}
                        size={22}
                        color={tab.label === activeTab ? "blue" : "#b2bec3"}
                    />
                    <Text
                        style={[
                            styles.label,
                            { color: tab.label === activeTab ? "blue" : "#b2bec3" },
                        ]}
                    >
                        {tab.label}
                    </Text>
                </TouchableOpacity>

            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",      // ⬅️ fixed to bottom
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        height: 60,
        borderTopWidth: 0.5,
        borderTopColor: "#dcdde1",
        backgroundColor: "#fff",
        justifyContent: "space-around",
        alignItems: "center",
        paddingBottom: 6,
    },

    tab: {
        alignItems: "center",
        flex: 1,
        justifyContent: "center",

    },
    label: {
        fontSize: 10,
        marginTop: 2,
    },
    activeIndicator: {
        width: 24,
        height: 3,
        borderRadius: 2,
        backgroundColor: "blue", // active color
        marginBottom: 4,
    },
});
