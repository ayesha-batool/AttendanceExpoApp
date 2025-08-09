import React, { useEffect, useRef, useState } from "react";
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const CentralBox = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef(null);

  const data = [
    {
      title: "Manage Employees, Attendance, Payroll",
      image: require("../assets/images/img1.png"),
    },
    {
      title: "Manage Business Cashbook, Fines, Advances",
      image: require("../assets/images/img2.png"),
    },
    {
      title: "Manage Vehicle Expenses and Logbook",
      image: require("../assets/images/img3.png"),
    },
    {
      title: "Detailed Reports",
      image: require("../assets/images/img4.png"),
    },
    {
      title: "Desktop and Employee App Access",
      image: require("../assets/images/img5.png"),
    },
  ];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === data.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [data.length]);

  const handleDotPress = (index) => {
    setCurrentIndex(index);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === data.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
  };

  const renderCurrentItem = () => {
    const { width: screenWidth } = Dimensions.get("window");
    // Better sizing for big screens
    const maxImageWidth = screenWidth > 768 ? 500 : screenWidth * 0.85;
    const imageWidth = Math.min(maxImageWidth, screenWidth * 0.85);
    const imageHeight = imageWidth * 0.56;

    const item = data[currentIndex];
    return (
      <View style={[styles.card, { width: imageWidth }]}>
        <View style={styles.cardContent}>
          <Image
            source={item.image}
            style={{
              width: imageWidth,
              height: imageHeight,
              resizeMode: "contain",
              marginBottom: 15,
            }}
          />
          <Text
            style={[
              styles.text,
              { fontSize: screenWidth < 360 ? 14 : screenWidth > 768 ? 18 : 16 },
            ]}
          >
            {item.title}
          </Text>
        </View>
      </View>
    );
  };

  const renderDots = () => (
    <View style={styles.dots}>
      {data.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.dot,
            index === currentIndex
              ? styles.activeDot
              : styles.inactiveDot,
          ]}
          onPress={() => handleDotPress(index)}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.itemContainer}>{renderCurrentItem()}</View>
      {renderDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 0,
  },
  itemContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderRadius: 15,
    margin: 10,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 22,
    color: "#333",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: "#007AFF",
    width: 26,
    height: 13,
    borderRadius: 8,
    marginTop: -1,
  },
  inactiveDot: {
    backgroundColor: "#007AFF",
    opacity: 0.3,
  },
});

export default CentralBox;
